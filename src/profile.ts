// Deployment profile: discovered automatically on first run and cached locally.
//
// The MCP ships with ZERO deployment-specific values. On first use (or when the
// cache is stale / explicitly refreshed) it reads the deployment's structure in a
// series of read-only requests and caches the result in a local JSON file (no
// credentials are ever written there):
//
//   products  (id / name / code / status + per-product executions, modules, builds)
//   projects  (global id -> name map)
//   features  (module-browse direct route available? testcase feature point? ...)
//   savedQueries (user-saved search queries, bug + story)
//
// Location: config.profilePath (default next to the env file,
// override with ZENTAO_PROFILE_FILE). TTL: ZENTAO_PROFILE_TTL_HOURS (default 24).
// Every sub-probe is individually fault-tolerant: one dead route records a
// warning and never blocks the rest of the discovery.

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ZentaoClient } from './client.js';
import { logErr } from './config.js';

export const PROFILE_VERSION = 1;

export interface ProfileExecution { id: number; name: string; code?: string; status?: string; begin?: string; end?: string }
export interface ProfileModule { id: number; name: string; parent: number; sort?: number; path?: string }
export interface ProfileBuild { id: number | string; name: string }
export interface ProfileProduct {
  id: number;
  name: string;
  code?: string;
  status?: string;
  modules?: ProfileModule[];
  moduleSource?: 'module-browse' | 'product-browse-fallback';
  builds?: ProfileBuild[];
}
export interface ProfileSavedQuery { queryID: number; title: string }
// Per-field metadata parsed from the search form's own field config (bugparams/storyparams):
// deployment-native default operator, control type, date flag, select value domain.
export interface ProfileFieldMeta { operator: string; control: 'input' | 'select'; date: boolean; values?: string[] }
export interface Profile {
  version: number;
  fetchedAt: string;
  baseUrl: string;
  account: string;
  products: ProfileProduct[];      // sorted by id desc (most recently created first)
  projects: { id: number; name: string; executions?: ProfileExecution[] }[];
  features: {
    moduleBrowseDirect: boolean;   // dedicated module route answered with JSON
    testcase: 'enabled' | 'denied' | 'unknown';
    searchAdhoc: 'enabled' | 'denied' | 'unknown'; // ad-hoc server search (search-buildQuery) works?
    searchFields: { bug: string[]; story: string[]; task: string[] }; // valid condition fields (empty = unknown/disabled)
    searchFieldMeta: { bug: Record<string, ProfileFieldMeta>; story: Record<string, ProfileFieldMeta>; task: Record<string, ProfileFieldMeta> }; // per-field default operator / control / value domain
  };
  savedQueries: { bug: ProfileSavedQuery[]; story: ProfileSavedQuery[] };
  warnings: string[];
}

export function loadProfile(config: { profilePath: string }): Profile | null {
  try {
    if (!fs.existsSync(config.profilePath)) return null;
    const p = JSON.parse(fs.readFileSync(config.profilePath, 'utf8')) as Profile;
    if (!p || p.version !== PROFILE_VERSION || !Array.isArray(p.products)) {
      logErr('profile at ' + config.profilePath + ' has unknown version/shape; will re-discover');
      return null;
    }
    return p;
  } catch (e: any) {
    logErr('profile unreadable (' + config.profilePath + '): ' + e.message + '; will re-discover');
    return null;
  }
}

export function isFresh(p: Profile, ttlMs: number): boolean {
  return Date.now() - Date.parse(p.fetchedAt) < ttlMs;
}

export function saveProfile(config: { profilePath: string }, p: Profile): void {
  try {
    fs.mkdirSync(path.dirname(config.profilePath), { recursive: true });
    const tmp = config.profilePath + '.tmp-' + process.pid;
    fs.writeFileSync(tmp, JSON.stringify(p, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, config.profilePath);
  } catch (e: any) {
    logErr('profile save failed (' + config.profilePath + '): ' + e.message);
  }
}

export function primaryProduct(p: Profile | null): ProfileProduct | null {
  if (!p || !p.products.length) return null;
  return p.products[0]; // id desc
}

// Safety cap for discovery on pathological deployments.
const MAX_PRODUCTS = 25;

// Full read-only discovery. Caller is responsible for login (client is ready).
export async function bootstrapProfile(client: ZentaoClient): Promise<Profile> {
  const cfg = client.config;
  const warnings: string[] = [];
  const t0 = Date.now();
  logErr('profile: starting first-run discovery of ' + cfg.baseUrl + ' ...');

  const p: Profile = {
    version: PROFILE_VERSION,
    fetchedAt: new Date().toISOString(),
    baseUrl: cfg.baseUrl,
    account: cfg.account,
    products: [],
    projects: [],
    features: { moduleBrowseDirect: false, testcase: 'unknown', searchAdhoc: 'unknown', searchFields: { bug: [], story: [], task: [] }, searchFieldMeta: { bug: {}, story: {}, task: {} } },
    savedQueries: { bug: [], story: [] },
    warnings
  };

  // 1. Global product + project name maps (one request each).
  const [pRes, eRes] = await Promise.allSettled([
    client.viewJson('/product-browse-all.json'),
    client.viewJson('/project-browse-all.json')
  ]);
  if (pRes.status === 'fulfilled') {
    const raw = ((pRes.value as any).products || {});
    for (const [id, name] of Object.entries(raw)) p.products.push({ id: Number(id), name: String(name) });
  } else warnings.push('product-browse-all: ' + pRes.reason?.message);
  if (eRes.status === 'fulfilled') {
    const raw = ((eRes.value as any).projects || {});
    for (const [id, name] of Object.entries(raw)) p.projects.push({ id: Number(id), name: String(name) });
  } else warnings.push('project-browse-all: ' + eRes.reason?.message);
  p.products.sort((a, b) => b.id - a.id);
  p.projects.sort((a, b) => b.id - a.id);
  const capped = p.products.slice(0, MAX_PRODUCTS);
  if (p.products.length > capped.length) warnings.push('products capped at ' + MAX_PRODUCTS + ' of ' + p.products.length);
  p.products = capped;

  // 2. Per-product detail: code/status, module tree, builds.
  for (const prod of p.products) {
    // 2a. code + status
    try {
      const v = await client.viewJson('/product-view-' + prod.id + '.json');
      const pv = (v as any).product || {};
      prod.code = pv.code || undefined;
      prod.status = pv.status || undefined;
    } catch (e: any) { warnings.push('product-view-' + prod.id + ': ' + e.message); }
    // 2b. module tree (with fallback; records which route worked)
    try {
      const t = await client.getModuleTree(prod.id, 'profile discovery');
      prod.modules = t.modules.map((m: any) => ({ id: Number(m.id), name: m.name || '', parent: Number(m.parent || 0), sort: m.sort, path: m.path }));
      prod.moduleSource = t.source;
      if (t.source === 'module-browse') p.features.moduleBrowseDirect = true;
    } catch (e: any) { warnings.push('modules-' + prod.id + ': ' + e.message); }
    // 2d. builds
    try {
      const builds = await client.getProductBuilds(prod.id);
      prod.builds = builds.map(b => ({ id: b.id, name: b.name || '' }));
    } catch (e: any) { warnings.push('builds-' + prod.id + ': ' + e.message); }
  }

  // 2e. Per-project executions (iterations). The execution-browse route is keyed by
  // PROJECT id; some deployments disable it (0-byte body) — recorded as a warning.
  const projCapped = p.projects.slice(0, 15);
  for (const proj of projCapped) {
    try {
      const { rows } = await client.fetchAllPaginated('/execution-browse-' + proj.id, { rowKey: 'executions', perPage: 1000, maxPages: 10 });
      proj.executions = rows.map((e: any) => ({ id: Number(e.id), name: e.name || '', code: e.code, status: e.status, begin: e.begin, end: e.end }));
    } catch (e: any) {
      if (/Non-JSON/.test(String(e.message))) { if (proj === projCapped[0]) warnings.push('execution browse route disabled on this deployment'); }
      else warnings.push('execution-browse-' + proj.id + ': ' + e.message);
    }
  }

  // 3. Feature probes (cheap, on the primary product).
  const primary = primaryProduct(p);
  if (primary) {
    try {
      // NOTE: probe /case-browse (testcase 用例), NOT /testcase-browse (which is the
      // 测试任务 testtask module on ZenTao — a different feature point).
      const r = await client._get(cfg.baseUrl + '/case-browse-' + primary.id + '.html', { 'X-Requested-With': 'XMLHttpRequest' });
      const text = await r.text();
      // A 0-byte 200 body is the signature of a feature point that is not enabled for
      // this account (same as the disabled module-browse route); deny-text also counts.
      if (r.status === 403 || text.length === 0 || /user-deny|forbidden|no permission/i.test(text)) p.features.testcase = 'denied';
      else p.features.testcase = 'enabled';
    } catch { p.features.testcase = 'unknown'; }

    // 3b. Ad-hoc server search probe (search-buildQuery): attempt one throwaway query;
    // a generated queryID means the search feature point works. ALWAYS clean up on success.
    try {
    const qid = await client.buildAdhocQuery('bug', [{ field: 'title', operator: 'include', value: 'mcp-profile-probe' }], primary.id, 0);
    if (qid) {
      p.features.searchAdhoc = 'enabled';
      if (typeof qid === 'number') {
        // Row mode: clean up the temporary query row. Session mode ('myQueryID'): no row created.
        const cleaned = await client.deleteQuery(qid);
        if (!cleaned) warnings.push('searchAdhoc probe created query ' + qid + ' but cleanup failed (left for manual removal)');
      }
    } else {
      p.features.searchAdhoc = 'denied';
    }
  } catch { p.features.searchAdhoc = 'unknown'; }
  }

  // 4. Saved search queries (bug + story build-form pages).
  for (const kind of ['bug', 'story'] as const) {
    try {
      const r = await client._get(cfg.baseUrl + '/search-buildForm-' + kind + '.html', { 'X-Requested-With': 'XMLHttpRequest' });
      if (r.status === 200) {
        const html = await r.text();
        p.savedQueries[kind] = client.parseSavedQueriesHtml(html);
        const meta = client.parseSearchFieldMeta(html);
        if (Object.keys(meta).length) {
          p.features.searchFields[kind] = Object.keys(meta);
          p.features.searchFieldMeta[kind] = meta;
        } else {
          p.features.searchFields[kind] = client.parseSearchFieldParams(html);
        }
      }
    } catch (e: any) { warnings.push('saved-queries-' + kind + ': ' + e.message); }
  }

  logErr('profile: discovery done in ' + ((Date.now() - t0) / 1000).toFixed(1) + 's — ' +
    p.products.length + ' products, ' + p.projects.length + ' projects, ' +
    p.warnings.length + ' warnings');
  return p;
}

// Singleton in-flight guard: concurrent callers share one bootstrap.
let inflight: Promise<Profile> | null = null;

export async function ensureProfile(client: ZentaoClient, force = false): Promise<Profile> {
  const cfg = client.config;
  if (!force) {
    const cached = loadProfile(cfg);
    if (cached && isFresh(cached, cfg.profileTtlMs)) return cached;
  }
  if (!inflight) {
    inflight = (async () => {
      try { return await bootstrapProfile(client); }
      finally { inflight = null; }
    })();
  }
  const p = await inflight;
  saveProfile(cfg, p);
  return p;
}
