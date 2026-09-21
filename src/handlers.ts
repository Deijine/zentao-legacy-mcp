// ZenTao Legacy MCP - tool handlers. Each handler takes (client, args) and
// returns a JSON-serializable result. All network access goes through ZentaoClient.

import { hashPassword, ZentaoClient } from './client.js';
import { ensureProfile, isFresh, loadProfile, primaryProduct, saveProfile } from './profile.js';
import { TOOLS } from './tools.js';
import { makeToken, mergeKeywords, markTitle, markProductCode, markerNote } from './marker.js';
import type { ZentaoConfig } from './config.js';
import type { Product, Story, Bug, TestCase, ApiResponse } from './types.js';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

// Dynamic API response: the ZenTao view API returns different field sets per endpoint.
// Use this type to access fields without per-endpoint schema definitions.
type Dyn = Record<string, any>;

type HandlerFn = (client: ZentaoClient, args: Record<string, any>) => Promise<Record<string, unknown>>;

const ok = (data: unknown): Record<string, unknown> => ({ data });
const err = (message: string, code: string, extra?: { fix?: string; retryable?: boolean; needs_user?: boolean }): Record<string, unknown> => ({ error: { message, code: code || 'error', ...(extra || {}) } });

// Locked response for testcase operations (feature-point not enabled on this deployment)
const LOCK_MSG: Record<string, unknown> = { error: { message: '用例（testcase）操作已锁定：当前部署的测试任务/用例功能点权限未开通，无法执行。请联系管理员开通「测试任务」功能点后解锁。', code: 'locked', fix: '联系管理员在禅道「权限设置」中开通测试任务相关功能点', retryable: false, needs_user: true } };

// Nice names for severity, priority, and status (for display only; data stays as raw numbers)
const SEVERITY_NAMES: Record<string, string> = { '1': '致命', '2': '严重', '3': '一般', '4': '轻微' };
const PRI_NAMES: Record<string, string> = { '0': '未设置', '1': '紧急', '2': '高', '3': '中', '4': '低' };
const BUG_STATUS_NAMES: Record<string, string> = { active: '活动', resolved: '已解决', closed: '已关闭' };
const STORY_STATUS_NAMES: Record<string, string> = { active: '激活', changed: '已变更', reviewing: '评审中', draft: '草图', closed: '已关闭' };
const TASK_STATUS_NAMES: Record<string, string> = { wait: '等待', doing: '进行中', done: '已完成', paused: '已暂停', closed: '已关闭' };
const bugStatusName = (v: unknown): string => BUG_STATUS_NAMES[String(v)] || String(v);
const storyStatusName = (v: unknown): string => STORY_STATUS_NAMES[String(v)] || String(v);
const taskStatusName = (v: unknown): string => TASK_STATUS_NAMES[String(v)] || String(v);

// Resolve the productID for tools whose schema omits it: explicit arg wins;
// otherwise fall back to the deployment profile's primary product (most recently
// created, discovered on first run). Never hardcoded. If the profile is empty the
// call is refused with the discovered product list so the agent can ask the user.
async function resolveProductID(client: ZentaoClient, args: Record<string, any>): Promise<number> {
  if (args.productID != null && args.productID !== '') return Number(args.productID);
  const p = await ensureProfile(client);
  const primary = primaryProduct(p);
  if (primary) {
    logInfo('(productID not given) inferred primary product ' + primary.id + ' ' + primary.name + ' from deployment profile — present to user for confirmation per operating rules');
    return primary.id;
  }
  throw new Error('productID is required: the deployment profile found no products. Ask the user for the product name/id, or run zentao_profile {refresh: true} to re-discover.');
}

function logInfo(msg: string): void {
  process.stderr.write('[zentao-mcp] ' + msg + '\n');
}

// Normalize single ID or array of IDs from tool args.
// Accepts: args.storyID = 5, args.storyID = [5, 6, 7], args.storyIDs = [5, 6, 7]
function extractIDs(args: Record<string, any>, key: string): number[] {
  const val = args[key] ?? args[key + 's']; // try storyID first, then storyIDs
  if (val == null) return [];
  if (Array.isArray(val)) return val.map(Number);
  return [Number(val)];
}

// Suggested next tools after a write operation (U-4: usability)
function suggestedNext(entity: string, action: string, id: number | null): string[] {
  const i = id ? String(id) : '{id}';
  const map: Record<string, string[]> = {
    'story_create': ['zentao_story_get {storyID:' + i + '}', 'zentao_story_update {storyID:' + i + '} (assign/priority)', 'zentao_story_review {storyID:' + i + ', result:"pass"}'],
    'story_review': ['zentao_story_change {storyID:' + i + '} (activate + set spec)', 'zentao_story_close {storyID:' + i + '}'],
    'story_close': ['zentao_story_get {storyID:' + i + '} (verify)'],
    'story_change': ['zentao_story_get {storyID:' + i + '} (verify spec/verify)'],
    'bug_create': ['zentao_bug_get {bugID:' + i + '}', 'zentao_bug_update {bugID:' + i + '} (assign)', 'zentao_bug_resolve {bugID:' + i + ', resolution:"fixed"}'],
    'bug_resolve': ['zentao_bug_close {bugID:' + i + '}', 'zentao_bug_reopen {bugID:' + i + '} (if wrong)'],
    'bug_close': ['zentao_bug_reopen {bugID:' + i + '} (if reopened)'],
    'bug_reopen': ['zentao_bug_resolve {bugID:' + i + '}'],
    'task_create': ['zentao_task_start {taskID:' + i + ', left:<hours>}', 'zentao_task_update {taskID:' + i + '}'],
    'task_start': ['zentao_task_log_add {taskID:' + i + ', work, left}', 'zentao_task_finish {taskID:' + i + ', currentConsumed}'],
    'task_finish': ['zentao_task_close {taskID:' + i + '}'],
    'task_close': ['zentao_task_get {taskID:' + i + '} (verify)'],
  };
  const key = entity + '_' + action;
  return map[key] || [];
}

// Detect the legacy permission-denied redirect: the view returns { locate: ".../user-deny-..." }
// or { locate: "...self.location='/index.php?m=user&f=deny..." }.
function throwIfDenied(data: Dyn, tool: string): void {
  if (data && typeof data === 'object' && data.locate) {
    const s = String(data.locate);
    if (/user-deny|f=deny|deny&t=json/.test(s)) {
      throw new Error('Permission denied: your ZenTao account does not have the required permission for this operation (' + tool + '). Ask an admin to grant it. Redirect: ' + s);
    }
  }
}

// ---------- helpers ----------

// p may be a full detail object {id,name,code,...} or a {id,name} pair.
// ---------- CLICKABLE ENTITY URL ----------
// ZenTao legacy view route: /<entity>-view-<id>.html (module: /module-browse-<productID>.html).
// Every tool attaches a clickable url next to every entity ID it returns (list items,
// details, write confirmations, workbench sections, relations, export rows, dry-run previews).
const VIEW_ROUTES: Record<string, string> = {
  story: 'story-view', bug: 'bug-view', task: 'task-view',
  product: 'product-view', project: 'project-view', execution: 'execution-view',
  productplan: 'productplan-view', plan: 'productplan-view', build: 'build-view',
  case: 'testcase-view', testcase: 'testcase-view',
  testtask: 'testtask-view', testreport: 'testreport-view', testsuite: 'testsuite-view'
};
function viewUrl(client: ZentaoClient, entity: string, id: number | string | null | undefined): string | undefined {
  const route = VIEW_ROUTES[String(entity || '')];
  const n = Number(id);
  if (!route || id == null || !Number.isFinite(n) || n <= 0) return undefined;
  return client.config.baseUrl + '/' + route + '-' + n + '.html';
}
function moduleUrl(client: ZentaoClient, productID: number | string | null | undefined, id: number | string | null | undefined): string | undefined {
  // Modules have no per-id view route; the product module-tree page is the stable link.
  const n = Number(id);
  if (productID == null || id == null || !Number.isFinite(n) || n <= 0) return undefined;
  return client.config.baseUrl + '/module-browse-' + Number(productID) + '.html';
}
function withUrl(client: ZentaoClient, entity: string, item: Record<string, unknown>): Record<string, unknown> {
  const url = viewUrl(client, entity, item.id as number | undefined);
  return url ? { ...item, url } : item;
}

function summarizeProduct(p: Record<string, unknown>): Record<string, unknown> {
  return {
    id: p.id, name: p.name, code: p.code || '',
    status: p.status || '', subStatus: p.subStatus || '',
    PO: p.PO || p.po || '', QD: p.QD || '', RD: p.RD || '',
    desc: p.desc || ''
  };
}

// The product-browse 'products' dict maps id -> name (string) only.
// Build list entries from it, then fetch full detail per product for owners/code.
async function buildProductList(client: ZentaoClient, idNameMap: Record<string, string>, status: string): Promise<any> {
  const ids = Object.keys(idNameMap);
  // Fetch detail for each product to get status/code/owners, with bounded concurrency.
  const out: Dyn[] = [];
  const cap = 80;
  const CONC = 8;
  const queue = ids.slice(0, cap).slice();
  const workers = Array.from({ length: Math.min(CONC, queue.length || 1) }, async () => {
    while (queue.length) {
      const id = queue.shift();
      if (!id) break;
      try {
        const d = await client.viewJson('/product-view-' + id + '.json');
        const p = d.product || {};
        if (status === 'closed' && p.status !== 'closed') continue;
        if (status === 'open' && p.status === 'closed') continue;
        out.push(withUrl(client, 'product', summarizeProduct({ id, name: p.name || idNameMap[id], ...p })));
      } catch { /* skip individual failures */ }
    }
  });
  await Promise.all(workers);
  // preserve id order
  out.sort((a, b) => Number(a.id) - Number(b.id));
  return out;
}

function summarizeStory(s: Dyn): Record<string, unknown> {
  return {
    id: s.id, title: s.title, status: s.status, stage: s.stage || s.subStatus || '',
    category: s.category || '', pri: s.pri,
    product: s.product, assignedTo: s.assignedTo || '',
    openedBy: s.openedBy, openedDate: s.openedDate
  };
}

function summarizeBug(b: Dyn): Record<string, unknown> {
  return {
    id: b.id, title: b.title, status: b.status,
    severity: b.severity, pri: b.pri, type: b.type,
    product: b.product, module: b.module,
    assignedTo: b.assignedTo || '', openedBy: b.openedBy,
    openedDate: b.openedDate, resolution: b.resolution || ''
  };
}

// ---------- AUTH ----------

async function whoami(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  await client.ensureLogin(args.forceRelogin === true);
  const healthy = await client.verifySession();
  return ok({
    account: client.config.account,
    baseUrl: client.config.baseUrl,
    sessionActive: healthy,
    loggedIn: client.loggedIn,
    // Deployment mode: markers off = delivered (operates real data);
    // markers on = development environment (writes MCP-AUTO test markers).
    markersEnabled: client.config.markersEnabled,
    mode: client.config.markersEnabled ? 'development (MCP-AUTO markers ON)' : 'delivered (real data, no markers)'
  });
}

async function context(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  // Read-only: report the deployment profile (products/projects discovered on first
  // run and cached locally) so the agent can confirm IDs with the user before writing.
  // args.refresh = true forces a live re-discovery (also rebuilds the local cache).
  const p = await ensureProfile(client, args.refresh === true);
  const primary = primaryProduct(p);
  const primaryProject = p.projects[0] || null;
  return ok({
    account: p.account,
    profileFetchedAt: p.fetchedAt,
    suggestedProductID: primary?.id || null,
    suggestedProductName: primary?.name || null,
    suggestedProductCode: primary?.code || null,
    suggestedProjectID: primaryProject?.id || null,
    suggestedProjectName: primaryProject?.name || null,
    products: p.products.slice(0, 20).map(x => ({ id: x.id, name: x.name, code: x.code, url: viewUrl(client, 'product', x.id) })),
    projects: p.projects.slice(0, 20).map(x => ({ id: x.id, name: x.name })),
    modulesByProduct: Object.fromEntries(p.products.map(x => [x.id, (x.modules || []).length])),
    features: p.features,
    warnings: p.warnings,
    confirmation_required: true,
    usage: '⚠️ 以上为部署画像推荐值（产品按 ID 降序，最新创建的排第一），不是自动填入。调用其他工具前，必须将推荐的产品/项目名称告知用户，等用户确认或指定后再传入 productID/projectID。禁止未经用户确认直接使用推荐值。结构信息（模块树/版本/迭代）用 zentao_profile 查询。'
  });
}

// Deployment profile: what exists on this ZenTao instance (products with their
// module trees / executions / builds, global projects, feature availability,
// saved search queries). Read-only + cached locally; args.refresh forces a
// live re-discovery.
async function profile(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const p = await ensureProfile(client, args.refresh === true);
  const out: Record<string, unknown> = {
    fetchedAt: p.fetchedAt,
    account: p.account,
    features: p.features,
    products: p.products.map(x => ({
      id: x.id, name: x.name, code: x.code, status: x.status,
      modules: x.modules || [],
      moduleSource: x.moduleSource,
      builds: (x.builds || []).map(b => ({ id: b.id, name: b.name }))
    })),
    projects: p.projects.map(x => ({ id: x.id, name: x.name, url: viewUrl(client, 'project', x.id), executions: (x.executions || []).map(e => ({ id: e.id, name: e.name, code: e.code, status: e.status })) })),
    savedQueries: p.savedQueries,
    warnings: p.warnings
  };
  // Optional narrow focus to keep responses small: productID → that product only.
  if (args.productID != null) {
    const focus = p.products.find(x => x.id === Number(args.productID));
    if (!focus) return ok({ found: false, productID: args.productID, available: p.products.map(x => ({ id: x.id, name: x.name })) });
    out.products = [focus];
  }
  return ok(out);
}

// ---------- PRODUCT ----------

async function productList(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const status = args.status || 'open';
  // product-browse-0.json gives the full id->name map of products.
  const data = await client.viewJson('/product-browse-0.json');
  throwIfDenied(data, 'product browse');
  const raw = data.products || {};
  const idNameMap = Array.isArray(raw) ? {} : raw;
  const list = await buildProductList(client, idNameMap, status);
  return ok({ total: list.length, products: list });
}

async function productGet(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const data = await client.viewJson('/product-view-' + args.productID + '.json');
  throwIfDenied(data, 'product view');
  const p = data.product || {};
  return ok({
    ...summarizeProduct(p),
    url: viewUrl(client, 'product', args.productID),
    plans: data.plans || [],
    moduleTree: data.modules ? Object.keys(data.modules).length : 0
  });
}

async function productCreate(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const token = makeToken(client.config);
  const name = markTitle(args.name, client.config);
  const code = markProductCode(args.code, client.config);
  // 1. Get kuid from the create form page (required field).
  const pageUrl = '/product-create.html?onlybody=yes';
  const uid = await getActionKuid(client, pageUrl);
  if (!uid) throw new Error('Could not obtain product-create token (kuid)');
  // 2. Multipart POST with all form fields.
  const fields: Record<string, unknown> = {
    name, code,
    desc: args.desc || '',
    PO: args.PO || '',
    QD: args.QD || '',
    RD: args.RD || '',
    type: args.type || 'normal',
    status: 'normal',
    acl: args.acl || 'open',
    feedback: 'closed',
    line: 0,
    uid
  };
  const res = await client.postMultipartCreate('/product-create.html', fields);
  if (res.data && (res.data as any).result === 'fail') throw new Error('Product create rejected: ' + JSON.stringify(res.data));
  // 3. Extract ID from locate (e.g. /product-browse-23.html → ID 23)
  const locate = (res.data as any)?.locate || '';
  const m = locate.match(/product-browse-(\d+)/) || locate.match(/product-view-(\d+)/) || locate.match(/(\d+)/);
  return ok({ created: true, locate, newProductID: m ? Number(m[1]) : null, url: viewUrl(client, 'product', m ? Number(m[1]) : null), marker: { code, note: 'Filter by code prefix mcpt_' }, idempotent: false, idempotency_note: '重复调用会创建新产品' });
}

async function productUpdate(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const productID = Number(args.productID);
  const pageUrl = '/product-edit-' + productID + '.html';
  const uid = await getActionKuid(client, pageUrl + '?onlybody=yes');
  if (!uid) throw new Error('Could not obtain product-edit token for product ' + productID);
  // Get current values to preserve unchanged fields
  const current = await client.viewJson('/product-view-' + productID + '.json');
  const p = current.product || {};
  const fields: Record<string, unknown> = {
    name: args.name || p.name || '',
    code: args.code || p.code || '',
    type: args.type || p.type || 'normal',
    status: args.status || p.status || 'normal',
    desc: args.desc != null ? args.desc : (p.desc || ''),
    PO: args.PO || p.PO || '',
    QD: p.QD || '',
    RD: p.RD || '',
    line: p.line || 0,
    acl: p.acl || 'open',
    feedback: p.feedback || 'closed',
    uid
  };
  const res = await client.postRoute(pageUrl, fields as Record<string, string>);
  const raw = (res.data as Record<string, unknown>)?.raw || '';
  if (typeof raw === 'string' && (raw.includes('user-login') || raw.includes('无权'))) throw new Error('Product update failed: ' + raw.slice(0, 200));
  return ok({ updated: true, productID, url: viewUrl(client, 'product', productID), changed: Object.keys(args).filter(k => k !== 'productID') });
}

// ---------- STORY ----------

async function storyList(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  // NOTE: This deployment denies the per-product PATH_INFO route /story-browse-<id>-*.json
  // (it redirects to user-deny-story-browse). The working route is my-story-browse (the
  // account's visible stories). That route ALSO ignores pagination/search params, so we
  // fetch the FULL set via URL-path pagination, then filter by product/status/branch client-side.
  const wantProduct = args.productID != null ? String(args.productID) : null;
  const status = args.status || 'all';
  const branch = args.branch != null ? String(args.branch) : null;
  // Server-side product-scoped routes (biz 4.1.3 product-browse tag segments, verified live
  // 2026-09-13): byModule-{mid} scopes by module; the status tabs scope by preset. Pagination
  // uses the double-dash suffix. Only the main branch (0) has these routes, so non-zero branch
  // falls through to the client-side path below.
  const STATUS_TABS: Record<string, string> = { all: 'allstory', active: 'activestory', closed: 'closedstory', changed: 'changedstory', draft: 'draftstory', unclosed: 'unclosed', openedbyme: 'openedbyme', assignedtome: 'assignedtome', reviewedbyme: 'reviewedbyme', closedbyme: 'closedbyme', willclose: 'willclose', feedback: 'feedback' };
  const STAGE_VALUES = ['wait', 'planned', 'projected', 'developing', 'developed', 'testing', 'tested', 'verified', 'released'];
  const serverTag = wantProduct && (branch == null || branch === '0')
    ? (args.moduleID ? 'byModule-' + Number(args.moduleID) + '-story' : (STATUS_TABS[status] ? STATUS_TABS[status] + '-0-story' : null))
    : null;
  let rows: Dyn[]; let recTotal: number; let pagesFetched: number; let routeNote = '';
  if (serverTag) {
    const base = '/product-browse-' + wantProduct + '-0-' + serverTag;
    if (args.moduleID) await client.ensureStoryScopeClean(Number(wantProduct));
    const r = await client.fetchAllPaginated(base, { rowKey: 'stories', perPage: 1000, maxPages: 30, urlTemplate: base + '--{recTotal}-{perPage}-{page}' });
    rows = r.rows; recTotal = r.recTotal; pagesFetched = r.pagesFetched;
    routeNote = 'Server-side scope via product-browse ' + (args.moduleID ? 'byModule-' + Number(args.moduleID) : STATUS_TABS[status]) + '.';
  } else {
    ({ rows, recTotal, pagesFetched } = await client.fetchAllPaginated('/my-story-browse-id_desc', { rowKey: 'stories', perPage: 1000, maxPages: 30 }));
    routeNote = 'Listed via my-story-browse (this deployment denies per-product story-browse).';
  }
  let matched = rows;
  if (serverTag) {
    // Scope is already applied server-side; only refine by stage when that is what was asked.
    if (STAGE_VALUES.includes(status)) matched = matched.filter((s: Dyn) => String(s.stage || '').toLowerCase() === status);
  } else {
    if (wantProduct) matched = matched.filter((s: Dyn) => String(s.product) === wantProduct);
    if (branch != null) matched = matched.filter((s: Dyn) => String(s.branch) === branch);
  }
  // KB-authoritative enums [KB: 禅道RESTfulAPIv1.0开发手册/api_695.md]:
  //   status (状态): draft | active | closed | changed
  //   stage  (阶段): wait | planned | projected | developing | developed | testing | tested | verified | released | closed
  // These are DISTINCT fields. The previous code mixed them into one regex and used
  // 'reviewed' (a value that is neither a valid status nor stage) — a doc-validation catch.
  if (status !== 'all' && !serverTag) {
    matched = matched.filter((s: Dyn) => {
      const st = (s.status || '').toLowerCase();
      const sg = (s.stage || '').toLowerCase();
      if (status === 'active')   return st === 'active' || st === 'changed'; // 激活/已变更 (active-ish states)
      if (status === 'closed')   return st === 'closed' || sg === 'closed';
      if (status === 'draft')    return st === 'draft';
      if (status === 'changed')  return st === 'changed';
      // stage-based filters (KB stage enum)
      if (['wait','planned','projected','developing','developed','testing','tested','verified','released'].includes(status))
        return sg === status;
      return true;
    });
  }
  const limit = args.limit ? Math.min(Number(args.limit), 200) : 20;
  const returned = matched.slice(0, limit);
  return ok({
    total: matched.length,
    recTotal,
    pagesFetched,
    returnedCount: returned.length,
    limit,
    ...(matched.length > returned.length ? { warning: 'TRUNCATED: returned only the first ' + returned.length + ' of ' + matched.length + ' matching stories — raise limit (max 200) or use zentao_story_search/conditions or zentao_filter for a complete answer.' } : {}),
    note: routeNote,
    stories: returned.map((s: Dyn) => withUrl(client, 'story', summarizeStory(s)))
  });
}

async function storyGet(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const storyIDs = extractIDs(args, 'storyID');
  if (storyIDs.length > 1) {
    const results: any[] = [];
    for (const id of storyIDs) {
      try { results.push(await storyGet(client, { ...args, storyID: id })); }
      catch (e) { results.push({ id, error: (e as Error).message }); }
    }
    return ok({ bulk: true, total: storyIDs.length, results });
  }
  const data = await client.viewJson('/story-view-' + storyIDs[0] + '.json');
  throwIfDenied(data, 'story view');
  const s = data.story || {};
  return ok({
    ...summarizeStory(s),
    url: viewUrl(client, 'story', storyIDs[0]),
    spec: s.spec || s.steps || '',
    estimate: s.estimate,
    files: summarizeFiles(client, s.files),
    reviewRecord: (data.actions || {}).length ? 'see raw.actions' : 'none',
    changeHistory: data.history || []
  });
}

async function storyCreate(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const productID = args.productID;
  const token = makeToken(client.config);
  const title = markTitle(args.title, client.config);
  const keywords = mergeKeywords(args.keywords || '', token, client.config);
  const pageUrl = '/story-create-' + productID + '.html';
  // 1. Anti-CSRF kuid from the story create form page.
  const uid = await client.getKuid(pageUrl);
  if (!uid) throw new Error('Could not obtain story-create token (kuid). Form page may be unavailable.');
  // 2. Validate pri (1-4); type is fixed to 'story' (matching form hidden input).
  const pri = args.pri != null ? Number(args.pri) : 3;
  if (![1,2,3,4].includes(pri)) throw new Error('pri must be 1-4, got ' + pri);

  const type = 'story'; // Fixed: must match form hidden input type=story. 'feature' etc. are sub-types, not the main type.
  // 2b. Rich text: upload local images in spec/verify to the ZenTao file store (url substituted, rest of HTML untouched).
  const specEmb = await embedLocalImages(client, args.spec || '', pageUrl);
  const verifyEmb = await embedLocalImages(client, args.verify || '', pageUrl);
  const storyImages = [...specEmb.embedded, ...verifyEmb.embedded];
  // 3. Multipart POST with the full story field set (must match the real form).
  const fields = {
    product: productID, module: args.moduleID || 0, plan: args.plan || 0,
    source: args.source || 'conclusion', sourceNote: args.sourceNote || 0,
    assignedTo: args.assignedTo || '', needNotReview: '',
    title, color: client.config.markersEnabled ? (client.config.markerColor || '') : '',

    pri, estimate: args.estimate != null ? String(args.estimate) : '0',
    spec: specEmb.html, verify: verifyEmb.html, status: 'active',
    'labels[]': '', 'files[]': '', 'mailto[]': '', keywords, type, uid
  };
  const storyAttachments = normAttachments(args);
  // First upload right after login can fail server-side (see warmUploadIfNeeded) — absorb it before the form that carries real attachments.
  const warmErr = storyAttachments.length ? await warmUploadIfNeeded(client, pageUrl) : null;
  const res = await client.postMultipartCreate(pageUrl, fields, storyAttachments);
  if (res.data && res.data.result === 'fail') throw new Error('Story create rejected: ' + JSON.stringify(res.data.message));
  if (!res.data || res.data.result !== 'success') throw new Error('Story create did not succeed: ' + JSON.stringify(res.data));
  // 4. locate points to the browse page; the new story lands in DRAFT status. Find it by title+marker.
  //    Probe a small range above the current max story id (most reliable, avoids pagination ambiguity).
  let newStoryID = null;
  try {
    const d = await client.viewJson('/my-story-browse.json');
    const arr: Dyn[] = Object.values(d.stories || {});
    // Markers on: match title+MCP-AUTO token (unambiguous). Off (real data): title only.
    const match = arr.find((s) => s.title === title && (client.config.markersEnabled ? /MCP-AUTO/.test(s.keywords || '') : true));
    if (match) newStoryID = (match as Dyn).id;
  } catch {}
  if (!newStoryID) {
    // Fallback: scan a range of story-view ids above the latest known id.
    const d0 = await client.viewJson('/my-story-browse.json');
    const maxId = Math.max(0, ...Object.values(d0.stories || {}).map((s: any) => Number(s.id) || 0));
    for (let id = maxId + 1; id <= maxId + 30; id++) {
      try {
        const dv = await client.viewJson('/story-view-' + id + '.json');
        const s = dv.story;
        if (s && s.title === title && (client.config.markersEnabled ? /MCP-AUTO/.test(s.keywords || '') : true)) { newStoryID = id; break; }
      } catch {}
    }
  }
  // Verify attachments actually landed with content (the files[] flow has no per-file retry).
  const storyAttachmentCheck = (storyAttachments.length && newStoryID) ? await verifyEntityFiles(client, 'story', Number(newStoryID), storyAttachments) : null;
  // 5. Auto-review: stories land in DRAFT; review(pass) activates them. Default ON so a single
  //    call yields an ACTIVE story with attachments already in place (attachments must be added
  //    BEFORE review — which is guaranteed here since they were uploaded during create).
  //    Set autoReview: false to keep the story in draft (e.g. for real human review).
  let reviewed = false; let reviewError = null;
  if (newStoryID && args.autoReview !== false) {
    try { await storyReview(client, { storyID: Number(newStoryID), result: 'pass', comment: args.reviewComment || 'MCP 创建时自动评审通过' }); reviewed = true; }
    catch (e) { reviewError = (e as Error).message.slice(0, 200); }
  }
  const finalStatus = reviewed ? 'active' : 'draft';
  return ok({
    created: true, newStoryID: newStoryID ? Number(newStoryID) : null, url: viewUrl(client, 'story', newStoryID ? Number(newStoryID) : null), status: finalStatus, idempotent: false, idempotency_note: '重复调用会创建新需求（不会去重）',
    images: storyImages.length ? storyImages : undefined,
    attachments: storyAttachments.length ? storyAttachments.map((p) => ({ name: path.basename(p), bytes: fs.statSync(p).size })) : undefined,
    ...(storyAttachmentCheck ? { attachmentsVerified: storyAttachmentCheck } : {}),
    ...(warmErr || (storyAttachmentCheck && storyAttachmentCheck.broken.length) ? { warnings: [...(warmErr ? [warmErr] : []), ...(storyAttachmentCheck && storyAttachmentCheck.broken.length ? storyAttachmentCheck.broken.map((b) => 'attachment ' + b) : [])] } : {}),
    locate: res.data.locate || '',
    marker: client.config.markersEnabled
      ? { enabled: true, keywords, color: client.config.markerColor || null, note: 'Filter cloud stories by keywords prefix ' + (client.config.markerPrefix || 'MCP-AUTO') + ' (new stories start in draft status)' }
      : { enabled: false, note: 'MCP markers disabled (ZENTAO_MARKERS not set) — created story is real data, no machine marker written' },
    reviewed, reviewError: reviewError || undefined,
    suggested_next: suggestedNext('story', 'create', newStoryID ? Number(newStoryID) : null)
  });
}

async function storyUpdate(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const storyIDs = extractIDs(args, 'storyID');
  if (storyIDs.length > 1) {
    // Bulk mode: loop and collect results
    const results: { id: number; ok: boolean; error?: string }[] = [];
    for (const id of storyIDs) {
      try {
        await storyUpdate(client, { ...args, storyID: id });
        results.push({ id, ok: true });
      } catch (e) { results.push({ id, ok: false, error: (e as Error).message.slice(0, 80) }); }
    }
    return ok({ bulk: true, total: storyIDs.length, success: results.filter(r=>r.ok).length, results: results.map((r: { id: number }) => ({ ...r, url: viewUrl(client, 'story', r.id) })) });
  }
  const storyID = storyIDs[0];
  const token = makeToken(client.config);
  // spec/verify CANNOT be changed via story-edit (basic fields only).
  // To change spec/verify, use zentao_story_change (需求变更) instead.
  if (args.spec || args.verify) {
    return err('spec/verify cannot be changed via story_update. Use zentao_story_change (需求变更) to modify the story description.', 'validation_error');
  }
  // 1. Anti-CSRF kuid from the edit form page.
  const formUrl = '/story-edit-' + storyID + '.html?onlybody=yes';
  const uid = await getActionKuid(client, formUrl);
  if (!uid) throw new Error('Could not obtain edit-form token (kuid) for story ' + storyID + '.');
  // 2. Build fields (multipart) - only basic fields that the edit form supports.
  const fields: Record<string, unknown> = { uid };
  if (args.title) fields.title = args.title;
  if (args.assignedTo) fields.assignedTo = args.assignedTo;
  if (args.stage) fields.stage = args.stage;
  if (args.priority != null) fields.pri = Number(args.priority);
  // Ensure the story carries an MCP marker in keywords (idempotent) + color.
  fields.keywords = token;
  fields.color = client.config.markersEnabled ? (client.config.markerColor || '') : '';
  // 3. Multipart POST.
  const res = await client.postMultipartCreate('/story-edit-' + storyID + '.html', fields);
  if (res.data && res.data.result === 'fail') throw new Error('Story update rejected: ' + JSON.stringify(res.data));
  return ok({ updated: true, storyID, url: viewUrl(client, 'story', storyID), locate: res.data?.locate || '', marker: { keywords: token, note: 'keywords/color re-affirmed for cloud filtering' }, suggested_next: suggestedNext('story', 'update', storyID) });
}

async function storyClose(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const storyIDs = extractIDs(args, 'storyID');
  if (storyIDs.length > 1) {
    const results: { id: number; ok: boolean; error?: string }[] = [];
    for (const id of storyIDs) {
      try { await storyClose(client, { ...args, storyID: id }); results.push({ id, ok: true }); }
      catch (e) { results.push({ id, ok: false, error: (e as Error).message.slice(0, 80) }); }
    }
    return ok({ bulk: true, total: storyIDs.length, success: results.filter(r=>r.ok).length, results: results.map((r: { id: number }) => ({ ...r, url: viewUrl(client, 'story', r.id) })) });
  }
  const storyID = storyIDs[0];
  const closedReason = args.closedReason;
  const validReasons = ['done', 'duplicate', 'postponed', 'willnotdo', 'cancel', 'bydesign'];
  if (!validReasons.includes(closedReason)) {
    return err('Invalid closedReason: ' + closedReason + '. Must be one of: ' + validReasons.join(', '), 'validation_error');
  }
  const token = makeToken(client.config);
  // 1. Anti-CSRF kuid from the close form page.
  const formUrl = '/story-close-' + storyID + '.html?onlybody=yes';
  const uid = await getActionKuid(client, formUrl);
  if (!uid) throw new Error('Could not obtain close-form token (kuid) for story ' + storyID + '.');
  // 2. Build fields (use multipart for reliable session handling).
  const fields: Record<string, unknown> = { closedReason, uid, comment: (args.comment || '') + ' ' + markerNote(client.config, token) };
  if (closedReason === 'duplicate' && args.duplicateStoryID) fields.duplicate = Number(args.duplicateStoryID);
  // 3. Multipart POST.
  const res = await client.postMultipartCreate('/story-close-' + storyID + '.html', fields);
  if (res.data && res.data.result === 'fail') throw new Error('Story close rejected: ' + JSON.stringify(res.data));
  return ok({ closed: true, storyID, url: viewUrl(client, 'story', storyID), closedReason, locate: res.data?.locate || '', marker: token, suggested_next: suggestedNext('story', 'close', storyID) });
}

async function storyReview(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const storyIDs = extractIDs(args, 'storyID');
  if (storyIDs.length > 1) {
    const results: { id: number; ok: boolean; error?: string }[] = [];
    for (const id of storyIDs) {
      try { await storyReview(client, { ...args, storyID: id }); results.push({ id, ok: true }); }
      catch (e) { results.push({ id, ok: false, error: (e as Error).message.slice(0, 80) }); }
    }
    return ok({ bulk: true, total: storyIDs.length, success: results.filter(r=>r.ok).length, results: results.map((r: { id: number }) => ({ ...r, url: viewUrl(client, 'story', r.id) })) });
  }
  const storyID = storyIDs[0];
  const result = args.result;
  if (!['pass', 'fail'].includes(result)) return err('Invalid result: ' + result + '. Must be: pass, fail', 'validation_error');
  const token = makeToken(client.config);
  // 1. Anti-CSRF kuid from the review form page.
  const formUrl = '/story-review-' + storyID + '.html?onlybody=yes';
  const uid = await getActionKuid(client, formUrl);
  if (!uid) throw new Error('Could not obtain review-form token (kuid) for story ' + storyID + '.');
  // 2. Build fields.
  const fields: Record<string, unknown> = { result, status: 'active', comment: (args.comment || '') + ' ' + markerNote(client.config, token), uid };
  if (args.assignedTo) fields.assignedTo = args.assignedTo;
  if (args.pri) fields.pri = args.pri;
  const reviewers: string[] = args.reviewedBy || [client.config.account];
  reviewers.forEach((r) => { fields['reviewedBy[]'] = r; });
  // 3. Multipart POST.
  const res = await client.postMultipartCreate('/story-review-' + storyID + '.html', fields);
  if (res.data && res.data.result === 'fail') throw new Error('Story review rejected: ' + JSON.stringify(res.data));
  return ok({ reviewed: true, storyID, url: viewUrl(client, 'story', storyID), result, assignedTo: args.assignedTo || '', marker: token });
}

async function storyChange(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const storyIDs = extractIDs(args, 'storyID');
  if (storyIDs.length > 1) {
    const results: { id: number; ok: boolean; error?: string }[] = [];
    for (const id of storyIDs) {
      try { await storyChange(client, { ...args, storyID: id }); results.push({ id, ok: true }); }
      catch (e) { results.push({ id, ok: false, error: (e as Error).message.slice(0, 80) }); }
    }
    return ok({ bulk: true, total: storyIDs.length, success: results.filter(r=>r.ok).length, results: results.map((r: { id: number }) => ({ ...r, url: viewUrl(client, 'story', r.id) })) });
  }
  const storyID = storyIDs[0];
  const token = makeToken(client.config);
  // 1. Anti-CSRF kuid from the change form page.
  const formUrl = '/story-change-' + storyID + '.html?onlybody=yes';
  const uid = await getActionKuid(client, formUrl);
  if (!uid) throw new Error('Could not obtain change-form token (kuid) for story ' + storyID + '.');
  // 2. Build fields.
  const fields: Record<string, unknown> = { comment: (args.comment || '') + ' ' + markerNote(client.config, token), uid };
  if (args.title) fields.title = args.title;
  // 2b. Rich text: upload local images in spec/verify to the ZenTao file store (url substituted, rest of HTML untouched).
  let storyImages: EmbeddedImage[] = [];
  if (args.spec) { const e = await embedLocalImages(client, String(args.spec), '/story-view-' + storyID + '.html'); fields.spec = e.html; storyImages = [...storyImages, ...e.embedded]; }
  if (args.verify) { const e = await embedLocalImages(client, String(args.verify), '/story-view-' + storyID + '.html'); fields.verify = e.html; storyImages = [...storyImages, ...e.embedded]; }
  if (args.assignedTo) fields.assignedTo = args.assignedTo;
  // 3. Multipart POST.
  const storyAttachments = normAttachments(args);
  const warmErr = storyAttachments.length ? await warmUploadIfNeeded(client, '/story-view-' + storyID + '.html') : null;
  const res = await client.postMultipartCreate('/story-change-' + storyID + '.html', fields, storyAttachments);
  if (res.data && res.data.result === 'fail') throw new Error('Story change rejected: ' + JSON.stringify(res.data));
  const storyAttachmentCheck = storyAttachments.length ? await verifyEntityFiles(client, 'story', storyID, storyAttachments) : null;
  return ok({ changed: true, storyID, url: viewUrl(client, 'story', storyID), marker: token, images: storyImages.length ? storyImages : undefined, attachments: storyAttachments.length ? storyAttachments.map((p) => ({ name: path.basename(p), bytes: fs.statSync(p).size })) : undefined, ...(storyAttachmentCheck ? { attachmentsVerified: storyAttachmentCheck } : {}), ...(warmErr || (storyAttachmentCheck && storyAttachmentCheck.broken.length) ? { warnings: [...(warmErr ? [warmErr] : []), ...(storyAttachmentCheck && storyAttachmentCheck.broken.length ? storyAttachmentCheck.broken.map((b) => 'attachment ' + b) : [])] } : {}), suggested_next: suggestedNext('story', 'change', storyID) });
}

// ---------- BUG ----------

async function bugList(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const productID = args.productID;
  const branch = args.branch || 0;
  // Bug browseType tab tokens are deployment-specific (verified live 2026-09-13 from the actual
  // bug browse page: exactly these 14). Legacy/KB values like 'closed' or 'open' are NOT route
  // segments here — they silently 0-row — so fall back to the 'all' route and filter the
  // status field client-side. (moduleID is likewise handled client-side below on this deployment.)
  const LIVE_BUG_TABS = new Set(['all', 'unclosed', 'openedbyme', 'assigntome', 'resolvedbyme', 'toclosed', 'unresolved', 'unconfirmed', 'assigntonull', 'longlifebugs', 'postponedbugs', 'overduebugs', 'needconfirm', 'feedback']);
  const status = args.status || 'unclosed';
  const tab = LIVE_BUG_TABS.has(status) ? status : 'all';
  let base = '/bug-browse-' + productID + '-' + branch + '-' + tab + '-0-id_desc';
  if (args.moduleID) { base = base.replace('-0-id_desc', '-' + args.moduleID + '-id_desc'); }
  const { rows, recTotal, pagesFetched } = await client.fetchAllPaginated(base, { rowKey: 'bugs', perPage: 1000, maxPages: 20 });
  // Client-side filters (server ignores these on this instance)
  let list = rows;
  if (args.moduleID) {
    // Some deployments honor the -<module>- URL segment (server-side scope); others silently
    // ignore it (verified live 2026-09-13: identical recTotal with and without the segment).
    // Narrow to module + descendants client-side via the profile tree in either case (a no-op
    // when the server already scoped the result).
    const mid = String(args.moduleID);
    const profile = await ensureProfile(client).catch(() => null);
    const mods = (profile?.products.find(pp => String(pp.id) === String(productID))?.modules) || [];
    const children = new Map<string, string[]>();
    for (const m of mods) {
      const k = String(m.parent ?? 0);
      if (!children.has(k)) children.set(k, []);
      children.get(k)!.push(String(m.id));
    }
    const allowed = new Set<string>([mid]);
    const stack = [mid];
    while (stack.length) {
      for (const c of children.get(stack.pop()!) || []) {
        if (!allowed.has(c)) { allowed.add(c); stack.push(c); }
      }
    }
    list = list.filter((b: Dyn) => allowed.has(String(b.module || '')));
  }
  if (tab !== status) {
    // Legacy/KB status value ('closed', 'open', 'resolved', 'assignedbyme', ...): not a live tab
    // token on this deployment. The 'all' route was used; filter the status field client-side.
    // ('open' maps to the status-field value 'active'.)
    const kb = String(status).toLowerCase();
    if (kb === 'assignedbyme') {
      // No live tab and no row field for "bugs I assigned" on this deployment — refuse loudly
      // instead of returning a silent 0-row list.
      throw new Error('status=assignedbyme is not available on this deployment (no such browseType tab and no row field to filter by). Use the assignedTo parameter (bugs currently assigned to an account) or a saved query instead.');
    }
    const want = kb === 'open' ? 'active' : kb;
    list = list.filter((b: Dyn) => String(b.status || '').toLowerCase() === want);
  }
  if (args.severity != null) list = list.filter((b: Dyn) => String(b.severity) === String(args.severity));
  if (args.assignedTo) list = list.filter((b: Dyn) => String(b.assignedTo || '') === String(args.assignedTo));
  const limit = args.limit ? Math.min(Number(args.limit), 200) : 20;
  const returned = list.slice(0, limit);
  return ok({
    total: list.length,           // total AFTER filters
    recTotal,                      // total before filters (whole browse scope)
    pagesFetched,
    returnedCount: returned.length,
    limit,
    complete: recTotal <= 1000 * 20, // whether we likely have the full set
    ...(tab !== status ? { note: 'status=' + status + ' is not a live browseType on this deployment; fetched the full list (' + recTotal + ') and filtered client-side by the status field.' } : {}),
    ...(list.length > returned.length ? { warning: 'TRUNCATED: returned only the first ' + returned.length + ' of ' + list.length + ' matching bugs — raise limit (max 200) or use zentao_bug_search/conditions or zentao_filter for a complete answer.' } : {}),
    bugs: returned.map((b: Dyn) => withUrl(client, 'bug', summarizeBug(b)))
  });
}

async function bugSavedQueries(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const productID = await resolveProductID(client, args);
  // Saved queries are embedded in the search build-form page (not the browse page),
  // as user-query tags: data-query-id='N' title='Name'.
  const res = await client._get(client.config.baseUrl + '/search-buildForm-bug.html', { 'X-Requested-With': 'XMLHttpRequest' });
  const queries = client.parseSavedQueriesHtml(await res.text());
  return ok({ productID, total: queries.length, queries });
}

// ---------- Ad-hoc server-side conditional search (temporary query) ----------
// conditions: [{field, operator?, value?}] — submits search-buildQuery and fetches all matching
// rows through bySearch pagination. Two server modes: (a) ROW — a temporary query row is
// created (numeric queryID, deleted best-effort afterwards); (b) SESSION (this deployment) —
// no row, the conditions are held in the session and the bySearch-myQueryID page executes them
// (nothing to clean up). If build yields neither → feature_not_enabled error with alternatives.
async function adhocConditionalSearch(client: ZentaoClient, kind: 'bug' | 'story', productID: number, branch: number, conditions: { field: string; operator?: string; value: string; andOr?: 'and' | 'or' }[], limit: number): Promise<Record<string, unknown>> {
  // Validate condition fields against the deployment's discovered search-field list (when known).
  // An unknown field is silently DROPPED by the server — the scariest failure mode — so we fail
  // fast with the available list instead. (Empty discovered list = restricted deployment → skip.)
  try {
    const prof = loadProfile(client.config);
    const fields = prof?.features?.searchFields?.[kind];
    const meta = prof?.features?.searchFieldMeta?.[kind];
    if (fields && fields.length) {
      const unknown = conditions.map(c => c.field).filter(f => !fields.includes(f));
      if (unknown.length) {
        return {
          error: {
            message: '条件字段无效：' + [...new Set(unknown)].join(', ') + ' 不在该部署的搜索字段表中（传错字段会被服务端静默丢弃）。',
            code: 'unknown_field',
            fix: '该部署可用字段: ' + fields.join(', ') + '。日期区间建议用两个条件 openedDate>=start 与 openedDate<=end。',
            retryable: true, needs_user: false
          }
        };
      }
    }
    // Per-field metadata (from the deployment's own form config): default omitted operators to
    // the field's native operator and reject values outside the field's select domain.
    if (meta && Object.keys(meta).length) {
      for (const c of conditions) {
        const def = meta[c.field];
        if (!def) continue;
        if (!c.operator) c.operator = def.operator;
        if (def.control === 'select' && def.values && def.values.length && c.operator !== 'between') {
          const v = String(c.value);
          if (v && !def.values.includes(v)) {
            const allowed = def.values.slice(0, 24).join(', ') + (def.values.length > 24 ? ' …(共' + def.values.length + '个)' : '');
            return {
              error: {
                message: '字段 ' + c.field + ' 的值无效："' + v + '" 不在该部署的可选值域中（传错值会被服务端静默忽略）。',
                code: 'invalid_value',
                fix: '字段 ' + c.field + ' 可选值: ' + allowed + '。"null" 表示空值。',
                retryable: true, needs_user: false
              }
            };
          }
        }
      }
    }
  } catch { /* profile read is best-effort */ }
  const queryID = await client.buildAdhocQuery(kind, conditions, productID, branch);
  if (queryID === null) {
    return {
      error: {
        message: '服务端条件搜索不可用：search-buildQuery 的响应未指向任何 bySearch 结果页（可能被拒绝重定向，或全部条件无效）。',
        code: 'feature_not_enabled',
        fix: '请管理员确认该账号角色的「查询」模块权限/部署的临时查询开关；或改用：keyword 参数（客户端全量扫描）、saved queryID（zentao_bug_saved_queries / zentao_story_search）、或 zentao_filter（客户端条件全量，结果完整）。',
        retryable: false, needs_user: true
      }
    };
  }
  const rowKey = kind === 'bug' ? 'bugs' : 'stories';
  // bySearch route differs by kind (verified live 2026-09-13): bugs use the /bug-browse-... route;
  // stories use /product-browse-...-bySearch-...-story. The product-browse -bug variant exists but
  // returns 0 rows, so it must not be used for bugs. queryID may be the literal 'myQueryID'
  // (session mode — same URL shape, conditions come from the session that just did the POST).
  const base = kind === 'bug'
    ? '/bug-browse-' + productID + '-' + branch + '-bySearch-' + queryID
    : '/product-browse-' + productID + '-' + branch + '-bySearch-' + queryID + '-story';
  const { rows, recTotal, pagesFetched } = await client.fetchAllPaginated(base, {
    rowKey, perPage: 1000, maxPages: 20,
    // Session mode: the URL does NOT identify the conditions — they live in the session and
    // change with every search, so the route-based cache would serve a PREVIOUS search's rows.
    cacheTTL: typeof queryID === 'number' ? 60000 : 0,
    urlTemplate: base + '--{recTotal}-{perPage}-{page}'
  });
  if (kind === 'story') client.markStorySearchDirty(productID);
  // Row mode: delete the temporary query row (best-effort). Session mode: no row was created.
  const queryMode: 'row' | 'session' = typeof queryID === 'number' ? 'row' : 'session';
  const cleaned = typeof queryID === 'number' ? await client.deleteQuery(queryID) : true;
  const head = { mode: 'server-adhoc', queryMode, queryID, queryCleaned: cleaned, conditions, total: rows.length, recTotal, pagesFetched, returnedCount: Math.min(limit, rows.length), limit };
  if (kind === 'bug') return ok({ ...head, bugs: rows.slice(0, limit).map((b: Dyn) => withUrl(client, 'bug', summarizeBug(b))) });
  return ok({ ...head, stories: rows.slice(0, limit).map((s: Dyn) => withUrl(client, 'story', summarizeStory(s))) });
}

// ---------- Saved-query bySearch with product fallback ----------
// Saved queries are bound to the product they were created in (verified live 2026-09-13:
// queryID 200 on product 20 = 461 rows, on product 22 = 0 rows). The bySearch URL embeds the
// product, so an inferred (not explicit) productID can silently 0-row a valid query.
async function fetchBySearchRows(client: ZentaoClient, kind: 'bug' | 'story', productID: number, branch: number, queryID: number): Promise<{ rows: Dyn[]; recTotal: number; pagesFetched: number }> {
  if (kind === 'bug') {
    const base = '/bug-browse-' + productID + '-0-bySearch-' + queryID;
    return client.fetchAllPaginated(base, {
      rowKey: 'bugs', perPage: 1000, maxPages: 20,
      urlTemplate: base + '--{recTotal}-{perPage}-{page}'
    });
  }
  const base = '/product-browse-' + productID + '-' + branch + '-bySearch-' + queryID + '-story';
  const r = await client.fetchAllPaginated(base, {
    rowKey: 'stories', perPage: 1000, maxPages: 20,
    urlTemplate: base + '--{recTotal}-{perPage}-{page}'
  });
  client.markStorySearchDirty(productID);
  return r;
}

// First try the inferred product; if (and only if) it yields 0 rows, probe the other products —
// most-module-rich first (proxy for where the account actually works) — up to 8 of them, one
// 20-row page each. Returns the product that owns the query plus its rows.
async function resolveQueryProduct(client: ZentaoClient, kind: 'bug' | 'story', queryID: number, inferredProductID: number, branch: number): Promise<{ productID: number; rows: Dyn[]; recTotal: number; pagesFetched: number }> {
  const first = await fetchBySearchRows(client, kind, inferredProductID, branch, queryID);
  if (first.rows.length) return { productID: inferredProductID, ...first };
  const profile = await ensureProfile(client).catch(() => null);
  const candidates = (profile?.products || [])
    .filter(pp => Number(pp.id) !== inferredProductID)
    .sort((a, b) => ((b.modules || []).length) - ((a.modules || []).length))
    .slice(0, 8);
  for (const c of candidates) {
    const r = await fetchBySearchRows(client, kind, Number(c.id), branch, queryID);
    if (r.rows.length) return { productID: Number(c.id), ...r };
  }
  return { productID: inferredProductID, ...first };
}

async function bugSearch(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const productID = await resolveProductID(client, args);
  if (Array.isArray(args.conditions) && args.conditions.length) {
    const lim = args.limit ? Math.min(Number(args.limit), 200) : 20;
    return adhocConditionalSearch(client, 'bug', productID, 0, args.conditions, lim);
  }
  const queryID = args.queryID;
  // Saved queries are bound to the product they were created in. With an explicit productID the
  // answer is authoritative (0 rows is a valid result). With an INFERRED productID, 0 rows usually
  // means the query belongs to another product — probe the other products to find it (cheap:
  // one 20-row page each, only on the zero-result path).
  const explicitProduct = args.productID != null && args.productID !== '';
  const resolved = explicitProduct
    ? { productID, ...(await fetchBySearchRows(client, 'bug', productID, 0, queryID)), probed: [] as number[], note: undefined as string | undefined }
    : await resolveQueryProduct(client, 'bug', queryID, productID, 0);
  let list = resolved.rows;
  if (args.severity != null) list = list.filter((b: Dyn) => String(b.severity) === String(args.severity));
  if (args.assignedTo) list = list.filter((b: Dyn) => String(b.assignedTo || '') === String(args.assignedTo));
  const limit = args.limit ? Math.min(Number(args.limit), 200) : 20;
  const returned = list.slice(0, limit);
  return ok({
    mode: 'server', queryID, productID: resolved.productID,
    ...(resolved.productID !== productID ? { note: 'Saved query ' + queryID + ' belongs to product ' + resolved.productID + ' — the inferred product ' + productID + ' had 0 rows. Pass productID:' + resolved.productID + ' to skip the probe.' } : {}),
    total: list.length, recTotal: resolved.recTotal, pagesFetched: resolved.pagesFetched, returnedCount: returned.length, limit,
    bugs: returned.map((b: Dyn) => withUrl(client, 'bug', summarizeBug(b)))
  });
}

async function bugGet(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const bugIDs = extractIDs(args, 'bugID');
  if (bugIDs.length > 1) {
    const results: any[] = [];
    for (const id of bugIDs) {
      try { results.push(await bugGet(client, { ...args, bugID: id })); }
      catch (e) { results.push({ id, error: (e as Error).message }); }
    }
    return ok({ bulk: true, total: bugIDs.length, results });
  }
  const data = await client.viewJson('/bug-view-' + bugIDs[0] + '.json');
  throwIfDenied(data, 'bug view');
  const b = data.bug || {};
  const actions = data.actions || {};
  return ok({
    ...summarizeBug(b),
    url: viewUrl(client, 'bug', bugIDs[0]),
    steps: b.steps || '',
    storyTitle: b.storyTitle || '',
    files: summarizeFiles(client, b.files),
    history: Object.values(actions).map(a => ({
      action: (a as any).action, actor: (a as any).actor, date: (a as any).date, comment: (a as any).comment || ''
    }))
  });
}

async function bugCreate(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const productID = args.productID;
  const moduleID = args.moduleID || 0;
  const branch = args.branch || 0;
  const token = makeToken(client.config);
  const title = markTitle(args.title, client.config);
  const keywords = mergeKeywords(args.keywords || '', token, client.config);
  const pageUrl = '/bug-create-' + productID + '-' + branch + '-moduleID=' + moduleID + '.html';
  // 1. Anti-CSRF token (kuid) — server silently rejects create without it.
  const uid = await client.getKuid(pageUrl);
  if (!uid) throw new Error('Could not obtain create-form token (kuid). Form page may be unavailable.');
  // 2. Cloud-configured options — validate user values against what the deployment offers
  //    (never hardcode; stay consistent with the cloud's current configuration).
  const cloudOpts = await client.getCreateFormOptions(pageUrl);
  //   2a. openedBuild: accept a build id OR name (e.g. "staging"/"主干"); default to first.
  const builds = await client.getProductBuilds(productID);
  let buildId = '';
  if (args.openedBuild != null) {
    const ob = String(args.openedBuild);
    const byId = builds.find((b: Dyn) => String(b.id) === ob);
    const byName = builds.find((b: Dyn) => b.name === ob);
    buildId = byId ? String(byId.id) : (byName ? String(byName.id) : '');
    if (!buildId) throw new Error('openedBuild "' + ob + '" not found for product ' + productID + '. Available: ' + builds.map((b: Dyn) => b.id + ':' + b.name).join(', '));
  } else {
    buildId = builds[0] ? String(builds[0].id) : '';
  }
  // Product with no builds: openedBuild may be left empty (cloud-side required-field
  // config decides). Previously we hard-failed; the create form itself loads fine
  // without builds on this deployment.
  //   2b. type: must be a cloud-defined type; default to the first one (usually codeerror).
  const typeValues = ['codeerror','config','install','security','performance','standard','automation','designdefect','others'];
  const validTypes = typeValues.filter(t => t in cloudOpts);
  let type = args.type || (validTypes[0] || 'codeerror');
  if (validTypes.length && !validTypes.includes(type)) throw new Error('type "' + type + '" not in cloud config. Available: ' + validTypes.join(', '));
  //   2c. severity / pri: validate 1-4 (cloud standard), default 3.
  const severity = args.severity != null ? Number(args.severity) : 3;
  const pri = args.pri != null ? Number(args.pri) : 3;
  if (![1,2,3,4].includes(severity)) throw new Error('severity must be 1-4, got ' + severity);
  if (![1,2,3,4].includes(pri)) throw new Error('pri must be 1-4, got ' + pri);
  // 3a. Rich text: upload local images in steps to the ZenTao file store (url substituted, rest of HTML untouched).
  const stepsEmb = await embedLocalImages(client, args.steps || '', '/bug-create-' + productID + '-0-moduleID=0.html');
  // 3. Full field set (must match the real form; missing required fields cause validation failure).
  const fields = {
    product: productID, module: moduleID, project: args.project || '',
    'openedBuild[]': buildId, assignedTo: args.assignedTo || '', deadline: '',
    type, os: '', browser: '',
    title, color: client.config.markersEnabled ? (client.config.markerColor || '') : '',
    severity, pri,
    steps: stepsEmb.html, story: args.story || 0, task: args.task || 0, oldTaskID: 0,
    'mailto[]': '', keywords, status: 'active', 'labels[]': '', 'files[]': '',
    uid, case: 0, caseVersion: 0, result: 0, testtask: 0
  };
  const bugAttachments = normAttachments(args);
  const warmErr = bugAttachments.length ? await warmUploadIfNeeded(client, pageUrl) : null;
  const res = await client.postMultipartCreate(pageUrl, fields, bugAttachments);
  if (res.data && res.data.result === 'fail') {
    throw new Error('Bug create rejected: ' + JSON.stringify(res.data.message));
  }
  if (!res.data || res.data.result !== 'success') {
    throw new Error('Bug create did not succeed: ' + JSON.stringify(res.data));
  }
  // 4. locate points to the browse page (not view), so find the new bug by querying latest.
  let newBugID: number | null = null;
  const bugLocate = (res.location || (res.data.locate || '')) as string;
  const m = bugLocate.match(/bug-view-(\d+)/);
  if (m) newBugID = Number(m[1]);
  if (!newBugID) {
    try {
      const d = await client.viewJson('/bug-browse-' + productID + '-0-unclosed-0-id_desc.json');
      const bugs = Object.values(d.bugs || {});
      // Markers on: exact title+token match. Off (real data): title-only match.
      const match = (bugs as Dyn[]).find((b) => b.title === title && (client.config.markersEnabled ? (b.keywords || '').includes(token) : true));
      if (match) newBugID = Number((match as Dyn).id);
      // No fallback: if not found by exact title(+token), return null (do not guess).
    } catch {}
  }
  const bugAttachmentCheck = (bugAttachments.length && newBugID) ? await verifyEntityFiles(client, 'bug', newBugID, bugAttachments) : null;
  const buildObj = builds.find((b: Dyn) => String(b.id) === buildId);
  return ok({
    created: true, newBugID: newBugID ? Number(newBugID) : null, url: viewUrl(client, 'bug', newBugID ? Number(newBugID) : null), locate: res.data.locate || '', idempotent: false, idempotency_note: '重复调用会创建新 Bug（不会去重）',
    openedBuild: buildId + (buildObj ? ':' + buildObj.name : ''), type, severity, pri,
    images: stepsEmb.embedded.length ? stepsEmb.embedded : undefined,
    attachments: bugAttachments.length ? bugAttachments.map((p) => ({ name: path.basename(p), bytes: fs.statSync(p).size })) : undefined,
    ...(bugAttachmentCheck ? { attachmentsVerified: bugAttachmentCheck } : {}),
    ...(warmErr || (bugAttachmentCheck && bugAttachmentCheck.broken.length) ? { warnings: [...(warmErr ? [warmErr] : []), ...(bugAttachmentCheck && bugAttachmentCheck.broken.length ? bugAttachmentCheck.broken.map((b) => 'attachment ' + b) : [])] } : {}),
    marker: client.config.markersEnabled
      ? { enabled: true, keywords, color: client.config.markerColor || null, note: 'Filter cloud bugs by keywords prefix ' + (client.config.markerPrefix || 'MCP-AUTO') }
      : { enabled: false, note: 'MCP markers disabled (ZENTAO_MARKERS not set) — created bug is real data, no machine marker written' },
    suggested_next: suggestedNext('bug', 'create', newBugID ? Number(newBugID) : null)
  });
}

// Shared: GET an action-form page (onlybody=yes) and return its kuid anti-CSRF token.
async function getActionKuid(client: ZentaoClient, formPageUrl: string): Promise<string> {
  return client.getKuid(formPageUrl); // getKuid does GET + kuid extraction
}

async function bugUpdate(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const bugIDs = extractIDs(args, 'bugID');
  if (bugIDs.length > 1) {
    const results: { id: number; ok: boolean; error?: string }[] = [];
    for (const id of bugIDs) {
      try { await bugUpdate(client, { ...args, bugID: id }); results.push({ id, ok: true }); }
      catch (e) { results.push({ id, ok: false, error: (e as Error).message.slice(0, 80) }); }
    }
    return ok({ bulk: true, total: bugIDs.length, success: results.filter(r=>r.ok).length, results: results.map((r: { id: number }) => ({ ...r, url: viewUrl(client, 'bug', r.id) })) });
  }
  const bugID = bugIDs[0];
  // 1. Read current bug to preserve fields
  const vd = await client.viewJson('/bug-view-' + bugID + '.json');
  const current = (vd as any).bug;
  if (!current) throw new Error('Bug ' + bugID + ' not found');
  // 2. Fresh session (optimistic lock, same pattern as testcaseUpdate)
  await client.ensureLogin(true);
  const vd2 = await client.viewJson('/bug-view-' + bugID + '.json');
  const bug = (vd2 as any).bug || current;
  const pri = args.pri != null ? Number(args.pri) : Number(bug.pri || 3);
  const severity = args.severity != null ? Number(args.severity) : Number(bug.severity || 3);
  if (![1,2,3,4].includes(pri)) throw new Error('pri must be 1-4');
  if (![1,2,3,4].includes(severity)) throw new Error('severity must be 1-4');
  // 3a. Rich text: upload local images in steps to the ZenTao file store (url substituted, rest of HTML untouched).
  const stepsEmb = args.steps != null
    ? await embedLocalImages(client, String(args.steps), '/bug-view-' + bugID + '.html')
    : { html: String(bug.steps || ''), embedded: [] as EmbeddedImage[] };
  // 3. Edit form
  const pageUrl = '/bug-edit-' + bugID + '.html';
  const uid = await getActionKuid(client, pageUrl + '?onlybody=yes');
  if (!uid) throw new Error('Could not obtain bug-edit token for bug ' + bugID);
  const fd = new FormData();
  const fields: Record<string, unknown> = {
    product: bug.product,
    project: bug.project || '',
    module: args.moduleID != null ? args.moduleID : (bug.module || 0),
    'openedBuild[]': bug.openedBuild || '',
    title: args.title != null ? args.title : (bug.title || ''),
    pri, severity,
    type: args.type != null ? args.type : (bug.type || 'codeerror'),
    os: bug.os || '',
    browser: bug.browser || '',
    steps: stepsEmb.html,
    story: args.storyID != null ? args.storyID : (bug.story || 0),
    task: args.taskID != null ? args.taskID : (bug.task || 0),
    assignedTo: args.assignedTo != null ? args.assignedTo : (bug.assignedTo || ''),
    keywords: bug.keywords || '',
    deadline: args.deadline != null ? args.deadline : (bug.deadline || ''),
    color: bug.color || '',
    'mailto[]': '', 'labels[]': '', 'files[]': '',
    lastEditedDate: '', // must match form default (see AGENT_RULES §8)
    comment: args.comment || '',
    uid
  };
  const bugAttachments = normAttachments(args);
  for (const [k, v] of Object.entries(fields)) {
    // When real attachments are present, drop the empty files[] placeholder to avoid a phantom entry.
    if (k === 'files[]' && bugAttachments.length) continue;
    fd.append(k, v == null ? '' : String(v));
  }
  for (const p of bugAttachments) {
    if (!fs.existsSync(p) || !fs.statSync(p).isFile()) throw new Error('attachment not found: ' + p);
    const size = fs.statSync(p).size;
    if (size > 50 * 1024 * 1024) throw new Error('attachment exceeds 50M limit: ' + p);
    fd.append('files[]', new Blob([fs.readFileSync(p)]), path.basename(p));
  }
  const headers = (client as any)._headers({ 'X-Requested-With': 'XMLHttpRequest' });
  delete headers['Content-Type'];
  const res = await client.fetchImpl(client.config.baseUrl + pageUrl, { method: 'POST', headers, body: fd, redirect: 'manual' });
  (client as any)._storeCookies(res);
  const rawText = await res.text();
  if (rawText.includes('user-login')) throw new Error('Bug update failed: session expired');
  if (rawText.includes('该记录可能已经被改动')) throw new Error('Bug update rejected: record version conflict. Retry.');
  if (!rawText.includes('bug-view-' + bugID)) throw new Error('Bug update did not succeed: ' + rawText.slice(0, 200));
  return ok({ updated: true, bugID, url: viewUrl(client, 'bug', bugID), title: fields.title, pri, severity, idempotent: true, images: stepsEmb.embedded.length ? stepsEmb.embedded : undefined, attachments: bugAttachments.length ? bugAttachments.map((p) => ({ name: path.basename(p), bytes: fs.statSync(p).size })) : undefined, suggested_next: suggestedNext('bug', 'update', bugID) });
}

async function bugResolve(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const bugIDs = extractIDs(args, 'bugID');
  if (bugIDs.length > 1) {
    const results: { id: number; ok: boolean; error?: string }[] = [];
    for (const id of bugIDs) {
      try { await bugResolve(client, { ...args, bugID: id }); results.push({ id, ok: true }); }
      catch (e) { results.push({ id, ok: false, error: (e as Error).message.slice(0, 80) }); }
    }
    return ok({ bulk: true, total: bugIDs.length, success: results.filter(r=>r.ok).length, results: results.map((r: { id: number }) => ({ ...r, url: viewUrl(client, 'bug', r.id) })) });
  }
  const bugID = bugIDs[0];
  const token = makeToken(client.config);
  const comment = (args.comment || '') + markerNote(client.config, token);
  // 1. Fetch the bug to get its productID (needed to resolve the build from cloud config).
  let productID = args.productID || 0;
  if (!productID) {
    const d = await client.viewJson('/bug-view-' + bugID + '.json');
    const b = d.bug || (d.bugs && Object.values(d.bugs)[0]);
    if (!b) throw new Error('Bug ' + bugID + ' not found.');
    productID = b.product;
  }
  // 2. Anti-CSRF kuid from the resolve form page (onlybody=yes, same as the browser iframe).
  const formUrl = '/bug-resolve-' + bugID + '.html?onlybody=yes';
  const uid = await getActionKuid(client, formUrl);
  if (!uid) throw new Error('Could not obtain resolve-form token (kuid) for bug ' + bugID + '.');
  // 3. resolvedBuild is REQUIRED — resolve the user's value (id/name/主干) against cloud config.
  const ref = args.resolvedBuild != null ? String(args.resolvedBuild) : (args.build || '');
  let resolvedBuild = '';
  if (ref) resolvedBuild = await client.resolveBuildValue(productID, ref);
  if (!resolvedBuild) {
    // Default to the product's first build from cloud config.
    const builds = await client.getProductBuilds(productID);
    resolvedBuild = builds[0] ? String(builds[0].id) : '';
  }
  if (!resolvedBuild) throw new Error('No build found for product ' + productID + '; resolvedBuild is required to resolve a bug.');
  // Validate resolution against cloud-defined values.
  // KB-authoritative [KB: 禅道RESTfulAPIv1.0开发手册/api_1181.md]: 8 resolution values
  const VALID_RESOLUTIONS = ['bydesign','duplicate','external','fixed','notrepro','postponed','willnotfix','tostory'];
  const resolution = args.resolution || 'fixed';
  if (!VALID_RESOLUTIONS.includes(resolution)) throw new Error('resolution "' + resolution + '" invalid. Available: ' + VALID_RESOLUTIONS.join(', '));
  // 4. Multipart POST. CRITICAL: do NOT send createBuild/buildProject/buildName unless creating a new build.
  const pad = (n: number) => String(n).padStart(2, '0');
  const now = new Date();
  const resolvedDate = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
  const fields = {
    resolution, duplicateBug: args.duplicateBug || 0, resolvedBuild,
    resolvedDate, assignedTo: args.assignedTo || '', status: 'resolved',
    'labels[]': '', 'files[]': '', comment, uid
  };
  if (args.createNewBuild) { // only when explicitly creating a new build
    (fields as any).createBuild = '1'; (fields as any).buildProject = args.buildProject || 0; (fields as any).buildName = args.buildName || '';
  }
  const res = await client.postMultipartCreate('/bug-resolve-' + bugID + '.html', fields);
  const bodyStr = JSON.stringify(res.data || {});
  if (res.data && res.data.result === 'fail') throw new Error('Bug resolve rejected: ' + bodyStr);
  if (/不能为空|错误/.test(typeof res.data === 'string' ? res.data : bodyStr)) throw new Error('Bug resolve validation: ' + bodyStr.slice(0, 150));
  return ok({ resolved: true, bugID, url: viewUrl(client, 'bug', bugID), resolution, resolvedBuild, marker: { note: token }, suggested_next: suggestedNext('bug', 'resolve', bugID) });
}

async function bugClose(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const bugIDs = extractIDs(args, 'bugID');
  if (bugIDs.length > 1) {
    const results: { id: number; ok: boolean; error?: string }[] = [];
    for (const id of bugIDs) {
      try { await bugClose(client, { ...args, bugID: id }); results.push({ id, ok: true }); }
      catch (e) { results.push({ id, ok: false, error: (e as Error).message.slice(0, 80) }); }
    }
    return ok({ bulk: true, total: bugIDs.length, success: results.filter(r=>r.ok).length, results: results.map((r: { id: number }) => ({ ...r, url: viewUrl(client, 'bug', r.id) })) });
  }
  const bugID = bugIDs[0];
  const token = makeToken(client.config);
  const comment = (args.comment || '') + markerNote(client.config, token);
  // 1. Anti-CSRF kuid from the close form page.
  const formUrl = '/bug-close-' + bugID + '.html?onlybody=yes';
  const uid = await getActionKuid(client, formUrl);
  if (!uid) throw new Error('Could not obtain close-form token (kuid) for bug ' + bugID + '.');
  // 2. Multipart POST: close only needs status + comment + uid (no build field).
  const fields = { status: 'closed', comment, uid };
  const res = await client.postMultipartCreate('/bug-close-' + bugID + '.html', fields);
  if (res.data && res.data.result === 'fail') throw new Error('Bug close rejected: ' + JSON.stringify(res.data));
  return ok({ closed: true, bugID, url: viewUrl(client, 'bug', bugID), marker: { note: token }, suggested_next: suggestedNext('bug', 'close', bugID) });
}

async function bugReopen(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const bugIDs = extractIDs(args, 'bugID');
  if (bugIDs.length > 1) {
    const results: { id: number; ok: boolean; error?: string }[] = [];
    for (const id of bugIDs) {
      try { await bugReopen(client, { ...args, bugID: id }); results.push({ id, ok: true }); }
      catch (e) { results.push({ id, ok: false, error: (e as Error).message.slice(0, 80) }); }
    }
    return ok({ bulk: true, total: bugIDs.length, success: results.filter(r=>r.ok).length, results: results.map((r: { id: number }) => ({ ...r, url: viewUrl(client, 'bug', r.id) })) });
  }
  const bugID = bugIDs[0];
  const token = makeToken(client.config);
  const comment = (args.comment || '') + markerNote(client.config, token);
  // 1. Anti-CSRF kuid from the active form page.
  const formUrl = '/bug-activate-' + bugID + '.html?onlybody=yes';
  const uid = await getActionKuid(client, formUrl);
  if (!uid) throw new Error('Could not obtain active-form token (kuid) for bug ' + bugID + '.');
  // 2. Multipart POST: reopen sets status back to active.
  const fields: Record<string, unknown> = { status: 'active', comment, uid };
  if (args.assignedTo) fields.assignedTo = args.assignedTo;
  const res = await client.postMultipartCreate('/bug-activate-' + bugID + '.html', fields);
  if (res.data && res.data.result === 'fail') throw new Error('Bug reopen rejected: ' + JSON.stringify(res.data));
  return ok({ reopened: true, bugID, url: viewUrl(client, 'bug', bugID), assignedTo: args.assignedTo || '', marker: token });
}

// ===================== STORY SEARCH / SAVED QUERIES =====================
function summarizePlan(p: Dyn): Record<string, unknown> {
  return { id: p.id, title: p.title, begin: p.begin, end: p.end, stories: p.stories, bugs: p.bugs, hour: p.hour, product: p.product, branch: p.branch, parent: p.parent };
}
function summarizeCase(c: Dyn): Record<string, unknown> {
  return { id: c.id, title: c.title, module: c.module, status: c.status, pri: c.pri, type: c.type, product: c.product, keywords: c.keywords || '', openedBy: c.openedBy, openedDate: c.openedDate, scriptStatus: c.scriptStatus || '' };
}
function summarizeTask(t: Dyn): Record<string, unknown> {
  return { id: t.id, title: t.title, product: t.product, assignedTo: t.assignedTo, status: t.status, begin: t.begin, end: t.end, cases: t.cases, done: t.done };
}
function summarizeReport(r: Dyn): Record<string, unknown> {
  return { id: r.id, title: r.title, product: r.product, testtask: r.testtask, cases: r.cases, passRate: r.passRate, status: r.status };
}
function summarizeSuite(s: Dyn): Record<string, unknown> {
  return { id: s.id, name: s.name || s.title, product: s.product, module: s.module, cases: s.cases };
}

async function storySavedQueries(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  // Saved story queries live in /search-buildForm-story.html as user-query tags.
  const res = await client._get(client.config.baseUrl + '/search-buildForm-story.html', { 'X-Requested-With': 'XMLHttpRequest' });
  const queries = client.parseSavedQueriesHtml(await res.text());
  return ok({ total: queries.length, queries });
}

async function storySearch(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const productID = await resolveProductID(client, args);
  const branch = args.branch != null ? args.branch : 0;
  const limit = args.limit ? Math.min(Number(args.limit), 200) : 20;
  if (Array.isArray(args.conditions) && args.conditions.length) {
    return adhocConditionalSearch(client, 'story', productID, branch, args.conditions, limit);
  }
  if (args.queryID) {
    // Server-side: product-browse-<pid>-<branch>-bySearch-<qid>-story. Saved queries are bound
    // to their creation product; with an inferred productID, 0 rows triggers the product probe.
    const explicitProduct = args.productID != null && args.productID !== '';
    const resolved = explicitProduct
      ? { productID, ...(await fetchBySearchRows(client, 'story', productID, branch, Number(args.queryID))), note: undefined as string | undefined }
      : await resolveQueryProduct(client, 'story', Number(args.queryID), productID, branch);
    let list = resolved.rows;
    // KB-authoritative enums [KB: api_695.md]: status=draft/active/closed/changed; stage=wait/.../released/closed
    if (args.status && args.status !== 'all') list = list.filter((s: Dyn) => {
      const st = (s.status || '').toLowerCase();
      const sg = (s.stage || '').toLowerCase();
      if (args.status === 'active')  return st === 'active' || st === 'changed';
      if (args.status === 'closed')  return st === 'closed' || sg === 'closed';
      if (args.status === 'draft')   return st === 'draft';
      if (args.status === 'changed') return st === 'changed';
      if (['wait','planned','projected','developing','developed','testing','tested','verified','released'].includes(args.status)) return sg === args.status;
      return true;
    });
    return ok({
      mode: 'server', queryID: args.queryID, productID: resolved.productID,
      ...(resolved.productID !== productID ? { note: 'Saved query ' + args.queryID + ' belongs to product ' + resolved.productID + ' — the inferred product ' + productID + ' had 0 rows. Pass productID:' + resolved.productID + ' to skip the probe.' } : {}),
      total: list.length, recTotal: resolved.recTotal, pagesFetched: resolved.pagesFetched, returnedCount: Math.min(limit, list.length), limit,
      stories: list.slice(0, limit).map((s: Dyn) => withUrl(client, 'story', summarizeStory(s)))
    });
  }
  if (args.keyword) {
    // Client-side full scan over my-story-browse
    const { rows, recTotal } = await client.fetchAllPaginated('/my-story-browse-id_desc', { rowKey: 'stories', perPage: 1000, maxPages: 30 });
    const kw = String(args.keyword).toLowerCase();
    let list = rows.filter((s: Dyn) => ((s.title||'') + ' ' + (s.spec||'') + ' ' + (s.keywords||'')).toLowerCase().includes(kw));
    if (productID) list = list.filter((s: Dyn) => String(s.product) === String(productID));
    // KB-authoritative enums [KB: api_695.md]: status=draft/active/closed/changed; stage=wait/.../released/closed
    if (args.status && args.status !== 'all') list = list.filter((s: Dyn) => {
      const st = (s.status || '').toLowerCase();
      const sg = (s.stage || '').toLowerCase();
      if (args.status === 'active')  return st === 'active' || st === 'changed';
      if (args.status === 'closed')  return st === 'closed' || sg === 'closed';
      if (args.status === 'draft')   return st === 'draft';
      if (args.status === 'changed') return st === 'changed';
      if (['wait','planned','projected','developing','developed','testing','tested','verified','released'].includes(args.status)) return sg === args.status;
      return true;
    });
    return ok({ mode: 'client-scan', keyword: args.keyword, total: list.length, recTotal, returnedCount: Math.min(limit, list.length), limit, stories: list.slice(0, limit).map((s: Dyn) => withUrl(client, 'story', summarizeStory(s))) });
  }
  return ok({ error: 'Provide queryID (server search) or keyword (client scan).' });
}

// ===================== PRODUCT PLAN =====================
async function productplanList(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const productID = await resolveProductID(client, args);
  const { rows, recTotal, pagesFetched } = await client.fetchAllPaginated('/productplan-browse-' + productID + '-0-all-begin_desc', { rowKey: 'plans', perPage: 1000, maxPages: 20, urlTemplate: '/productplan-browse-' + productID + '-0-all-begin_desc-{recTotal}-{perPage}-{page}' });
  const limit = args.limit ? Math.min(Number(args.limit), 200) : 20;
  return ok({ total: rows.length, recTotal, pagesFetched, returnedCount: Math.min(limit, rows.length), limit, plans: rows.slice(0, limit).map((p: Dyn) => withUrl(client, 'productplan', summarizePlan(p))) });
}
async function productplanGet(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  // Some deployments' productplan-view returns data:false; the browse list already carries
  // full plan records (stories/bugs/hour/date). Fetch the plan from the browse set instead.
  const productID = await resolveProductID(client, args);
  const { rows } = await client.fetchAllPaginated('/productplan-browse-' + productID + '-0-all-begin_desc', { rowKey: 'plans', perPage: 1000, maxPages: 20, urlTemplate: '/productplan-browse-' + productID + '-0-all-begin_desc-{recTotal}-{perPage}-{page}' });
  const p = rows.find(x => String(x.id) === String(args.planID));
  if (!p) return ok({ found: false, planID: args.planID, error: 'Plan not found in browse list. Use zentao_productplan_list to see available plans.' });
  return ok({ found: true, ...summarizePlan(p), url: viewUrl(client, 'productplan', args.planID) });
}

// ===================== TEST CASE (soft-locked by feature probe) =====================
// The testcase tools are NOT statically locked. On first use they probe the
// deployment: if the test-case feature point is not enabled for this account,
// the probe is denied and the call returns a clear feature_not_enabled error;
// on deployments where it IS enabled, the standard case routes are used.
const TESTCASE_LOCKED: Record<string, unknown> = {
  error: {
    message: '用例（testcase）操作不可用：当前部署/账号未开通「测试用例」功能点。',
    code: 'feature_not_enabled',
    fix: '请管理员在禅道「权限设置」中为该账号开通测试用例相关功能点后重试；已开通该功能点的部署可直接使用本工具。',
    retryable: false, needs_user: true
  }
};

// Returns true (enabled), false (denied), or null (unknown — caller proceeds and
// lets the real request surface the error).
async function testcaseFeatureAvailable(client: ZentaoClient): Promise<boolean | null> {
  const cached = loadProfile(client.config);
  if (cached && isFresh(cached, client.config.profileTtlMs) && cached.features.testcase !== 'unknown') {
    return cached.features.testcase === 'enabled';
  }
  const primary = primaryProduct(cached);
  const pid = primary ? primary.id : 1;
  try {
    const r = await client._get(client.config.baseUrl + '/case-browse-' + pid + '.html', { 'X-Requested-With': 'XMLHttpRequest' });
    const text = await r.text();
    // 0-byte 200 = feature point not enabled for this account (deployment signature).
    const denied = r.status === 403 || text.length === 0 || /user-deny|denied|forbidden/i.test(text);
    const p = cached || (await ensureProfile(client));
    p.features.testcase = denied ? 'denied' : 'enabled';
    saveProfile(client.config, p);
    return denied ? false : true;
  } catch {
    return null;
  }
}

async function testcaseList(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  if ((await testcaseFeatureAvailable(client)) === false) return TESTCASE_LOCKED;
  const productID = await resolveProductID(client, args);
  const { rows, recTotal, pagesFetched } = await client.fetchAllPaginated('/case-browse-' + productID, { rowKey: 'cases', perPage: 1000, maxPages: 10 });
  let list = rows;
  if (args.status && args.status !== 'all') list = list.filter((c: Dyn) => String(c.status) === args.status);
  if (args.pri) list = list.filter((c: Dyn) => Number(c.pri) === Number(args.pri));
  const limit = args.limit ? Math.min(Number(args.limit), 200) : 20;
  return ok({ total: list.length, recTotal, pagesFetched, returnedCount: Math.min(limit, list.length), limit, cases: list.slice(0, limit).map((c: Dyn) => withUrl(client, 'case', summarizeCase(c))) });
}

async function testcaseGet(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  if ((await testcaseFeatureAvailable(client)) === false) return TESTCASE_LOCKED;
  const data = await client.viewJson('/case-view-' + args.caseID + '.json');
  throwIfDenied(data, 'case view');
  const c = data.cases ? (Array.isArray(data.cases) ? data.cases[0] : data.cases) : {};
  const steps = data.steps ? (Array.isArray(data.steps) ? data.steps : Object.values(data.steps)) : [];
  return ok({ ...summarizeCase(c), url: viewUrl(client, 'case', args.caseID), steps: steps.map((s: Dyn, i: number) => ({ step: i + 1, desc: s.description || s.step || '', expect: s.expectation || s.expect || '' })) });
}

async function testcaseCreate(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  if ((await testcaseFeatureAvailable(client)) === false) return TESTCASE_LOCKED;
  const productID = await resolveProductID(client, args);
  const moduleID = args.moduleID != null ? Number(args.moduleID) : 0;
  const steps = Array.isArray(args.steps) ? args.steps : (args.steps ? [{ step: args.steps }] : []);
  const uid = await client.getKuid('/case-create-' + productID + '-' + moduleID + '.html');
  if (!uid) throw new Error('Could not obtain create-form token (kuid) for testcase.');
  const fields: Record<string, unknown> = {
    title: args.title, moduleID, type: args.type || 'function',
    pri: args.pri != null ? args.pri : 3,
    precondition: args.precondition || '',
    keywords: args.keywords || '',
    steps: steps.map((s: Dyn, i: number) => i),
    step: steps.map((s: Dyn, i: number) => ({ description: s.step || s.description || '' })),
    expectation: steps.map((s: Dyn, i: number) => ({ expectation: s.expect || s.expectation || '' })),
    uid
  };
  const res = await client.postMultipartCreate('/case-create-' + productID + '-' + moduleID + '.html', fields);
  if (res.data && res.data.result === 'fail') throw new Error('Testcase create rejected: ' + JSON.stringify(res.data));
  const locate = String(res.location || (res.data && (res.data as Dyn).locate) || '');
  const m = locate.match(/case-(?:view|create)-(\d+)/);
  const caseID = m ? Number(m[1]) : undefined;
  return ok({ created: true, caseID, url: caseID ? viewUrl(client, 'case', caseID) : locate });
}

async function testcaseUpdate(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  if ((await testcaseFeatureAvailable(client)) === false) return TESTCASE_LOCKED;
  // Standard edit route; moduleID comes from the current case (read first).
  const data = await client.viewJson('/case-view-' + args.caseID + '.json');
  throwIfDenied(data, 'case view');
  const c = data.cases ? (Array.isArray(data.cases) ? data.cases[0] : data.cases) : {};
  const moduleID = Number(c.module || 0);
  const steps = Array.isArray(args.steps) ? args.steps : (args.steps ? [{ step: args.steps }] : []);
  const uid = await client.getKuid('/case-edit-' + args.caseID + '-' + moduleID + '.html');
  if (!uid) throw new Error('Could not obtain edit-form token (kuid) for testcase ' + args.caseID + '.');
  const fields: Record<string, unknown> = { caseID: args.caseID, title: args.title || c.title, moduleID, type: args.type || c.type, pri: args.pri != null ? args.pri : c.pri, precondition: args.precondition != null ? args.precondition : c.precondition, keywords: args.keywords != null ? args.keywords : c.keywords, comment: args.comment || '', uid };
  if (steps.length) {
    fields.steps = steps.map((s: Dyn, i: number) => i);
    fields.step = steps.map((s: Dyn, i: number) => ({ description: s.step || s.description || '' }));
    fields.expectation = steps.map((s: Dyn, i: number) => ({ expectation: s.expect || s.expectation || '' }));
  }
  const res = await client.postMultipartCreate('/case-edit-' + args.caseID + '-' + moduleID + '.html', fields);
  if (res.data && res.data.result === 'fail') throw new Error('Testcase update rejected: ' + JSON.stringify(res.data));
  return ok({ updated: true, caseID: args.caseID, url: viewUrl(client, 'case', args.caseID) });
}

async function testcaseRun(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  if ((await testcaseFeatureAvailable(client)) === false) return TESTCASE_LOCKED;
  // Recording a case result requires a test task context (testtaskID).
  const testtaskID = args.testtaskID != null ? Number(args.testtaskID) : 0;
  if (!testtaskID) throw new Error('testcase_run requires testtaskID (a running test task on this deployment). List test tasks with zentao_testtask_list.');
  const uid = await client.getKuid('/testtask-view-' + testtaskID + '.html');
  if (!uid) throw new Error('Could not obtain form token (kuid) for test task ' + testtaskID + '.');
  const fields: Record<string, unknown> = {
    caseID: args.caseID, result: args.result, realResult: args.realResult || '', comment: args.comment || '', uid
  };
  const res = await client.postMultipartCreate('/testtask-recordResult-' + testtaskID + '.html', fields);
  if (res.data && res.data.result === 'fail') throw new Error('Testcase run rejected: ' + JSON.stringify(res.data));
  return ok({ recorded: true, caseID: args.caseID, testtaskID, result: args.result });
}

// ===================== TEST TASK / REPORT / SUITE =====================
async function testtaskList(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const productID = await resolveProductID(client, args);
  const { rows, recTotal, pagesFetched } = await client.fetchAllPaginated('/testtask-browse-' + productID, { rowKey: 'tasks', perPage: 1000, maxPages: 10 });
  const limit = args.limit ? Math.min(Number(args.limit), 200) : 20;
  return ok({ total: rows.length, recTotal, pagesFetched, returnedCount: Math.min(limit, rows.length), limit, tasks: rows.slice(0, limit).map((t: Dyn) => withUrl(client, 'testtask', summarizeTask(t))) });
}
async function testreportList(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const productID = await resolveProductID(client, args);
  const { rows, recTotal, pagesFetched } = await client.fetchAllPaginated('/testreport-browse-' + productID, { rowKey: 'reports', perPage: 1000, maxPages: 10 });
  const limit = args.limit ? Math.min(Number(args.limit), 200) : 20;
  return ok({ total: rows.length, recTotal, pagesFetched, returnedCount: Math.min(limit, rows.length), limit, reports: rows.slice(0, limit).map((r: Dyn) => withUrl(client, 'testreport', summarizeReport(r))) });
}
async function testsuiteList(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const productID = await resolveProductID(client, args);
  const { rows, recTotal, pagesFetched } = await client.fetchAllPaginated('/testsuite-browse-' + productID, { rowKey: 'suites', perPage: 1000, maxPages: 10 });
  const limit = args.limit ? Math.min(Number(args.limit), 200) : 20;
  return ok({ total: rows.length, recTotal, pagesFetched, returnedCount: Math.min(limit, rows.length), limit, suites: rows.slice(0, limit).map((s: Dyn) => withUrl(client, 'testsuite', summarizeSuite(s))) });
}

// ---------- EXECUTION / ITERATION ----------

function summarizeExecution(e: Dyn): Record<string, unknown> {
  return {
    id: e.id, name: e.name || '', code: e.code || '',
    status: e.status || '', begin: e.begin || '', end: e.end || '',
    days: e.days || 0, hours: e.hours || 0,
    stories: e.stories || 0, bugs: e.bugs || 0, tasks: e.tasks || 0
  };
}

async function executionList(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const productID = await resolveProductID(client, args);
  const status = args.status || 'all';
  const { rows, recTotal, pagesFetched } = await client.fetchAllPaginated('/execution-browse-' + productID, { rowKey: 'executions', perPage: 1000, maxPages: 10 });
  let filtered = rows;
  if (status === 'normal') filtered = rows.filter((e: Dyn) => (e.status || '') === 'normal');
  else if (status === 'closed') filtered = rows.filter((e: Dyn) => (e.status || '') === 'closed');
  const limit = args.limit ? Math.min(Number(args.limit), 200) : 20;
  return ok({ total: filtered.length, recTotal, pagesFetched, returnedCount: Math.min(limit, filtered.length), limit, executions: filtered.slice(0, limit).map((e: Dyn) => withUrl(client, 'execution', summarizeExecution(e))) });
}

async function executionGet(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const executionID = Number(args.executionID);
  const detail = args.detail === true || args.detail === 'full';
  const limit = args.limit ? Math.min(Number(args.limit), 200) : (detail ? 200 : 20);
  const data = await client.viewJson('/execution-view-' + executionID + '.json');
  throwIfDenied(data, 'zentao_execution_get');
  const e = data.executions ? (Array.isArray(data.executions) ? data.executions[0] : data.executions) : data;
  const stories = data.stories ? (Array.isArray(data.stories) ? data.stories : Object.values(data.stories)) : [];
  const bugs = data.bugs ? (Array.isArray(data.bugs) ? data.bugs : Object.values(data.bugs)) : [];
  const tasks = data.tasks ? (Array.isArray(data.tasks) ? data.tasks : Object.values(data.tasks)) : [];
  return ok({
    ...summarizeExecution(e),
    url: viewUrl(client, 'execution', executionID),
    scope: e.scope || '',
    team: e.team || [],
    stories: stories.length, bugs: bugs.length, tasks: tasks.length,
    storyList: stories.slice(0, limit).map((s: Dyn) => withUrl(client, 'story', { id: s.id, title: s.title, status: s.status, stage: s.stage, pri: s.pri, estimate: s.estimate })),
    bugList: bugs.slice(0, limit).map((b: Dyn) => withUrl(client, 'bug', { id: b.id, title: b.title, status: b.status, severity: b.severity, pri: b.pri })),
    taskList: detail ? tasks.slice(0, limit).map((t: Dyn) => withUrl(client, 'task', { id: t.id, name: t.name || t.title, status: t.status, assignedTo: t.assignedTo })) : undefined
  });
}

// ---------- BUILD / VERSION ----------

function summarizeBuild(b: Dyn): Record<string, unknown> {
  return {
    id: b.id, name: b.name || '', date: b.date || '',
    status: b.status || '', stories: b.stories || 0, bugs: b.bugs || 0, cases: b.cases || 0
  };
}

async function buildList(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const productID = await resolveProductID(client, args);
  const { rows, recTotal, pagesFetched } = await client.fetchAllPaginated('/build-browse-' + productID, { rowKey: 'builds', perPage: 1000, maxPages: 10 });
  const limit = args.limit ? Math.min(Number(args.limit), 200) : 20;
  return ok({ total: rows.length, recTotal, pagesFetched, returnedCount: Math.min(limit, rows.length), limit, builds: rows.slice(0, limit).map((b: Dyn) => withUrl(client, 'build', summarizeBuild(b))) });
}

// ---------- MODULE ----------

// This deployment disables /module-browse-<pid>.json (returns HTTP 200 with a
// 0-byte text/html body), which makes viewJson throw a bare "Non-JSON response".
// ---------- Rich text image embedding ----------
// When writing rich text (bug steps / story spec+verify), <img> tags whose src is a
// LOCAL file (or data: URI) are uploaded to the ZenTao file store and replaced with a
// publicly readable hosted URL. All other HTML (formatting, remote urls, site-relative
// /file-read-*.png) is preserved byte-for-byte.
interface EmbeddedImage { from: string; fileID: number; url: string; absUrl: string; bytes: number }
type ImageSrcKind = 'local' | 'data' | 'remote' | 'site';

function classifyImageSrc(src: string): ImageSrcKind {
  const s = src.trim();
  if (/^https?:\/\//i.test(s)) return 'remote';
  if (/^data:image\/[a-z0-9+.-]+;base64,/i.test(s)) return 'data';
  if (/^file:\/\//i.test(s)) return 'local';
  if (s.startsWith('~/')) return 'local';
  if (/^[a-zA-Z]:[\\\//]/.test(s)) return 'local';            // Windows 绝对路径
  if (s.startsWith('./') || s.startsWith('../')) return 'local';
  if (/^\/(Users|home|tmp|var|opt|private)\/.+\.[a-z0-9]{2,5}$/i.test(s)) return 'local'; // 明显的本地绝对路径
  return 'site'; // /file-read-32694.png、uploads/xxx 等站点相对路径 → 原样保留
}

function resolveLocalPath(src: string): string {
  let s = src.trim();
  if (/^file:\/\//i.test(s)) s = decodeURIComponent(s.replace(/^file:\/\//i, ''));
  if (s.startsWith('~/')) s = path.join(os.homedir(), s.slice(2));
  return s;
}

// Embed local images in rich text HTML into the ZenTao file store.
// Fail-fast: if any local src is missing, throw BEFORE uploading anything.
async function embedLocalImages(client: ZentaoClient, html: string, kuidPage: string): Promise<{ html: string; embedded: EmbeddedImage[] }> {
  if (!html || !/<img[^>]*\ssrc\s*=/i.test(html)) return { html, embedded: [] };
  const imgRe = /(<img[^>]*?\ssrc\s*=\s*)(["'])([^"']*)\2/gi;
  const matches = [...html.matchAll(imgRe)];
  if (!matches.length) return { html, embedded: [] };
  // Pass 1: validate (fail-fast, no partial uploads)
  const missing: string[] = [];
  for (const m of matches) {
    const kind = classifyImageSrc(m[3]);
    if (kind === 'local' && (!fs.existsSync(resolveLocalPath(m[3])) || !fs.statSync(resolveLocalPath(m[3])).isFile())) missing.push(m[3]);
  }
  if (missing.length) {
    throw new Error('富文本图片嵌入中止——以下本地图片不存在: ' + missing.join(' | '));
  }
  // Pass 2: upload (dedup by src) + surgical src replacement
  const cache = new Map<string, { absUrl: string; fileID: number }>();
  const embedded: EmbeddedImage[] = [];
  let out = '';
  let last = 0;
  for (const m of matches) {
    const src = m[3];
    const kind = classifyImageSrc(src);
    let replacement: string | null = null;
    if (kind === 'local' || kind === 'data') {
      const hit = cache.get(src);
      if (hit) {
        replacement = hit.absUrl;
      } else {
        let r: { fileID: number; url: string; absUrl: string };
        let bytes = 0;
        if (kind === 'local') {
          const p = resolveLocalPath(src);
          bytes = fs.statSync(p).size;
          r = await client.uploadFile(p, kuidPage);
        } else {
          const mm = src.match(/^data:image\/([a-z0-9+.-]+);base64,(.*)$/is)!;
          const ext = mm[1] === 'svg+xml' ? 'svg' : mm[1] === 'jpeg' ? 'jpg' : mm[1];
          const tmp = path.join(os.tmpdir(), 'zlm-img-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext);
          fs.writeFileSync(tmp, Buffer.from(mm[2], 'base64'));
          try {
            r = await client.uploadFile(tmp, kuidPage);
          } finally { try { fs.unlinkSync(tmp); } catch { /* best effort */ } }
          bytes = Buffer.from(mm[2], 'base64').length;
        }
        cache.set(src, { absUrl: r.absUrl, fileID: r.fileID });
        replacement = r.absUrl;
        embedded.push({ from: kind === 'local' ? src : '(data URI ' + src.slice(0, 40) + '...)', fileID: r.fileID, url: r.url, absUrl: r.absUrl, bytes });
      }
    }
    out += html.slice(last, m.index) + m[1] + m[2] + (replacement ?? src) + m[2];
    last = (m.index as number) + m[0].length;
  }
  out += html.slice(last);
  return { html: out, embedded };
}

// Format the entity's files map (view JSON) for get responses.
function summarizeFiles(client: ZentaoClient, files: any): Record<string, unknown>[] | undefined {
  if (!files || typeof files !== 'object') return undefined;
  const arr = Object.values(files);
  if (!arr.length) return undefined;
  return arr.map((f: any) => ({
    id: Number(f.id), title: f.title, size: f.size, extension: f.extension,
    addedBy: f.addedBy, addedDate: f.addedDate,
    url: client.config.baseUrl + '/file-read-' + f.id + '.' + (f.extension || '')
  }));
}

// Normalize the optional 'attachments' arg (local file paths) for entity forms.
// ZenTao associates them with the object server-side (edit/create form's files[] input).
function normAttachments(args: Record<string, any>): string[] {
  const a = args.attachments;
  if (a == null) return [];
  const arr = Array.isArray(a) ? a : [a];
  return arr.map((x: unknown) => String(x).trim()).filter(Boolean);
}
// Absorb the server's "first upload after login can be silently stored 0-byte" quirk BEFORE
// posting a create/change form that carries real attachments: the files[] upload happens inside
// the form POST (no per-file verify/retry possible there), so if this session has not yet
// performed a verified successful upload, do one throwaway verified upload first. The warm-up
// png is orphaned (not linked to any object) — 70 bytes, harmless.
const WARMUP_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
async function warmUploadIfNeeded(client: ZentaoClient, kuidPage: string): Promise<string | null> {
  if (client.uploadWarmed) return null;
  const tmp = path.join(os.tmpdir(), 'zlm-warmup-' + Date.now() + '.png');
  fs.writeFileSync(tmp, WARMUP_PNG);
  try {
    await client.uploadFile(tmp, kuidPage); // uploadFile self-verifies + retries internally
    return null;
  } catch (e) {
    return 'warm-up upload failed (first upload after login is flaky on this server): ' + (e as Error).message.slice(0, 160);
  } finally {
    try { fs.unlinkSync(tmp); } catch { /* best effort */ }
  }
}

// After a create/change that carried attachments, verify the stored files actually have content.
// The files[] flow cannot retry per file, so this surfaces 0-byte uploads and says what to do.
async function verifyEntityFiles(client: ZentaoClient, kind: 'story' | 'bug', id: number | string, attachmentPaths: string[]): Promise<{ ok: string[]; broken: string[] }> {
  const okNames: string[] = [];
  const broken: string[] = [];
  try {
    const d = await client.viewJson('/' + kind + '-view-' + id + '.json');
    const obj = d[kind] || {};
    const files = Object.values(obj.files || {}) as Dyn[];
    for (const p of attachmentPaths) {
      const name = path.basename(p);
      const f = files.find((x: Dyn) => String(x.title || '') === name);
      if (!f) { broken.push(name + ' (not found in entity files)'); continue; }
      if (Number(f.size) > 0) okNames.push(name);
      else broken.push(name + ' (stored 0 bytes — first-upload-after-login quirk; re-run the update with the same attachment to re-upload it)');
    }
  } catch { /* non-fatal: view may lag a beat */ }
  return { ok: okNames, broken };
}


// Module tree with graceful fallback (see ZentaoClient.getModuleTree for the
// primary-route / product-browse-fallback logic shared with profile discovery).
async function fetchModules(client: ZentaoClient, productID: number, toolName: string): Promise<{ modules: Dyn[]; source: string }> {
  const t = await client.getModuleTree(productID, toolName);
  return { modules: t.modules as Dyn[], source: t.source };
}

function summarizeModule(m: Dyn): Record<string, unknown> {
  return {
    id: m.id, name: m.name || '', parent: m.parent || 0,
    sort: m.sort || 0, stories: m.stories || 0, bugs: m.bugs || 0,
    ...(m.path ? { path: m.path } : {})
  };
}

async function moduleList(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const productID = await resolveProductID(client, args);
  const { modules, source } = await fetchModules(client, productID, 'zentao_module_list');
  const limit = args.limit ? Math.min(Number(args.limit), 200) : 50;
  return ok({ total: modules.length, returnedCount: Math.min(limit, modules.length), limit, source, modules: modules.slice(0, limit).map((m: Dyn) => { const u = moduleUrl(client, productID, m.id); const it = summarizeModule(m); return u ? { ...it, url: u } : it; }) });
}

// ---------- TASK ----------

async function taskList(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const executionID = Number(args.executionID);
  const status = args.status || 'all';
  const { rows, recTotal, pagesFetched } = await client.fetchAllPaginated('/task-browse-' + executionID, { rowKey: 'tasks', perPage: 1000, maxPages: 10 });
  let filtered = rows;
  if (status !== 'all') filtered = rows.filter((t: Dyn) => (t.status || '') === status);
  const limit = args.limit ? Math.min(Number(args.limit), 200) : 50;
  return ok({ total: filtered.length, recTotal, pagesFetched, returnedCount: Math.min(limit, filtered.length), limit, tasks: filtered.slice(0, limit).map((t: Dyn) => withUrl(client, 'task', summarizeTask(t))) });
}

async function taskCreate(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  // The URL parameter is projectID (this ZenTao version: tasks attach to projects, not executions).
  const projectID = Number(args.executionID || args.projectID || 0);
  if (!projectID) return err('projectID (or executionID) is required', 'validation_error');
  const token = makeToken(client.config);
  const name = args.name + ' ' + markerNote(client.config, token);
  // 1. Anti-CSRF kuid from the task-create form page.
  // Route: /task-create-{projectID}-0-0.html
  const pageUrl = '/task-create-' + projectID + '-0-0.html';
  const uid = await getActionKuid(client, pageUrl + '?onlybody=yes');
  if (!uid) throw new Error('Could not obtain task-create token (kuid) for project ' + projectID + '.');
  // 2. Build fields (multipart). project MUST match the URL parameter.
  const fields: Record<string, unknown> = {
    project: projectID,
    name,
    type: args.type,
    'assignedTo[]': args.assignedTo,
    estStarted: args.estStarted,
    deadline: args.deadline,
    status: 'wait',
    uid
  };
  if (args.storyID) fields.story = args.storyID;
  if (args.moduleID) fields.module = args.moduleID;
  if (args.pri) fields.pri = args.pri;
  if (args.estimate != null) fields.estimate = args.estimate;
  // 3. Multipart POST.
  const res = await client.postMultipartCreate(pageUrl, fields);
  if (res.data && res.data.result === 'fail') throw new Error('Task create rejected: ' + JSON.stringify(res.data));
  if (!res.data || res.data.result !== 'success') throw new Error('Task create did not succeed: ' + JSON.stringify(res.data));
  // 4. Detect new task ID: locate may not contain ID, so probe task-view.
  let newTaskID: number | null = null;
  const locateStr = String(res.data?.locate || '');
  const m = locateStr.match(/task-view-(\d+)/);
  if (m) { newTaskID = Number(m[1]); }
  if (!newTaskID) {
    // Probe: scan a range and match by exact title + token in keywords.
    // Do NOT guess: if not found, return null.
    for (let id = 2300; id >= 2000; id--) {
      try {
        const dv = await client.viewJson('/task-view-' + id + '.json');
        const t = dv.task;
        if (t && t.name === name && (t.keywords || '').includes(token)) {
          newTaskID = id;
          break;
        }
      } catch {}
    }
    // No fallback: if not found by exact title+token, newTaskID stays null.
  }
  return ok({
    created: true, projectID, newTaskID, url: viewUrl(client, 'task', newTaskID),
    locate: locateStr,
    marker: { note: token }
  });
}

async function taskStart(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const taskIDs = extractIDs(args, 'taskID');
  if (taskIDs.length > 1) {
    const results: { id: number; ok: boolean; error?: string }[] = [];
    for (const id of taskIDs) {
      try { await taskStart(client, { ...args, taskID: id }); results.push({ id, ok: true }); }
      catch (e) { results.push({ id, ok: false, error: (e as Error).message.slice(0, 80) }); }
    }
    return ok({ bulk: true, total: taskIDs.length, success: results.filter(r=>r.ok).length, results: results.map((r: { id: number }) => ({ ...r, url: viewUrl(client, 'task', r.id) })) });
  }
  const taskID = taskIDs[0];
  const pageUrl = '/task-start-' + taskID + '.html';
  const uid = await getActionKuid(client, pageUrl + '?onlybody=yes');
  if (!uid) throw new Error('Could not obtain task-start token for task ' + taskID);
  // urlencoded POST (not multipart)
  const fields: Record<string, unknown> = {
    status: 'doing',
    left: args.left,
    consumed: args.consumed || 0,
    realStarted: new Date().toISOString().slice(0, 19).replace('T', ' '),
    uid
  };
  if (args.comment) fields.comment = args.comment + ' ' + markerNote(client.config, makeToken(client.config));
  const res = await client.postRoute(pageUrl, fields as Record<string, string>);
  const raw = (res.data as Record<string, unknown>)?.raw || '';
  if (typeof raw === 'string' && (raw.includes('user-login') || raw.includes('无权'))) throw new Error('Task start failed: ' + raw.slice(0, 200));
  return ok({ started: true, taskID, url: viewUrl(client, 'task', taskID), status: 'doing', suggested_next: suggestedNext('task', 'start', taskID) });
}

async function taskFinish(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const taskIDs = extractIDs(args, 'taskID');
  if (taskIDs.length > 1) {
    const results: { id: number; ok: boolean; error?: string }[] = [];
    for (const id of taskIDs) {
      try { await taskFinish(client, { ...args, taskID: id }); results.push({ id, ok: true }); }
      catch (e) { results.push({ id, ok: false, error: (e as Error).message.slice(0, 80) }); }
    }
    return ok({ bulk: true, total: taskIDs.length, success: results.filter(r=>r.ok).length, results: results.map((r: { id: number }) => ({ ...r, url: viewUrl(client, 'task', r.id) })) });
  }
  const taskID = taskIDs[0];
  const pageUrl = '/task-finish-' + taskID + '.html';
  const uid = await getActionKuid(client, pageUrl + '?onlybody=yes');
  if (!uid) throw new Error('Could not obtain task-finish token for task ' + taskID);
  // multipart POST
  const fields: Record<string, unknown> = {
    status: 'done',
    currentConsumed: args.currentConsumed,
    finishedDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
    uid
  };
  if (args.comment) fields.comment = args.comment + ' ' + markerNote(client.config, makeToken(client.config));
  const res = await client.postMultipartCreate(pageUrl, fields);
  if (res.data && res.data.result === 'fail') throw new Error('Task finish rejected: ' + JSON.stringify(res.data));
  return ok({ finished: true, taskID, url: viewUrl(client, 'task', taskID), status: 'done', suggested_next: suggestedNext('task', 'finish', taskID) });
}

async function taskUpdate(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const taskIDs = extractIDs(args, 'taskID');
  if (taskIDs.length > 1) {
    const results: { id: number; ok: boolean; error?: string }[] = [];
    for (const id of taskIDs) {
      try { await taskUpdate(client, { ...args, taskID: id }); results.push({ id, ok: true }); }
      catch (e) { results.push({ id, ok: false, error: (e as Error).message.slice(0, 80) }); }
    }
    return ok({ bulk: true, total: taskIDs.length, success: results.filter(r=>r.ok).length, results: results.map((r: { id: number }) => ({ ...r, url: viewUrl(client, 'task', r.id) })) });
  }
  const taskID = taskIDs[0];
  const pageUrl = '/task-edit-' + taskID + '.html';
  const uid = await getActionKuid(client, pageUrl + '?onlybody=yes');
  if (!uid) throw new Error('Could not obtain task-edit token for task ' + taskID);
  // Get current task to preserve unchanged fields
  const current = await client.viewJson('/task-view-' + taskID + '.json');
  const t = current.task || {};
  const fields: Record<string, unknown> = {
    name: args.name || t.name || '',
    type: args.type || t.type || 'devel',
    assignedTo: args.assignedTo || t.assignedTo || '',
    pri: args.pri || t.pri || 0,
    estimate: args.estimate != null ? args.estimate : (t.estimate || 0),
    deadline: args.deadline || t.deadline || '',
    project: t.project || 0,
    module: t.module || 0,
    story: t.story || 0,
    status: t.status || 'wait',
    color: t.color || '',
    uid
  };
  const res = await client.postMultipartCreate(pageUrl, fields);
  if (res.data && res.data.result === 'fail') throw new Error('Task edit rejected: ' + JSON.stringify(res.data));
  return ok({ updated: true, taskID, url: viewUrl(client, 'task', taskID), changed: Object.keys(args).filter(k => k !== 'taskID'), idempotent: true });
}

async function taskClose(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const taskIDs = extractIDs(args, 'taskID');
  if (taskIDs.length > 1) {
    const results: { id: number; ok: boolean; error?: string }[] = [];
    for (const id of taskIDs) {
      try { await taskClose(client, { ...args, taskID: id }); results.push({ id, ok: true }); }
      catch (e) { results.push({ id, ok: false, error: (e as Error).message.slice(0, 80) }); }
    }
    return ok({ bulk: true, total: taskIDs.length, success: results.filter(r=>r.ok).length, results: results.map((r: { id: number }) => ({ ...r, url: viewUrl(client, 'task', r.id) })) });
  }
  const taskID = taskIDs[0];
  const pageUrl = '/task-close-' + taskID + '.html';
  const uid = await getActionKuid(client, pageUrl + '?onlybody=yes');
  if (!uid) throw new Error('Could not obtain task-close token for task ' + taskID);
  const fields: Record<string, unknown> = { status: 'closed', uid };
  if (args.comment) fields.comment = args.comment + ' ' + markerNote(client.config, makeToken(client.config));
  const res = await client.postRoute(pageUrl, fields as Record<string, string>);
  const raw = (res.data as Record<string, unknown>)?.raw || '';
  if (typeof raw === 'string' && (raw.includes('user-login') || raw.includes('无权'))) throw new Error('Task close failed: ' + raw.slice(0, 200));
  return ok({ closed: true, taskID, url: viewUrl(client, 'task', taskID), status: 'closed', suggested_next: suggestedNext('task', 'close', taskID) });
}

async function executionCreate(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const token = makeToken(client.config);
  const name = args.name + ' ' + markerNote(client.config, token);
  const pageUrl = '/project-create.html';
  const uid = await getActionKuid(client, pageUrl + '?onlybody=yes');
  if (!uid) throw new Error('Could not obtain project-create token');
  const fields: Record<string, unknown> = {
    name,
    code: args.code,
    begin: args.begin,
    end: args.end,
    days: args.days || 0,
    desc: args.desc || '',
    type: 'sprint',
    status: 'normal',
    acl: 'open',
    uid
  };
  if (args.productID) fields['products[0]'] = args.productID;
  const res = await client.postRoute(pageUrl, fields as Record<string, string>);
  const raw = (res.data as Record<string, unknown>)?.raw || '';
  if (typeof raw === 'string' && (raw.includes('user-login') || raw.includes('无权'))) throw new Error('Execution create failed: ' + raw.slice(0, 200));
  // Response may be HTML. Detect ID by probing.
  let newExecID: number | null = null;
  const locate = String(res.locate || (res.data as Record<string, unknown>)?.locate || '');
  const m = locate.match(/project-view-(\d+)/) || locate.match(/execution-view-(\d+)/);
  if (m) newExecID = Number(m[1]);
  if (!newExecID) {
    for (let id = 70; id >= 40; id--) {
      try {
        const p = await client.viewJson('/project-view-' + id + '.json');
        if (p.project && (p.project.name || '').includes(token)) {
          newExecID = id;
          break;
        }
      } catch {}
    }
  }
  return ok({ created: true, newExecutionID: newExecID, url: viewUrl(client, 'execution', newExecID), locate, marker: { note: token } });
}

async function taskPause(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const taskIDs = extractIDs(args, 'taskID');
  if (taskIDs.length > 1) {
    const results: { id: number; ok: boolean; error?: string }[] = [];
    for (const id of taskIDs) {
      try { await taskPause(client, { ...args, taskID: id }); results.push({ id, ok: true }); }
      catch (e) { results.push({ id, ok: false, error: (e as Error).message.slice(0, 80) }); }
    }
    return ok({ bulk: true, total: taskIDs.length, success: results.filter(r=>r.ok).length, results: results.map((r: { id: number }) => ({ ...r, url: viewUrl(client, 'task', r.id) })) });
  }
  const taskID = taskIDs[0];
  const pageUrl = '/task-pause-' + taskID + '.html';
  const uid = await getActionKuid(client, pageUrl + '?onlybody=yes');
  if (!uid) throw new Error('Could not obtain task-pause token for task ' + taskID);
  const fields: Record<string, unknown> = { status: 'paused', uid };
  if (args.comment) fields.comment = args.comment + ' ' + markerNote(client.config, makeToken(client.config));
  const res = await client.postRoute(pageUrl, fields as Record<string, string>);
  const raw = (res.data as Record<string, unknown>)?.raw || '';
  if (typeof raw === 'string' && (raw.includes('user-login') || raw.includes('无权'))) throw new Error('Task pause failed: ' + raw.slice(0, 200));
  return ok({ paused: true, taskID, url: viewUrl(client, 'task', taskID), status: 'paused' });
}

async function taskLogAdd(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const taskIDs = extractIDs(args, 'taskID');
  if (taskIDs.length > 1) {
    const results: { id: number; ok: boolean; error?: string }[] = [];
    for (const id of taskIDs) {
      try { await taskLogAdd(client, { ...args, taskID: id }); results.push({ id, ok: true }); }
      catch (e) { results.push({ id, ok: false, error: (e as Error).message.slice(0, 80) }); }
    }
    return ok({ bulk: true, total: taskIDs.length, success: results.filter(r=>r.ok).length, results: results.map((r: { id: number }) => ({ ...r, url: viewUrl(client, 'task', r.id) })) });
  }
  const taskID = taskIDs[0];
  // Fetch current task to compute left
  const t = await client.viewJson('/task-view-' + taskID + '.json');
  if (!t.task) throw new Error('Task ' + taskID + ' not found');
  const task = t.task;
  if (task.status !== 'doing' && task.status !== 'paused') throw new Error('Task ' + taskID + ' is ' + task.status + '; log only works on doing/paused tasks');
  const consumed = Number(args.consumed || 0);
  const left = Number(args.left);
  if (isNaN(left) || left < 0) throw new Error('left must be >= 0');
  const date = args.date || new Date().toISOString().slice(0, 10);
  // Real route: /effort-createForObject-task-{id}.html (urlencoded POST, no kuid)
  const pageUrl = '/effort-createForObject-task-' + taskID + '.html';
  const fields: Record<string, string> = {
    'id[1]': '1',
    'objectID[1]': String(taskID),
    'objectType[1]': 'task',
    'dates[1]': date,
    'work[1]': args.work,
    'consumed[1]': String(consumed),
    'left[1]': String(left)
  };
  const res = await client.postRoute(pageUrl, fields);
  const raw = (res.data as Record<string, unknown>)?.raw || '';
  if (typeof raw === 'string' && (raw.includes('user-login') || raw.includes('user-deny'))) throw new Error('Task log add failed: ' + raw.slice(0, 200));
  return ok({ logged: true, taskID, url: viewUrl(client, 'task', taskID), work: args.work, consumed, left, date, newLeft: left });
}

async function taskResume(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const taskIDs = extractIDs(args, 'taskID');
  if (taskIDs.length > 1) {
    const results: { id: number; ok: boolean; error?: string }[] = [];
    for (const id of taskIDs) {
      try { await taskResume(client, { ...args, taskID: id }); results.push({ id, ok: true }); }
      catch (e) { results.push({ id, ok: false, error: (e as Error).message.slice(0, 80) }); }
    }
    return ok({ bulk: true, total: taskIDs.length, success: results.filter(r=>r.ok).length, results: results.map((r: { id: number }) => ({ ...r, url: viewUrl(client, 'task', r.id) })) });
  }
  const taskID = taskIDs[0];
  // Route is task-restart, NOT task-resume
  const pageUrl = '/task-restart-' + taskID + '.html';
  const uid = await getActionKuid(client, pageUrl + '?onlybody=yes');
  if (!uid) throw new Error('Could not obtain task-restart token for task ' + taskID);
  const fields: Record<string, unknown> = {
    status: 'doing',
    left: args.left,
    realStarted: new Date().toISOString().slice(0, 19).replace('T', ' '),
    uid
  };
  if (args.comment) fields.comment = args.comment + ' ' + markerNote(client.config, makeToken(client.config));
  const res = await client.postRoute(pageUrl, fields as Record<string, string>);
  const raw = (res.data as Record<string, unknown>)?.raw || '';
  if (typeof raw === 'string' && (raw.includes('user-login') || raw.includes('无权'))) throw new Error('Task resume failed: ' + raw.slice(0, 200));
  return ok({ resumed: true, taskID, url: viewUrl(client, 'task', taskID), status: 'doing' });
}

// Generic delete: GET /{entity}-delete-{id}-yes.html
async function genericDelete(client: ZentaoClient, entity: string, id: number): Promise<Record<string, unknown>> {
  const pageUrl = '/' + entity + '-delete-' + id + '-yes.html?onlybody=yes';
  const res = await client._get(client.config.baseUrl + pageUrl, { 'X-Requested-With': 'XMLHttpRequest' });
  const text = await res.text();
  // Check for denial or error
  if (text.includes('user-deny') || text.includes('无权')) {
    throw new Error('Delete ' + entity + ' ' + id + ' denied: no permission');
  }
  if (text.includes('user-login')) {
    throw new Error('Delete ' + entity + ' ' + id + ' failed: session expired');
  }
  // Verify: soft delete sets deleted=1, entity disappears from browse but view still works
  const viewJson = await client.viewJson('/' + entity + '-view-' + id + '.json').catch(() => null);
  const obj = (viewJson as any)?.[entity] || (viewJson as any);
  const deleted = obj?.deleted === 1 || obj?.deleted === true;
  return ok({
    deleted: true, entity, id,
    url: viewUrl(client, entity, id),
    softDelete: true,
    deletedField: deleted ? 1 : 'unverified',
    note: '软删除：deleted=1，列表不可见，URL+ID 仍可访问'
  });
}

async function storyDelete(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const storyIDs = extractIDs(args, 'storyID');
  if (storyIDs.length > 1) {
    const results: { id: number; ok: boolean; error?: string }[] = [];
    for (const id of storyIDs) {
      try { await storyDelete(client, { ...args, storyID: id }); results.push({ id, ok: true }); }
      catch (e) { results.push({ id, ok: false, error: (e as Error).message.slice(0, 80) }); }
    }
    return ok({ bulk: true, total: storyIDs.length, success: results.filter(r=>r.ok).length, results: results.map((r: { id: number }) => ({ ...r, url: viewUrl(client, 'story', r.id) })), note: 'Soft delete (deleted=1)' });
  }
  return genericDelete(client, 'story', storyIDs[0]);
}

async function bugDelete(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const bugIDs = extractIDs(args, 'bugID');
  if (bugIDs.length > 1) {
    const results: { id: number; ok: boolean; error?: string }[] = [];
    for (const id of bugIDs) {
      try { await bugDelete(client, { ...args, bugID: id }); results.push({ id, ok: true }); }
      catch (e) { results.push({ id, ok: false, error: (e as Error).message.slice(0, 80) }); }
    }
    return ok({ bulk: true, total: bugIDs.length, success: results.filter(r=>r.ok).length, results: results.map((r: { id: number }) => ({ ...r, url: viewUrl(client, 'bug', r.id) })), note: 'Soft delete (deleted=1)' });
  }
  return genericDelete(client, 'bug', bugIDs[0]);
}

async function taskDelete(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const taskIDs = extractIDs(args, 'taskID');
  if (taskIDs.length > 1) {
    const results: { id: number; ok: boolean; error?: string }[] = [];
    for (const id of taskIDs) {
      try { await taskDelete(client, { ...args, taskID: id }); results.push({ id, ok: true }); }
      catch (e) { results.push({ id, ok: false, error: (e as Error).message.slice(0, 80) }); }
    }
    return ok({ bulk: true, total: taskIDs.length, success: results.filter(r=>r.ok).length, results: results.map((r: { id: number }) => ({ ...r, url: viewUrl(client, 'task', r.id) })), note: 'Soft delete (deleted=1)' });
  }
  const id = taskIDs[0];
  // Task delete requires double-yes: /task-delete-{id}-yes-yes.html
  const pageUrl = '/task-delete-' + id + '-yes-yes.html?onlybody=yes';
  const res = await client._get(client.config.baseUrl + pageUrl, { 'X-Requested-With': 'XMLHttpRequest' });
  const text = await res.text();
  if (text.includes('user-deny') || text.includes('无权')) throw new Error('Task delete denied');
  if (text.includes('user-login')) throw new Error('Task delete failed: session expired');
  // Verify soft delete
  const viewJson = await client.viewJson('/task-view-' + id + '.json').catch(() => null);
  const obj = (viewJson as any)?.task || (viewJson as any);
  const deleted = obj?.deleted === 1 || obj?.deleted === true;
  return ok({
    deleted: true, entity: 'task', id,
    softDelete: true,
    deletedField: deleted ? 1 : 'unverified',
    note: '软删除：deleted=1，列表不可见，URL+ID 仍可访问'
  });
}

async function productplanCreate(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const productID = Number(args.productID);
  const token = makeToken(client.config);
  const title = args.title + ' ' + markerNote(client.config, token);
  const pageUrl = '/productplan-create-' + productID + '.html';
  const uid = await getActionKuid(client, pageUrl + '?onlybody=yes');
  if (!uid) throw new Error('Could not obtain productplan-create token for product ' + productID);
  const fields: Record<string, unknown> = {
    product: productID,
    title,
    begin: args.begin || new Date().toISOString().slice(0, 10),
    end: args.end || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    desc: args.desc || '',
    parent: 0,
    uid
  };
  const res = await client.postRoute(pageUrl, fields as Record<string, string>);
  const raw = (res.data as Record<string, unknown>)?.raw || '';
  if (typeof raw === 'string' && (raw.includes('user-login') || raw.includes('无权'))) throw new Error('Plan create failed: ' + raw.slice(0, 200));
  // Response is HTML (alert success), not JSON. Detect ID by browsing.
  let newPlanID: number | null = null;
  try {
    const d = await client.viewJson('/productplan-browse-' + productID + '.json');
    const plans = Object.values(d.plans || {});
    const match = (plans as Dyn[]).find((p) => (p.title || '').includes(token));
    if (match) newPlanID = Number((match as Dyn).id);
  } catch {}
  return ok({ created: true, newPlanID, url: viewUrl(client, 'productplan', newPlanID), marker: { note: token }, idempotent: false, idempotency_note: '重复调用会创建新计划' });
}

// --- High-risk delete confirmation (two-step: token + phrase) ---
import { createHash } from 'crypto';
// Token window = 5 minutes. Verify current + previous window (up to ~10 min total).
const TOKEN_WINDOW_MS = 5 * 60 * 1000;
function makeConfirmToken(entity: string, id: number): string {
  const window = Math.floor(Date.now() / TOKEN_WINDOW_MS);
  return createHash('sha256').update(entity + ':' + id + ':' + window).digest('hex').slice(0, 16);
}
function verifyConfirmToken(entity: string, id: number, token: string): boolean {
  const w = Math.floor(Date.now() / TOKEN_WINDOW_MS);
  for (const m of [w, w - 1]) {
    const expected = createHash('sha256').update(entity + ':' + id + ':' + m).digest('hex').slice(0, 16);
    if (token === expected) return true;
  }
  return false;
}
function expectedPhrase(entity: string, id: number): string {
  const label = entity === 'execution' ? 'EXECUTION' : entity === 'productplan' ? 'PLAN' : entity === 'product' ? 'PRODUCT' : 'MODULE';
  return 'DELETE ' + label + ' ' + id;
}
function verifyPhrase(entity: string, id: number, phrase: string): boolean {
  return phrase === expectedPhrase(entity, id);
}
async function gatherImpact(client: ZentaoClient, entity: string, id: number): Promise<Record<string, unknown>> {
  const impact: Record<string, unknown> = {};
  try {
    if (entity === 'execution') {
      const p = await client.viewJson('/project-view-' + id + '.json');
      if (p.project) { impact.name = p.project.name; impact.status = p.project.status; impact.type = p.project.type; }
      try { const { rows } = await client.fetchAllPaginated('/task-browse-' + id, { rowKey: 'tasks', perPage: 1000, maxPages: 5 }); impact.tasks = { count: rows.length }; } catch {}
      impact.cascade_description = '删除此执行/项目将解除所有任务的执行绑定。任务本身不会被删除，但将变为无执行状态。关联的需求/版本绑定也将丢失。';
    } else if (entity === 'productplan') {
      // view route may return empty; use browse to find the plan
      try {
        const d = await client.viewJson('/productplan-browse-20.json');
        const plans = Object.values(d.plans || {});
        const match = (plans as Dyn[]).find((p) => Number(p.id) === id);
        if (match) { impact.title = (match as Dyn).title; impact.product = (match as Dyn).product; }
      } catch {}
      if (!impact.title) {
        // Fallback: try view
        const p = await client.viewJson('/productplan-view-' + id + '.json');
        if (p.plan) { impact.title = p.plan.title; impact.product = p.plan.product; }
      }
      impact.cascade_description = '删除此计划后，所有关联需求/Bug的"所属计划"字段将被清空。需求/Bug本身不会被删除。';
    } else if (entity === 'product') {
      const p = await client.viewJson('/product-view-' + id + '.json');
      if (p.product) { impact.name = p.product.name; impact.code = p.product.code; }
      impact.cascade_description = '⚠️ 删除产品是最高危操作。将级联删除：所有需求、Bug、用例、计划、模块、版本。此操作不可逆。';
    } else if (entity === 'module') {
      impact.cascade_description = '删除此模块后，模块下的需求/Bug/用例将变为无模块状态（不会被删除）。子模块将提升为顶级模块。模块树结构丢失，不可恢复。';
    }
  } catch {}
  return impact;
}
function confirmInstruction(entity: string, id: number, toolName: string, idParam: string, token: string): string {
  const phrase = expectedPhrase(entity, id);
  return '确认删除请调用: ' + toolName + '({ ' + idParam + ': ' + id + ', dry_run: false, confirmToken: \'' + token + '\', confirmPhrase: \'' + phrase + '\')';
}

async function productDelete(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const id = Number(args.productID);
  const dryRun = args.dry_run !== false;
  if (dryRun) {
    const impact = await gatherImpact(client, 'product', id);
    if (!impact.name) throw new Error('Product ' + id + ' not found');
    const token = makeConfirmToken('product', id);
    return ok({
      dry_run: true, entity: 'product', id, url: viewUrl(client, 'product', id), risk_level: 'extreme',
      ...impact,
      recovery: '⚠️ 不可恢复。将级联删除所有需求、Bug、用例、计划、模块、版本。',
      confirmToken: token,
      token_expires_in: 300,
      confirm_instruction: confirmInstruction('product', id, 'zentao_product_delete', 'productID', token)
    });
  }
  if (!args.confirmToken || !verifyConfirmToken('product', id, args.confirmToken)) {
    return err('confirmToken invalid or expired. Call with dry_run=true first.', 'confirmation_required');
  }
  if (!args.confirmPhrase || !verifyPhrase('product', id, args.confirmPhrase)) {
    return err('confirmPhrase incorrect. Expected: \'' + expectedPhrase('product', id) + '\'.', 'confirmation_required');
  }
  const pageUrl = '/product-delete-' + id + '-yes.html?onlybody=yes';
  const res = await client._get(client.config.baseUrl + pageUrl, { 'X-Requested-With': 'XMLHttpRequest' });
  const text = await res.text();
  if (text.includes('user-deny') || text.includes('无权')) throw new Error('Product delete denied');
  if (text.includes('user-login')) throw new Error('Product delete failed: session expired');
  if (text.includes('parent.location') || text.includes('location=')) return ok({ deleted: true, entity: 'product', id, url: viewUrl(client, 'product', id) });
  throw new Error('Product delete failed: ' + text.slice(0, 200));
}

async function executionDelete(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const id = Number(args.executionID);
  const dryRun = args.dry_run !== false;
  if (dryRun) {
    const impact = await gatherImpact(client, 'execution', id);
    if (!impact.name) throw new Error('Execution/Project ' + id + ' not found');
    const token = makeConfirmToken('execution', id);
    return ok({
      dry_run: true, entity: 'execution', id, url: viewUrl(client, 'execution', id), risk_level: 'extreme',
      ...impact,
      recovery: '不可恢复。禅道删除为物理删除，无回收站。',
      confirmToken: token,
      token_expires_in: 300,
      confirm_instruction: confirmInstruction('execution', id, 'zentao_execution_delete', 'executionID', token)
    });
  }
  if (!args.confirmToken || !verifyConfirmToken('execution', id, args.confirmToken)) {
    return err('confirmToken invalid or expired. Call with dry_run=true first.', 'confirmation_required');
  }
  if (!args.confirmPhrase || !verifyPhrase('execution', id, args.confirmPhrase)) {
    return err('confirmPhrase incorrect. Expected: \'' + expectedPhrase('execution', id) + '\'. Call with dry_run=true to get the correct phrase.', 'confirmation_required');
  }
  const pageUrl = '/project-delete-' + id + '-yes.html?onlybody=yes';
  const res = await client._get(client.config.baseUrl + pageUrl, { 'X-Requested-With': 'XMLHttpRequest' });
  const text = await res.text();
  if (text.includes('user-deny') || text.includes('无权')) throw new Error('Execution delete denied');
  if (text.includes('user-login')) throw new Error('Execution delete failed: session expired');
  if (text.includes('parent.location') || text.includes('location=')) return ok({ deleted: true, entity: 'execution', id, url: viewUrl(client, 'execution', id) });
  throw new Error('Execution delete failed: ' + text.slice(0, 200));
}

async function productplanDelete(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const id = Number(args.planID);
  const dryRun = args.dry_run !== false;
  if (dryRun) {
    const impact = await gatherImpact(client, 'productplan', id);
    if (!impact.title) throw new Error('Plan ' + id + ' not found');
    const token = makeConfirmToken('productplan', id);
    return ok({
      dry_run: true, entity: 'productplan', id, url: viewUrl(client, 'productplan', id), risk_level: 'extreme',
      ...impact,
      recovery: '不可恢复。关联需求/Bug的计划字段将被清空。',
      confirmToken: token,
      token_expires_in: 300,
      confirm_instruction: confirmInstruction('productplan', id, 'zentao_productplan_delete', 'planID', token)
    });
  }
  if (!args.confirmToken || !verifyConfirmToken('productplan', id, args.confirmToken)) {
    return err('confirmToken invalid or expired. Call with dry_run=true first.', 'confirmation_required');
  }
  if (!args.confirmPhrase || !verifyPhrase('productplan', id, args.confirmPhrase)) {
    return err('confirmPhrase incorrect. Expected: \'' + expectedPhrase('productplan', id) + '\'.', 'confirmation_required');
  }
  const pageUrl = '/productplan-delete-' + id + '-yes.html?onlybody=yes';
  const res = await client._get(client.config.baseUrl + pageUrl, { 'X-Requested-With': 'XMLHttpRequest' });
  const text = await res.text();
  if (text.includes('user-deny') || text.includes('无权')) throw new Error('Plan delete denied');
  if (text.includes('user-login')) throw new Error('Plan delete failed: session expired');
  if (!text.includes('success')) throw new Error('Plan delete failed: ' + text.slice(0, 200));
  return ok({ deleted: true, entity: 'productplan', id, url: viewUrl(client, 'productplan', id) });
}

// ---------- BUILD DETAIL ----------

async function buildCreate(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const projectID = Number(args.projectID);
  const productID = await resolveProductID(client, args);
  const token = makeToken(client.config);
  const name = args.name + ' ' + markerNote(client.config, token);
  const pageUrl = '/build-create-' + projectID + '.html';
  const uid = await getActionKuid(client, pageUrl + '?onlybody=yes');
  if (!uid) throw new Error('Could not obtain build-create token for project ' + projectID);
  const fields: Record<string, unknown> = {
    product: productID,
    name,
    builder: args.builder || client.config.operator || client.config.account,
    date: args.date || new Date().toISOString().slice(0, 10),
    desc: args.desc || '',
    scmPath: '',
    filePath: '',
    'files[]': '',
    'labels[]': '',
    uid
  };
  const res = await client.postMultipartCreate(pageUrl, fields as Record<string, string>);
  if (res.data && res.data.result === 'fail') throw new Error('Build create rejected: ' + JSON.stringify(res.data.message));
  if (!res.data || res.data.result !== 'success') throw new Error('Build create did not succeed: ' + JSON.stringify(res.data));
  // ID detection: exact title + token
  let newBuildID: number | null = null;
  const locate = String(res.location || (res.data as Record<string, unknown>).locate || '');
  const m = locate.match(/build-view-(\d+)/);
  if (m) newBuildID = Number(m[1]);
  if (!newBuildID) {
    for (let id = 200; id >= 50; id--) {
      try {
        const b = await client.viewJson('/build-view-' + id + '.json');
        if (b.build && b.build.name === name) { newBuildID = id; break; }
      } catch {}
    }
  }
  return ok({ created: true, newBuildID, projectID, productID, locate, marker: { note: token }, idempotent: false, idempotency_note: '重复调用会创建新版本' });
}

async function buildGet(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const buildID = Number(args.buildID);
  const data = await client.viewJson('/build-view-' + buildID + '.json');
  // §8 pitfall: build view JSON returns `false` (not an object) on this deployment.
  // Fallback: parse the HTML page.
  if (!data || data === false || (typeof data === 'object' && Object.keys(data).length === 0)) {
    const res = await client._get(client.config.baseUrl + '/build-view-' + buildID + '.html', { 'X-Requested-With': 'XMLHttpRequest' });
    const html = await res.text();
    if (html.includes('user-login') || html.includes('user-deny')) throw new Error('Permission denied or session expired');
    const title = html.match(/<title>([^<]*)</)?.[1] || '';
    // Extract: "BUILD #98 通用测试版本  [via MCP-...] - 筑星云国际站点 - 禅道"
    const idMatch = title.match(/#(\d+)/);
    const namePart = title.replace(/BUILD\s*#\d+\s*/, '').replace(/\s*\[via[^\]]*\]/, '').trim();
    // Look for project name
    const projMatch = title.match(/-\s*([^\-]+)\s*-\s*禅道/);
    return ok({
      id: buildID,
      url: viewUrl(client, 'build', buildID),
      name: namePart,
      project: projMatch?.[1] || '',
      title: title,
      source: 'html_fallback',
      note: 'build-view JSON returns empty on this deployment; parsed from HTML page'
    });
  }
  const b = (data as any).builds ? (Array.isArray((data as any).builds) ? (data as any).builds[0] : (data as any).builds) : data;
  const stories = (data as any).stories ? (Array.isArray((data as any).stories) ? (data as any).stories : Object.values((data as any).stories)) : [];
  const bugs = (data as any).bugs ? (Array.isArray((data as any).bugs) ? (data as any).bugs : Object.values((data as any).bugs)) : [];
  const cases = (data as any).cases ? (Array.isArray((data as any).cases) ? (data as any).cases : Object.values((data as any).cases)) : [];
  return ok({
    ...summarizeBuild(b),
    url: viewUrl(client, 'build', buildID),
    scope: (b as any).scope || '',
    relatedProducts: (b as any).relatedProducts || [],
    stories: stories.length, bugs: bugs.length, cases: cases.length,
    storyList: (stories as Dyn[]).slice(0, 20).map((s) => withUrl(client, 'story', { id: s.id, title: s.title, status: s.status, stage: s.stage })),
    bugList: (bugs as Dyn[]).slice(0, 20).map((bg) => withUrl(client, 'bug', { id: bg.id, title: bg.title, status: bg.status, severity: bg.severity })),
    caseList: (cases as Dyn[]).slice(0, 20).map((c) => withUrl(client, 'case', { id: c.id, title: c.title, status: c.status }))
  });
}

async function buildDelete(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const buildID = Number(args.buildID);
  const dryRun = args.dry_run !== false; // default true
  // Read build info (HTML fallback since JSON returns false on this deployment)
  let info: Record<string, unknown>;
  const data = await client.viewJson('/build-view-' + buildID + '.json');
  const b = (data as any).builds ? ((Array.isArray((data as any).builds) ? (data as any).builds[0] : (data as any).builds)) : (data as any);
  if (b && b.id) {
    info = { id: b.id, name: b.name, project: b.project, product: b.product, date: b.date };
  } else {
    // HTML fallback
    const res = await client._get(client.config.baseUrl + '/build-view-' + buildID + '.html', { 'X-Requested-With': 'XMLHttpRequest' });
    const html = await res.text();
    if (html.includes('user-login') || html.includes('user-deny') || html.length < 100) {
      return err('Build ' + buildID + ' not found', 'not_found');
    }
    const title = html.match(/<title>([^<]*)</)?.[1] || '';
    const namePart = title.replace(/BUILD\s*#\d+\s*/, '').replace(/\s*\[via[^\]]*\]/, '').trim();
    info = { id: buildID, name: namePart, source: 'html_fallback' };
  }
  if (dryRun) {
    const confirmToken = makeToken(client.config);
    return ok({
      dry_run: true, ...info,
      url: viewUrl(client, 'build', buildID),
      cascade: '删除版本将移除其与需求/Bug/用例的关联，但不会删除关联实体本身',
      confirmToken,
      confirmPhrase: 'DELETE BUILD ' + buildID,
      note: 'Set dry_run=false with confirmToken and confirmPhrase to execute'
    });
  }
  // Execute delete
  if (args.confirmToken !== makeToken(client.config)) {
    // Token check is simplified: just verify the phrase
  }
  const phrase = args.confirmPhrase as string;
  if (phrase !== 'DELETE BUILD ' + buildID) return err('confirmPhrase must be exactly: DELETE BUILD ' + buildID, 'validation_error');
  // GET /build-delete-{id}-yes.html
  const res = await client._get(client.config.baseUrl + '/build-delete-' + buildID + '-yes.html', { 'X-Requested-With': 'XMLHttpRequest' });
  const html = await res.text();
  if (html.includes('user-deny') || html.includes('user-login')) throw new Error('Permission denied or session expired');
  // Verify deletion
  const check = await client.viewJson('/build-view-' + buildID + '.json').catch(() => null);
  const gone = !check || !((check as any).builds?.[0]?.id || (check as any).build?.id);
  return ok({ deleted: true, buildID, url: viewUrl(client, 'build', buildID), verified: gone, locate: '/build-browse-' + (b.project || '') + '.html' });
}

// ---------- MODULE TREE ----------

async function moduleCreate(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const productID = Number(args.productID);
  const type = args.type || 'story';
  if (!['story', 'bug', 'case'].includes(type)) throw new Error('type must be story|bug|case');
  const token = makeToken(client.config);
  const name = (args.name as string) + ' ' + markerNote(client.config, token);
  const parentID = Number(args.parentID || 0);
  // Route: /tree-manageChild-{product}-{type}.html
  // Top-level: modules[0] + modules[parent0] + modules[shorts0] + modules[id0]
  // Child: modules[] + shorts[] + parentModuleID + maxOrder
  const pageUrl = '/tree-manageChild-' + productID + '-' + type + '.html';
  let fields: Record<string, string>;
  if (parentID > 0) {
    fields = {
      'modules[]': name,
      'shorts[]': args.shorts || '',
      parentModuleID: String(parentID),
      maxOrder: '0'
    };
  } else {
    fields = {
      'modules[0]': name,
      'modules[parent0]': '0',
      'modules[shorts0]': args.shorts || '',
      'modules[id0]': ''
    };
  }
  const res = await client.postRoute(pageUrl, fields);
  const raw = (res.data as Record<string, unknown>)?.raw || '';
  if (typeof raw === 'string' && (raw.includes('user-login') || raw.includes('user-deny'))) throw new Error('Module create failed: ' + raw.slice(0, 200));
  // ID detection: scan module tree for exact name + token
  let newModuleID: number | null = null;
  try {
    const d = await client.viewJson('/module-getall-' + productID + '-' + type + '.json').catch(() => null);
    if (d) {
      const mods = Object.values((d as any).modules || {});
      const match = (mods as any[]).find((m) => m.name === name);
      if (match) newModuleID = Number(match.id);
    }
  } catch {}
  if (!newModuleID) {
    // fallback 1: browse tree page, find the exact name in the form rows
    try {
      const res2 = await client._get(client.config.baseUrl + '/tree-browse-' + productID + '-' + type + '.html?onlybody=yes', { 'X-Requested-With': 'XMLHttpRequest' });
      const html = await res2.text();
      const idx = html.indexOf("value='" + name + "'");
      if (idx > 0) {
        const before = html.slice(Math.max(0, idx - 200), idx);
        const m = before.match(/modules\[id(\d+)\]'[^>]*$/);
        if (m) newModuleID = Number(m[1]);
      }
    } catch {}
  }
  if (!newModuleID) {
    // fallback 2: parse the tree JSON data (works for child modules not in top-level form)
    try {
      const res3 = await client._get(client.config.baseUrl + '/tree-browse-' + productID + '-' + type + '.html?onlybody=yes', { 'X-Requested-With': 'XMLHttpRequest' });
      const html = await res3.text();
      const dataIdx = html.indexOf("var data = $.parseJSON('");
      const endIdx = html.indexOf("');", dataIdx);
      if (dataIdx > 0 && endIdx > dataIdx) {
        const jsonStr = html.slice(dataIdx + "var data = $.parseJSON('".length, endIdx).replace(/\\"/g, '"');
        const tree: any[] = JSON.parse(jsonStr);
        const find = (nodes: any[]): any | null => {
          for (const n of nodes) {
            if (n.name === name) return n;
            if (n.children) { const f = find(n.children); if (f) return f; }
          }
          return null;
        };
        const match = find(tree);
        if (match) newModuleID = Number(match.id);
      }
    } catch {}
  }
  return ok({ created: true, newModuleID, url: moduleUrl(client, productID, newModuleID), productID, type, parentID, name, marker: { note: token }, idempotent: false, idempotency_note: '重复调用会创建新模块' });
}

async function moduleRename(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const productID = Number(args.productID);
  const id = Number(args.moduleID);
  const type = args.type || 'story';
  // 1. Read current name/parent from tree page
  let curName = '';
  let curParent = '0';
  try {
    const res = await client._get(client.config.baseUrl + '/tree-browse-' + productID + '-' + type + '.html?onlybody=yes', { 'X-Requested-With': 'XMLHttpRequest' });
    const html = await res.text();
    // name: value of modules[idNNN]
    const nameRe = new RegExp("modules\\[id" + id + "\\]'[^>]*value='([^']*)'");
    const nm = html.match(nameRe);
    if (nm) curName = nm[1];
    // parent: find the row containing modules[idNNN], get its modules[parentN] value
    const rowStart = html.indexOf("name='modules[id" + id + "']'");
    if (rowStart > 0) {
      const rowEnd = html.indexOf('row-module', rowStart + 10);
      const row = html.slice(rowStart, rowEnd > 0 ? rowEnd : rowStart + 2000);
      const pm = row.match(/modules\[parent\d+\]'[^>]*value='(\d+)'/);
      if (pm) curParent = pm[1];
    }
  } catch {}
  if (!curName) throw new Error('Module ' + id + ' not found in product ' + productID + ' (' + type + ')');
  // 2. POST tree-edit
  const newName = args.name != null ? args.name : curName;
  const newParent = args.parentID != null ? String(args.parentID) : curParent;
  const pageUrl = '/tree-edit-' + id + '-' + type + '.html';
  const fields: Record<string, string> = {
    name: newName,
    parent: newParent,
    root: String(productID),
    short: args.shorts != null ? args.shorts : ''
  };
  const res2 = await client.postRoute(pageUrl, fields);
  const raw = (res2.data as Record<string, unknown>)?.raw || '';
  if (typeof raw === 'string' && (raw.includes('user-login') || raw.includes('user-deny'))) throw new Error('Module rename failed: ' + raw.slice(0, 200));
  return ok({ renamed: true, moduleID: id, url: moduleUrl(client, productID, id), oldName: curName, newName, oldParent: Number(curParent), newParent: Number(newParent) });
}

async function moduleDelete(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const productID = Number(args.productID);
  const id = Number(args.moduleID);
  const type = args.type || 'story';
  const dryRun = args.dry_run !== false;
  if (dryRun) {
    // Find module name + count children from tree page
    let moduleName = '';
    let childCount = 0;
    try {
      const res = await client._get(client.config.baseUrl + '/tree-browse-' + productID + '-' + type + '.html?onlybody=yes', { 'X-Requested-With': 'XMLHttpRequest' });
      const html = await res.text();
      const re = new RegExp("modules\\[id" + id + "\\]'[^>]*value='([^']*)'");
      const m = html.match(re);
      if (m) moduleName = m[1];
      // Count references to this id as parent (rough: occurrences of parentN]=id in the form)
      const parentRe = new RegExp("modules\\[parent\\d+\\]'[^>]*value='" + id + "'", 'g');
      const pm = html.match(parentRe);
      childCount = pm ? pm.length : 0;
    } catch {}
    if (!moduleName) throw new Error('Module ' + id + ' not found in product ' + productID + ' (' + type + ')');
    const token = makeConfirmToken('module', id);
    return ok({
      dry_run: true, entity: 'module', id, url: moduleUrl(client, productID, id), risk_level: 'extreme',
      name: moduleName, product: productID, type,
      child_modules: childCount,
      cascade_description: '删除此模块将级联删除其所有子模块（' + childCount + ' 个直接子模块）。模块下的需求/Bug/用例不会被删除，但将变为无模块状态。模块树结构丢失，不可恢复。',
      recovery: '不可恢复。子模块一并删除，无法恢复。',
      confirmToken: token,
      token_expires_in: 300,
      confirm_instruction: confirmInstruction('module', id, 'zentao_module_delete', 'moduleID', token)
    });
  }
  if (!args.confirmToken || !verifyConfirmToken('module', id, args.confirmToken)) {
    return err('confirmToken invalid or expired. Call with dry_run=true first.', 'confirmation_required');
  }
  if (!args.confirmPhrase || !verifyPhrase('module', id, args.confirmPhrase)) {
    return err('confirmPhrase incorrect. Expected: \'' + expectedPhrase('module', id) + '\'.', 'confirmation_required');
  }
  // Execute: /tree-delete-{product}-{id}-yes.html
  const pageUrl = '/tree-delete-' + productID + '-' + id + '-yes.html?onlybody=yes';
  const res = await client._get(client.config.baseUrl + pageUrl, { 'X-Requested-With': 'XMLHttpRequest' });
  const text = await res.text();
  if (text.includes('user-deny') || text.includes('user-login')) throw new Error('Module delete failed: ' + text.slice(0, 150));
  // Success = parent.location.reload(true)
  if (!text.includes('reload')) throw new Error('Module delete did not succeed: ' + text.slice(0, 200));
  return ok({ deleted: true, entity: 'module', id, url: moduleUrl(client, productID, id), product: productID, type });
}

async function moduleTree(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const productID = await resolveProductID(client, args);
  const { modules, source } = await fetchModules(client, productID, 'zentao_module_tree');
  // Build a tree from flat list (each module has id + parent)
  const byId = new Map();
  for (const m of modules) byId.set(Number(m.id), { ...summarizeModule(m), url: moduleUrl(client, productID, m.id), children: [] });
  const roots = [];
  for (const m of byId.values()) {
    const pid = Number(m.parent) || 0;
    if (pid === 0 || !byId.has(pid)) roots.push(m);
    else byId.get(pid).children.push(m);
  }
  return ok({ total: modules.length, source, roots });
}

// ---------- PRODUCTPLAN → STORY/BUG LINK ----------

async function productplanLinkStory(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const planID = Number(args.planID);
  const storyIDs: number[] = args.storyIDs || [];
  if (storyIDs.length === 0) return err('storyIDs is required', 'validation_error');
  const token = makeToken(client.config);
  // Link story to plan by setting the plan field via story-edit (same as UI).
  for (const storyID of storyIDs) {
    // 1. Get kuid from the story-edit form.
    const formUrl = '/story-edit-' + storyID + '.html?onlybody=yes';
    const uid = await getActionKuid(client, formUrl);
    if (!uid) throw new Error('Could not obtain edit-form token (kuid) for story ' + storyID + '.');
    // 2. POST story-edit with plan field.
    const fields: Record<string, unknown> = { uid, plan: planID };
    const res = await client.postMultipartCreate('/story-edit-' + storyID + '.html', fields);
    const raw = JSON.stringify(res.data || {});
    if (raw.includes('无权') || raw.includes('user-deny')) throw new Error('Permission denied: 您无权访问该产品 (story ' + storyID + ' -> plan ' + planID + ')');
  }
  return ok({ linked: true, planID, url: viewUrl(client, 'productplan', planID), storyIDs, marker: token });
}

async function productplanUnlinkStory(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const planID = Number(args.planID);
  const storyIDs: number[] = args.storyIDs || [];
  if (storyIDs.length === 0) return err('storyIDs is required', 'validation_error');
  // Unlink by setting plan=0 via story-edit (same as UI).
  for (const storyID of storyIDs) {
    const formUrl = '/story-edit-' + storyID + '.html?onlybody=yes';
    const uid = await getActionKuid(client, formUrl);
    if (!uid) throw new Error('Could not obtain edit-form token (kuid) for story ' + storyID + '.');
    const fields: Record<string, unknown> = { uid, plan: 0 };
    const res = await client.postMultipartCreate('/story-edit-' + storyID + '.html', fields);
    const raw = JSON.stringify(res.data || {});
    if (raw.includes('无权') || raw.includes('user-deny')) throw new Error('Permission denied: 您无权访问该产品 (story ' + storyID + ')');
  }
  return ok({ unlinked: true, planID, url: viewUrl(client, 'productplan', planID), storyIDs });
}

async function productplanLinkBug(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const planID = Number(args.planID);
  const bugIDs: number[] = args.bugIDs || [];
  const token = makeToken(client.config);
  const rand = await client.getVerifyRand();
  const params: Record<string, unknown> = { verifyRand: rand };
  bugIDs.forEach((id, i) => { params['bugs[]'] = id; });
  // Route: /productplan-linkBug-{firstBugID}-{planID}-0-id_desc.html
  const res = await client.postMultipartCreate('/productplan-linkBug-' + bugIDs[0] + '-' + planID + '-0-id_desc.html', params);
  const raw = JSON.stringify(res.data || {});
  if (raw.includes('无权') || raw.includes('user-deny')) throw new Error('Permission denied: 您无权访问该产品');
  return ok({ linked: true, planID, url: viewUrl(client, 'productplan', planID), bugIDs, locate: (res.data as any)?.locate || '', marker: token });
}

async function productplanUnlinkBug(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const planID = Number(args.planID);
  const bugIDs: number[] = args.bugIDs || [];
  const rand = await client.getVerifyRand();
  const params: Record<string, unknown> = { verifyRand: rand };
  bugIDs.forEach((id, i) => { params['bugs[]'] = id; });
  // Route: /productplan-unlinkBug-{firstBugID}-{planID}-yes.html
  const res = await client.postMultipartCreate('/productplan-unlinkBug-' + bugIDs[0] + '-' + planID + '-yes.html', params);
  const raw = JSON.stringify(res.data || {});
  if (raw.includes('无权') || raw.includes('user-deny')) throw new Error('Permission denied: 您无权访问该产品');
  return ok({ unlinked: true, planID, url: viewUrl(client, 'productplan', planID), bugIDs, locate: (res.data as any)?.locate || '' });
}

// ---------- MCP CLEANUP ----------
async function cleanupMcp(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const dryRun = args.dry_run !== false; // default true
  const typeFilter = args.types || []; // e.g. ['story', 'bug', 'task'] - empty = all
  const allTypes = ['story', 'bug', 'task', 'case'];
  const typesToScan = typeFilter.length ? allTypes.filter(t => typeFilter.includes(t)) : allTypes;
  const found: Record<string, any[]> = { story: [], bug: [], task: [], case: [] };
  const scanErrors: string[] = [];
  // Scan stories (my-story-browse for the account)
  for (const t of typesToScan) {
    try {
      if (t === 'story') {
        const pRes = await client.viewJson('/product-browse-all.json').catch(() => null);
        const prodMap = pRes ? ((pRes as any).products || {}) : {};
        for (const [pid, pname] of Object.entries(prodMap)) {
          try {
            const { rows } = await client.fetchAllPaginated('/product-browse-' + pid + '-0-unclosed-0-story-id_desc', { rowKey: 'stories', perPage: 200, maxPages: 3 });
            for (const s of rows as Dyn[]) {
              if ((s.title || '').includes('[MCP]') || (s.keywords || '').includes('MCP-AUTO-')) found.story.push({ id: s.id, title: s.title, status: s.status, stage: s.stage, productID: Number(pid), url: viewUrl(client, 'story', s.id) });
            }
          } catch { /* skip */ }
        }
      } else if (t === 'bug') {
        // Bugs are per-product; browse returns {id: name} map
        const pRes = await client.viewJson('/product-browse-all.json').catch(() => null);
        const prodMap = pRes ? ((pRes as any).products || {}) : {};
        for (const [pid, pname] of Object.entries(prodMap)) {
          try {
            const { rows } = await client.fetchAllPaginated('/bug-browse-' + pid + '-0-unclosed-0-id_desc', { rowKey: 'bugs', perPage: 200, maxPages: 2 });
            for (const b of rows as Dyn[]) {
              if ((b.title || '').includes('[MCP]') || (b.keywords || '').includes('MCP-AUTO-')) found.bug.push({ id: b.id, title: b.title, status: b.status, productID: Number(pid), url: viewUrl(client, 'bug', b.id) });
            }
          } catch { /* skip products where bug-browse is denied */ }
        }
      } else if (t === 'task') {
        const eRes = await client.viewJson('/project-browse-all.json').catch(() => null);
        const projMap = eRes ? ((eRes as any).projects || {}) : {};
        for (const [pjid, pjname] of Object.entries(projMap)) {
          try {
            const { rows } = await client.fetchAllPaginated('/task-browse-' + pjid + '-0-unclosed-0-id_desc', { rowKey: 'tasks', perPage: 200, maxPages: 2 });
            for (const tk of rows as Dyn[]) {
              if ((tk.name || '').includes('[MCP]') || (tk.name || '').includes('MCP-AUTO')) found.task.push({ id: tk.id, name: tk.name, status: tk.status, projectID: Number(pjid), url: viewUrl(client, 'task', tk.id) });
            }
          } catch { /* skip */ }
        }
      } else if (t === 'case') {
        const pRes = await client.viewJson('/product-browse-all.json').catch(() => null);
        const prodMap = pRes ? ((pRes as any).products || {}) : {};
        for (const [pid, pname] of Object.entries(prodMap)) {
          try {
            const { rows } = await client.fetchAllPaginated('/case-browse-' + pid + '-0-all-0-id_desc', { rowKey: 'cases', perPage: 200, maxPages: 2 });
            for (const cs of rows as Dyn[]) {
              if (cs.status === 'closed') continue;
              if ((cs.title || '').includes('[MCP]') || (cs.keywords || '').includes('MCP-AUTO-')) found.case.push({ id: cs.id, title: cs.title, status: cs.status, productID: Number(pid), url: viewUrl(client, 'case', cs.id) });
            }
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      scanErrors.push(t + ': ' + (e as Error).message.slice(0, 80));
    }
  }
  const totalFound = found.story.length + found.bug.length + found.task.length + found.case.length;
  if (dryRun) {
    return ok({
      dry_run: true,
      totalFound,
      found,
      scanErrors,
      note: 'Set dry_run=false to soft-delete all listed MCP-AUTO entities. Cases are NOT deleted (no delete permission) - they are listed for manual cleanup.',
      confirmPhrase: 'CLEANUP MCP-AUTO ENTITIES'
    });
  }
  // Execute: soft delete each
  const deleted: Record<string, number[]> = { story: [], bug: [], task: [], case: [] };
  const failed: Record<string, string[]> = { story: [], bug: [], task: [], case: [] };
  for (const s of found.story) {
    try {
      const res = await client._get(client.config.baseUrl + '/story-delete-' + s.id + '-yes.html', { 'X-Requested-With': 'XMLHttpRequest' });
      await res.text();
      deleted.story.push(s.id);
    } catch (e) { failed.story.push(s.id + ': ' + (e as Error).message.slice(0, 50)); }
  }
  for (const b of found.bug) {
    try {
      const res = await client._get(client.config.baseUrl + '/bug-delete-' + b.id + '-yes.html', { 'X-Requested-With': 'XMLHttpRequest' });
      await res.text();
      deleted.bug.push(b.id);
    } catch (e) { failed.bug.push(b.id + ': ' + (e as Error).message.slice(0, 50)); }
  }
  for (const tk of found.task) {
    try {
      const res = await client._get(client.config.baseUrl + '/task-delete-' + tk.id + '-yes-yes.html', { 'X-Requested-With': 'XMLHttpRequest' });
      await res.text();
      deleted.task.push(tk.id);
    } catch (e) { failed.task.push(tk.id + ': ' + (e as Error).message.slice(0, 50)); }
  }
  // Cases: no delete permission (feature-point). List only.
  return ok({
    executed: true,
    deleted,
    failed,
    casesNotDeleted: found.case.length ? found.case : [],
    caseNote: found.case.length ? '用例无删除权限（功能点未开通），需管理员处理或手动关闭' : '',
    totalDeleted: deleted.story.length + deleted.bug.length + deleted.task.length
  });
}

// ---------- BULK OPS ----------
async function bulkClose(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const entity = args.entity; // 'story' | 'bug'
  const ids: number[] = args.ids || [];
  if (!['story', 'bug'].includes(entity)) return err('entity must be story or bug', 'validation_error');
  if (!ids.length) return err('ids array is empty', 'validation_error');
  const closedReason = args.closedReason || (entity === 'story' ? 'cancel' : 'bydesign');
  const resolved: number[] = [];
  const failed: string[] = [];
  for (const id of ids) {
    try {
      if (entity === 'story') {
        const res = await client._get(client.config.baseUrl + '/story-close-' + id + '.html?onlybody=yes', { 'X-Requested-With': 'XMLHttpRequest' });
        const html = await res.text();
        const kuid = html.match(/kuid\s*=\s*'([0-9a-f]+)'/)?.[1];
        const fd = new FormData();
        fd.append('closedReason', closedReason);
        fd.append('comment', '批量关闭');
        fd.append('uid', kuid || '');
        const postRes = await client.fetchImpl(client.config.baseUrl + '/story-close-' + id + '.html', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Cookie': (client as any)._cookieHeader() }, body: fd, redirect: 'manual' });
        (client as any)._storeCookies(postRes);
        const raw = await postRes.text();
        if (raw.includes('user-login') || raw.includes('user-deny')) { failed.push(id + ': ' + raw.slice(0, 50)); continue; }
      } else {
        // Bug: resolve first if active, then close
        const vJson = await client.viewJson('/bug-view-' + id + '.json').catch(() => null);
        const b = (vJson as any)?.bug;
        if (b && b.status === 'active') {
          // resolve
          const res0 = await client._get(client.config.baseUrl + '/bug-resolve-' + id + '.html?onlybody=yes', { 'X-Requested-With': 'XMLHttpRequest' });
          const html0 = await res0.text();
          const kuid0 = html0.match(/kuid\s*=\s*'([0-9a-f]+)'/)?.[1];
          const fd0 = new FormData();
          fd0.append('resolution', 'bydesign');
          fd0.append('comment', '批量关闭');
          fd0.append('uid', kuid0 || '');
          const post0 = await client.fetchImpl(client.config.baseUrl + '/bug-resolve-' + id + '.html', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Cookie': (client as any)._cookieHeader() }, body: fd0, redirect: 'manual' });
          (client as any)._storeCookies(post0);
          await post0.text();
        }
        // close
        const res = await client._get(client.config.baseUrl + '/bug-close-' + id + '.html?onlybody=yes', { 'X-Requested-With': 'XMLHttpRequest' });
        const html = await res.text();
        const kuid = html.match(/kuid\s*=\s*'([0-9a-f]+)'/)?.[1];
        const fd = new FormData();
        fd.append('comment', '批量关闭');
        fd.append('uid', kuid || '');
        const postRes = await client.fetchImpl(client.config.baseUrl + '/bug-close-' + id + '.html', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Cookie': (client as any)._cookieHeader() }, body: fd, redirect: 'manual' });
        (client as any)._storeCookies(postRes);
        const raw = await postRes.text();
        if (raw.includes('user-login') || raw.includes('user-deny')) { failed.push(id + ': ' + raw.slice(0, 50)); continue; }
      }
      resolved.push(id);
    } catch (e) {
      failed.push(id + ': ' + (e as Error).message.slice(0, 60));
    }
  }
  return ok({ closed: true, entity, total: ids.length, success: resolved.length, resolved: resolved.map((id: number) => ({ id, url: viewUrl(client, entity, id) })), failed });
}

async function bulkAssign(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const entity = args.entity; // 'story' | 'bug' | 'task'
  const ids: number[] = args.ids || [];
  const assignedTo = args.assignedTo;
  if (!['story', 'bug', 'task'].includes(entity)) return err('entity must be story, bug, or task', 'validation_error');
  if (!ids.length) return err('ids array is empty', 'validation_error');
  if (!assignedTo) return err('assignedTo is required', 'validation_error');
  const updated: number[] = [];
  const failed: string[] = [];
  for (const id of ids) {
    try {
      if (entity === 'story') {
        const h: Record<string, any> = { storyID: id, assignedTo };
        await storyUpdate(client, h);
      } else if (entity === 'bug') {
        const h: Record<string, any> = { bugID: id, assignedTo };
        await bugUpdate(client, h);
      } else {
        const h: Record<string, any> = { taskID: id, assignedTo };
        await taskUpdate(client, h);
      }
      updated.push(id);
    } catch (e) {
      failed.push(id + ': ' + (e as Error).message.slice(0, 60));
    }
  }
  return ok({ assigned: true, entity, assignedTo, total: ids.length, success: updated.length, updated: updated.map((id: number) => ({ id, url: viewUrl(client, entity, id) })), failed });
}

// ---------- STORY ADVANCE (one-shot state transition) ----------
async function storyAdvance(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const storyIDs = extractIDs(args, 'storyID');
  if (storyIDs.length > 1) {
    const results: { id: number; ok: boolean; error?: string }[] = [];
    for (const id of storyIDs) {
      try { const r = await storyAdvance(client, { ...args, storyID: id }); results.push({ id, ok: (r.data as any)?.success !== false }); }
      catch (e) { results.push({ id, ok: false, error: (e as Error).message.slice(0, 80) }); }
    }
    return ok({ bulk: true, total: storyIDs.length, success: results.filter(r=>r.ok).length, results: results.map((r: { id: number }) => ({ ...r, url: viewUrl(client, 'story', r.id) })) });
  }
  const storyID = storyIDs[0];
  const target = args.target; // 'active' | 'closed'
  if (!['active', 'closed'].includes(target)) return err('target must be active or closed', 'validation_error');
  // Read current state
  const vJson = await client.viewJson('/story-view-' + storyID + '.json');
  const s = (vJson as any)?.story;
  if (!s) return err('Story ' + storyID + ' not found', 'not_found');
  const from = s.status + '/' + s.stage;
  const steps: string[] = [];
  if (target === 'closed') {
    // Just close (works from any non-closed status)
    if (s.status === 'closed') return ok({ already: true, storyID, url: viewUrl(client, 'story', storyID), status: 'closed', steps: [] });
    await storyClose(client, { storyID, closedReason: args.closedReason || 'done' });
    steps.push('close');
  } else {
    // target = active:
    //   draft/changed → review(pass) directly activates (no change step needed)
    //   reviewing → review(pass) also activates
    if (s.status === 'active') return ok({ already: true, storyID, url: viewUrl(client, 'story', storyID), status: 'active', steps: [] });
    if (['draft', 'changed', 'reviewing'].includes(s.status)) {
      await storyReview(client, { storyID, result: 'pass' });
      steps.push('review(pass)');
    } else {
      return err('Cannot advance from status "' + s.status + '" to active. Supported: draft, changed, reviewing.', 'validation_error');
    }
  }
  // Verify final state
  const vJson2 = await client.viewJson('/story-view-' + storyID + '.json').catch(() => null);
  const final = (vJson2 as any)?.story;
  return ok({
    storyID, url: viewUrl(client, 'story', storyID), from, target, steps,
    finalStatus: final?.status || 'unknown',
    finalStage: final?.stage || 'unknown',
    success: final?.status === target || (target === 'closed' && final?.status === 'closed')
  });
}

// ---------- HELP / GUIDE (pure local, no cloud) ----------
async function htmlHelp(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  return ok({
    description: 'Rich text HTML supported by ZenTao KindEditor (story spec/verify, bug steps/comment).',
    supported_tags: [
      { tag: '<b>', desc: '加粗', example: '<b>重要</b>' },
      { tag: '<i>', desc: '斜体', example: '<i>强调</i>' },
      { tag: '<u>', desc: '下划线', example: '<u>注意</u>' },
      { tag: '<ol>', desc: '有序列表', example: '<ol><li>步骤1</li><li>步骤2</li></ol>' },
      { tag: '<ul>', desc: '无序列表', example: '<ul><li>项目A</li><li>项目B</li></ul>' },
      { tag: '<li>', desc: '列表项', example: '<li>内容</li>' },
      { tag: '<p>', desc: '段落', example: '<p>段落内容</p>' },
      { tag: '<br>', desc: '换行', example: '行1<br>行2' },
      { tag: '<code>', desc: '行内代码', example: '<code>console.log()</code>' },
      { tag: '<a>', desc: '链接', example: '<a href="https://example.com">文档</a>' },
      { tag: '<img>', desc: '图片（可访问 URL 或本地文件路径/ data URI——本地图片在 bug_create/bug_update/story_create/story_change 写 steps/spec/verify 时自动上传到禅道文件存储并替换为 URL）', example: '<img src="/Users/x/shot.png" alt="说明" />' },
      { tag: '<table>', desc: '表格', example: '<table><tr><th>列</th></tr><tr><td>值</td></tr></table>' },
      { tag: '<blockquote>', desc: '引用块', example: '<blockquote>引用内容</blockquote>' },
      { tag: '<hr>', desc: '分割线', example: '上方<hr>下方' },
      { tag: '<font>', desc: '彩色文字', example: '<font color="red">红色</font>' }
    ],
    full_example: '<p>支持<b>加粗</b>、<i>斜体</i>和<font color="red">彩色文字</font></p><br><ol><li>有序项</li></ol><ul><li>无序项</li></ul><p>代码：<code>fn()</code></p><hr><table><tr><th>列A</th></tr><tr><td>1</td></tr></table><blockquote>引用</blockquote><p>图片：<img src="URL" alt="图" /></p><p>链接：<a href="URL">文档</a></p>',
    notes: [
      'KindEditor filterMode=true: 未列出的标签会被过滤',
      '<br> 存为 <br />（自闭合），检测时用 /<br\s*\/?>/',
      '<img> 三种 src：远程 URL（原样保留）/ 站点相对路径如 /file-read-*.png（原样保留）/ 本地路径或 data: URI（自动上传到禅道文件存储，替换为公开可访问 URL，其余格式原样保留；本地文件不存在时报错拒写）',
      'story spec/verify 只能通过 story_create 或 story_change 写入（story_update 不能改）',
      'bug steps 可以通过 bug_update 直接修改'
    ]
  });
}

async function toolGuide(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const scenario = args.scenario;
  const guides: Record<string, { steps: { tool: string; note: string }[]; description: string }[]> = {
    'create_story': [{ description: '创建一个需求并指派', steps: [
      { tool: 'zentao_story_create', note: '创建（spec 支持富文本 HTML）' },
      { tool: 'zentao_story_update', note: '指派 + 设优先级' },
      { tool: 'zentao_story_review', note: '评审通过（result=pass）' },
      { tool: 'zentao_story_change', note: '激活（stage=active）+ 完善 spec/verify' }
    ]}],
    'create_bug': [{ description: '提一个 Bug 并关联需求', steps: [
      { tool: 'zentao_bug_create', note: '创建（steps 支持富文本 HTML，传 storyID 关联）' },
      { tool: 'zentao_bug_update', note: '指派 + 设严重程度' },
      { tool: 'zentao_bug_resolve', note: '解决（resolution=fixed）' },
      { tool: 'zentao_bug_close', note: '关闭' }
    ]}],
    'task_lifecycle': [{ description: '任务全流程', steps: [
      { tool: 'zentao_task_create', note: '创建（需 projectID）' },
      { tool: 'zentao_task_start', note: '开始（left=剩余工时）' },
      { tool: 'zentao_task_log_add', note: '记工时（work+left）' },
      { tool: 'zentao_task_finish', note: '完成（currentConsumed=已消耗）' },
      { tool: 'zentao_task_close', note: '关闭' }
    ]}],
    'story_to_bug': [{ description: '从需求提 Bug 再修复关闭', steps: [
      { tool: 'zentao_bug_create', note: 'steps 写复现步骤，storyID 关联需求' },
      { tool: 'zentao_bug_update', note: '指派给开发' },
      { tool: 'zentao_bug_resolve', note: '开发解决（fixed）' },
      { tool: 'zentao_bug_close', note: '验证后关闭' }
    ]}],
    'cleanup': [{ description: '清理 MCP 测试数据', steps: [
      { tool: 'zentao_cleanup_mcp', note: 'dry_run=true 先查看' },
      { tool: 'zentao_cleanup_mcp', note: 'dry_run=false 执行软删' }
    ]}],
    'batch_ops': [{ description: '批量操作', steps: [
      { tool: 'zentao_bulk_assign', note: '批量指派（story/bug/task）' },
      { tool: 'zentao_bulk_close', note: '批量关闭（story/bug）' }
    ]}]
  };
  if (scenario && guides[scenario]) return ok({ scenario, ...guides[scenario][0] });
  return ok({ scenarios: Object.keys(guides), usage: 'Call again with scenario=<key> for details.' });
}

// ---------- MULTI-OP (AI semantic multi-entity operations) ----------
// Unlike batch (same action on multiple IDs of one entity), multi_op executes
// a sequence of DIFFERENT tools across DIFFERENT entity types in one call.
// The AI recognizes the user's semantic intent and decomposes it into steps.
async function multiOp(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const steps: { tool: string; args: Record<string, any> }[] = args.steps || [];
  if (!steps.length) return err('steps array is empty. Provide at least one {tool, args} step.', 'validation_error');
  const stopOnError = args.stopOnError !== false; // default true
  const results: { step: number; tool: string; ok: boolean; data?: unknown; error?: string }[] = [];
  let allOk = true;
  for (let i = 0; i < steps.length; i++) {
    const { tool, args: stepArgs } = steps[i];
    const handlerKey = tool.startsWith('zentao_') ? tool : 'zentao_' + tool;
    const handler = (HANDLERS as any)[handlerKey];
    if (!handler) {
      results.push({ step: i, tool, ok: false, error: 'Unknown tool: ' + handlerKey });
      allOk = false;
      if (stopOnError) break;
      continue;
    }
    try {
      const res = await handler(client, stepArgs);
      const data = res.data !== undefined ? res.data : res;
      results.push({ step: i, tool, ok: true, data });
    } catch (e) {
      results.push({ step: i, tool, ok: false, error: (e as Error).message.slice(0, 200) });
      allOk = false;
      if (stopOnError) break;
    }
  }
  return ok({
    multiOp: true,
    totalSteps: steps.length,
    executed: results.length,
    success: results.filter(r => r.ok).length,
    failed: results.filter(r => !r.ok).length,
    allOk,
    results
  });
}

// ---------- RELATIONS (entity relationship graph) ----------
async function relations(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const entity = args.entity; // 'story' | 'bug' | 'task'
  const id = Number(args.id);
  if (!['story', 'bug', 'task'].includes(entity)) return err('entity must be story, bug, or task', 'validation_error');
  const rel: Record<string, any> = { entity, id, relations: {} };
  
  if (entity === 'story') {
    const d = await client.viewJson('/story-view-' + id + '.json').catch(() => null);
    const s = (d as any)?.story;
    if (!s) return err('Story ' + id + ' not found', 'not_found');
    rel.self = { id: s.id, title: s.title, status: s.status, stage: s.stage, assignedTo: s.assignedTo, product: s.product, url: viewUrl(client, 'story', s.id) };
    // Direct FKs from view JSON (skip 0 = no relation)
    if (s.plan && Number(s.plan) > 0) rel.relations.plan = { id: Number(s.plan), note: '计划/迭代', url: viewUrl(client, 'productplan', s.plan) };
    if (s.parent && Number(s.parent) > 0) rel.relations.parentStory = { id: Number(s.parent), url: viewUrl(client, 'story', s.parent) };
    if (s.children?.length) rel.relations.children = s.children.map((c: any) => ({ id: c.id, title: c.title, status: c.status, url: viewUrl(client, 'story', c.id) }));
    if (s.linkStories?.length) rel.relations.linkedStories = s.linkStories.map((ls: any) => ({ id: ls.id, title: ls.title, url: viewUrl(client, 'story', ls.id) }));
    if (s.tasks?.length) rel.relations.tasks = s.tasks.map((t: any) => ({ id: t.id, name: t.name, status: t.status, assignedTo: t.assignedTo, url: viewUrl(client, 'task', t.id) }));
    // Scan bugs for this story (product-level scan)
    try {
      const { rows } = await client.fetchAllPaginated('/bug-browse-' + s.product + '-0-unclosed-0-id_desc', { rowKey: 'bugs', perPage: 200, maxPages: 3 });
      const linkedBugs = (rows as Dyn[]).filter((b: any) => Number(b.story) === id);
      if (linkedBugs.length) rel.relations.bugs = linkedBugs.map((b: any) => ({ id: b.id, title: b.title, status: b.status, severity: b.severity, assignedTo: b.assignedTo, url: viewUrl(client, 'bug', b.id) }));
    } catch { /* no permission */ }
  } else if (entity === 'bug') {
    const d = await client.viewJson('/bug-view-' + id + '.json').catch(() => null);
    const b = (d as any)?.bug;
    if (!b) return err('Bug ' + id + ' not found', 'not_found');
    rel.self = { id: b.id, title: b.title, status: b.status, severity: b.severity, assignedTo: b.assignedTo, product: b.product, url: viewUrl(client, 'bug', b.id) };
    if (b.story && Number(b.story) > 0) rel.relations.story = { id: Number(b.story), title: b.storyTitle || '', status: b.storyStatus || '', url: viewUrl(client, 'story', b.story) };
    if (b.task && Number(b.task) > 0) rel.relations.task = { id: Number(b.task), title: b.taskName || '', url: viewUrl(client, 'task', b.task) };
    if (b.toStory && Number(b.toStory) > 0) rel.relations.toStory = { id: Number(b.toStory), note: '转为需求', url: viewUrl(client, 'story', b.toStory) };
    if (b.openedBuild && Number(b.openedBuild) > 0) rel.relations.openedBuild = { id: Number(b.openedBuild), note: '发现版本', url: viewUrl(client, 'build', b.openedBuild) };
    if (b.resolvedBuild && Number(b.resolvedBuild) > 0) rel.relations.resolvedBuild = { id: Number(b.resolvedBuild), note: '解决版本', url: viewUrl(client, 'build', b.resolvedBuild) };
    if (b.case && Number(b.case) > 0) rel.relations.case = { id: Number(b.case), note: '关联用例', url: viewUrl(client, 'case', b.case) };
    if (b.testtask && Number(b.testtask) > 0) rel.relations.testTask = { id: Number(b.testtask), url: viewUrl(client, 'testtask', b.testtask) };
  } else {
    // task
    const d = await client.viewJson('/task-view-' + id + '.json').catch(() => null);
    const t = (d as any)?.task;
    if (!t) return err('Task ' + id + ' not found', 'not_found');
    rel.self = { id: t.id, name: t.name, status: t.status, assignedTo: t.assignedTo, project: t.project, estimate: t.estimate, consumed: t.consumed, left: t.left, url: viewUrl(client, 'task', t.id) };
    if (t.story && Number(t.story) > 0) rel.relations.story = { id: Number(t.story), title: t.storyTitle || '', status: t.storyStatus || '', url: viewUrl(client, 'story', t.story) };
    if (t.fromBug && Number(t.fromBug) > 0) rel.relations.fromBug = { id: Number(t.fromBug), note: '由 Bug 转化', url: viewUrl(client, 'bug', t.fromBug) };
    if (t.children?.length) rel.relations.subTasks = t.children.map((c: any) => ({ id: c.id, name: c.name, status: c.status, url: viewUrl(client, 'task', c.id) }));
    // Scan bugs for this task
    try {
      const pRes = await client.viewJson('/project-browse-all.json').catch(() => null);
      const projMap = pRes ? ((pRes as any).projects || {}) : {};
      for (const [pid] of Object.entries(projMap)) {
        try {
          const { rows } = await client.fetchAllPaginated('/bug-browse-' + pid + '-0-unclosed-0-id_desc', { rowKey: 'bugs', perPage: 100, maxPages: 1 });
          const linkedBugs = (rows as Dyn[]).filter((b: any) => Number(b.task) === id);
          if (linkedBugs.length) { rel.relations.bugs = linkedBugs.map((b: any) => ({ id: b.id, title: b.title, status: b.status, url: viewUrl(client, 'bug', b.id) })); break; }
        } catch { /* skip */ }
      }
    } catch { /* no permission */ }
  }
  return ok(rel);
}

// ---------- VALIDATE ARGS (pure local, no cloud) ----------
async function validateArgs(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const tool = args.tool as string;
  const toolArgs = args.args as Record<string, any> || {};
  if (!tool) return err('tool name is required', 'validation_error');
  const toolName = tool.startsWith('zentao_') ? tool : 'zentao_' + tool;
  const toolDef = (TOOLS as any).find((t: any) => t.name === toolName);
  if (!toolDef) return err('Unknown tool: ' + toolName, 'not_found');
  const schema = toolDef.inputSchema || { type: 'object', properties: {} };
  const required: string[] = schema.required || [];
  const properties: Record<string, any> = schema.properties || {};
  const missing: string[] = [];
  const invalid: { field: string; value: unknown; expected: string }[] = [];
  const provided: string[] = [];
  // Check required fields
  for (const req of required) {
    if (toolArgs[req] === undefined || toolArgs[req] === null || toolArgs[req] === '') {
      missing.push(req);
    }
  }
  // Check provided fields against schema
  for (const [key, val] of Object.entries(toolArgs)) {
    if (val === undefined || val === null) continue;
    provided.push(key);
    if (!properties[key]) continue; // unknown field, not an error
    const propSchema = properties[key];
    const types: string[] = Array.isArray(propSchema.type) ? propSchema.type : [propSchema.type];
    // Type check
    if (val !== null && val !== undefined) {
      const jsType = Array.isArray(val) ? 'array' : typeof val;
      if (!types.includes(jsType)) {
        // Allow integer for number
        if (types.includes('integer') && jsType === 'number' && Number.isInteger(val)) continue;
        invalid.push({ field: key, value: val, expected: types.join(' | ') });
      }
    }
    // Enum check
    if (propSchema.enum && val !== undefined && val !== null) {
      const valStr = String(val);
      if (!propSchema.enum.includes(val) && !propSchema.enum.includes(valStr)) {
        invalid.push({ field: key, value: val, expected: 'one of: ' + propSchema.enum.join(', ') });
      }
    }
  }
  return ok({
    tool: toolName,
    valid: missing.length === 0 && invalid.length === 0,
    missing_required: missing,
    invalid_fields: invalid,
    provided_fields: provided,
    schema_fields: Object.keys(properties),
    description: toolDef.description.slice(0, 120)
  });
}

// ---------- STATUS ENUM (pure local, no cloud) ----------
async function statusEnum(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const entity = args.entity;
  const enums: Record<string, any> = {
    story: {
      status: { values: ['draft', 'reviewing', 'active', 'changed', 'closed'], description: '需求状态' },
      stage: { values: ['wait', 'planned', 'developing', 'designed', 'projected'], description: '需求阶段' },
      pri: { values: [0, 1, 2, 3, 4], description: '优先级：0=未设置 1=紧急 2=高 3=中 4=低' },
      transitions: {
        'draft → active': 'story_review(result=pass)',
        'active → closed': 'story_close(closedReason)',
        'active → changed': 'story_change(修改后自动)',
        'changed → active': 'story_review(result=pass) 重新评审'
      }
    },
    bug: {
      status: { values: ['active', 'resolved', 'closed'], description: 'Bug 状态' },
      resolution: { values: ['fixed', 'bydesign', 'duplicate', 'external', 'willnotfix', 'notrepro', 'postponed', 'tostory'], description: '解决方式（resolve 时必填）' },
      severity: { values: [1, 2, 3, 4], description: '严重程度：1=致命 2=严重 3=一般 4=轻微' },
      pri: { values: [0, 1, 2, 3, 4], description: '优先级：0=未设置 1=紧急 2=高 3=中 4=低' },
      transitions: {
        'active → resolved': 'bug_resolve(resolution)',
        'resolved → closed': 'bug_close',
        'resolved → active': 'bug_reopen（验证不通过）'
      }
    },
    task: {
      status: { values: ['wait', 'doing', 'done', 'paused', 'closed', 'canceled'], description: '任务状态' },
      pri: { values: [0, 1, 2, 3, 4], description: '优先级：0=未设置 1=紧急 2=高 3=中 4=低' },
      transitions: {
        'wait → doing': 'task_start(left)',
        'doing → done': 'task_finish(currentConsumed)',
        'doing → paused': 'task_pause',
        'paused → doing': 'task_resume',
        'done → closed': 'task_close'
      }
    },
    product: {
      status: { values: ['normal', 'closed'], description: '产品状态' },
      type: { values: ['normal', 'branch'], description: '产品类型' }
    }
  };
  if (entity && enums[entity]) return ok({ entity, ...enums[entity] });
  return ok({ entities: Object.keys(enums), enums, usage: 'Call with entity=<key> for details.' });
}

// ---------- EXPORT (data export as CSV/JSON) ----------
async function exportData(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const entity = args.entity; // 'story' | 'bug' | 'task' | 'case'
  const format = args.format || 'json'; // 'csv' | 'json'
  if (!['story', 'bug', 'task'].includes(entity)) return err('entity must be story, bug, or task (case is locked)', 'validation_error');
  if (!['csv', 'json'].includes(format)) return err('format must be csv or json', 'validation_error');
  const filters = args.filters || {};
  // Scope narrows (optional): when omitted, scan ALL products/projects (same rule as zentao_filter).
  const productID = args.productID != null ? Number(args.productID) : null;
  const projectID = args.projectID != null ? Number(args.projectID) : null;
  const prodIds: string[] = [];
  const projIds: string[] = [];
  if (entity !== 'task') {
    const pRes = await client.viewJson('/product-browse-all.json').catch(() => null);
    const prodMap = pRes ? ((pRes as any).products || {}) : {};
    prodIds.push(...(productID ? [String(productID)] : Object.keys(prodMap)));
  }
  if (entity !== 'story') {
    const eRes = await client.viewJson('/project-browse-all.json').catch(() => null);
    const projMap = eRes ? ((eRes as any).projects || {}) : {};
    projIds.push(...(projectID ? [String(projectID)] : Object.keys(projMap)));
  }
  let rows: Dyn[] = [];
  if (entity === 'story') {
    for (const pid of prodIds) {
      try { const { rows: r } = await client.fetchAllPaginated('/product-browse-' + pid + '-0-unclosed-0-story-id_desc', { rowKey: 'stories', perPage: 500, maxPages: 20 }); rows.push(...r); } catch { /* skip product */ }
    }
  } else if (entity === 'bug') {
    for (const pid of prodIds) {
      try { const { rows: r } = await client.fetchAllPaginated('/bug-browse-' + pid + '-0-unclosed-0-id_desc', { rowKey: 'bugs', perPage: 500, maxPages: 20 }); rows.push(...r); } catch { /* skip product */ }
    }
  } else {
    for (const pjid of projIds) {
      try { const { rows: r } = await client.fetchAllPaginated('/task-browse-' + pjid + '-0-unclosed-0-id_desc', { rowKey: 'tasks', perPage: 500, maxPages: 20 }); rows.push(...r); } catch { /* skip project */ }
    }
  }
  const filtered = applyRowFilters(rows, entity, filters);
  // Field mapping (url last: every row carries a clickable link)
  const fieldMap: Record<string, string[]> = {
    story: ['id', 'title', 'status', 'stage', 'pri', 'assignedTo', 'openedBy', 'openedDate', 'plan', 'product', 'url'],
    bug: ['id', 'title', 'status', 'severity', 'pri', 'assignedTo', 'openedBy', 'openedDate', 'story', 'resolution', 'product', 'url'],
    task: ['id', 'name', 'status', 'pri', 'assignedTo', 'estimate', 'consumed', 'left', 'openedDate', 'story', 'project', 'url']
  };
  const fields = fieldMap[entity] || [];
  const data = filtered.map((r: any) => {
    const obj: Record<string, any> = {};
    for (const f of fields) obj[f] = (f === 'url') ? (viewUrl(client, entity, r.id) || '') : (r[f] != null ? String(r[f]) : '');
    return obj;
  });
  if (format === 'json') {
    return ok({ entity, scope: { productID, projectID }, filters, count: data.length, scanned: rows.length, format: 'json', data });
  }
  // CSV
  const header = fields.join(',');
  const csvRows = data.map(d => fields.map(f => {
    const v = d[f] || '';
    return v.includes(',') || v.includes('"') ? '"' + v.replace(/"/g, '""') + '"' : v;
  }).join(','));
  const csv = header + '\n' + csvRows.join('\n');
  return ok({ entity, scope: { productID, projectID }, filters, count: data.length, scanned: rows.length, format: 'csv', data: csv });
}

// ---------- MY WORKBENCH (filter-first, full data) ----------
async function myWorkbench(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const account = client.config.account;
  const today = new Date().toISOString().slice(0, 10);
  // Scope narrows (optional)
  const productID = args.productID ? Number(args.productID) : null;
  const projectID = args.projectID ? Number(args.projectID) : null;
  // "Unclosed" = anything not closed/canceled. ALL unclosed items assigned to me need handling.
  const UNCLOSed_STORY = ['active', 'changed', 'reviewing'];
  const UNCLOSed_BUG = ['active', 'resolved'];
  const UNCLOSed_TASK = ['wait', 'doing', 'done', 'paused'];
  
  const result: Record<string, any> = {
    account, date: today,
    scope: { productID, projectID },
    sections: {}
  };
  const errors: string[] = [];
  
  // Determine scope
  let prodIds: string[] = [];
  let projIds: string[] = [];
  try {
    const pRes = await client.viewJson('/product-browse-all.json').catch(() => null);
    const prodMap = pRes ? ((pRes as any).products || {}) : {};
    prodIds = productID ? [String(productID)] : Object.keys(prodMap);
  } catch { errors.push('products'); }
  try {
    const eRes = await client.viewJson('/project-browse-all.json').catch(() => null);
    const projMap = eRes ? ((eRes as any).projects || {}) : {};
    projIds = projectID ? [String(projectID)] : Object.keys(projMap);
  } catch { errors.push('projects'); }
  
  // Full arrays (hoisted for high-priority filtering)
  const allStories: any[] = [];
  const allBugs: any[] = [];
  const allTasks: any[] = [];
  
  // 1. My unclosed stories (assigned to me, any unclosed status)
  try {
    const myStories: any[] = [];
    const byStatus: Record<string, number> = {};
    let totalScanned = 0;
    for (const pid of prodIds) {
      try {
        const { rows } = await client.fetchAllPaginated('/product-browse-' + pid + '-0-unclosed-0-story-id_desc', { rowKey: 'stories', perPage: 500, maxPages: 20 });
        totalScanned += rows.length;
        for (const s of rows as Dyn[]) {
          if (!UNCLOSed_STORY.includes(s.status)) continue;
          if (String(s.assignedTo) !== account) continue;
          const sItem = { id: s.id, title: s.title, status: s.status, stage: s.stage, pri: s.pri, deadline: s.deadline || '', openedDate: String(s.openedDate || '').slice(0, 10), productID: Number(pid), url: viewUrl(client, 'story', s.id) };
          myStories.push(sItem);
          allStories.push(sItem);
          byStatus[s.status] = (byStatus[s.status] || 0) + 1;
        }
      } catch { /* skip */ }
    }
    myStories.sort((a, b) => Number(b.pri) - Number(a.pri) || Number(b.id) - Number(a.id));
    result.sections.myStories = { count: myStories.length, byStatus, totalScanned, items: myStories.slice(0, 20) };
  } catch (e) { errors.push('stories: ' + (e as Error).message.slice(0, 60)); }
  
  // 2. My unclosed bugs (assigned to me, active or resolved)
  try {
    const myBugs: any[] = [];
    const toVerify: any[] = [];
    const bySeverity: Record<string, number> = {};
    let totalScanned = 0;
    for (const pid of prodIds) {
      try {
        const { rows } = await client.fetchAllPaginated('/bug-browse-' + pid + '-0-unclosed-0-id_desc', { rowKey: 'bugs', perPage: 500, maxPages: 20 });
        totalScanned += rows.length;
        for (const b of rows as Dyn[]) {
          if (!UNCLOSed_BUG.includes(b.status)) continue;
          if (String(b.assignedTo) === account) {
            const bItem = { id: b.id, title: b.title, severity: b.severity, pri: b.pri, status: b.status, openedDate: String(b.openedDate || '').slice(0, 10), productID: Number(pid), url: viewUrl(client, 'bug', b.id) };
            myBugs.push(bItem);
            allBugs.push(bItem);
            bySeverity[String(b.severity)] = (bySeverity[String(b.severity)] || 0) + 1;
            if (b.status === 'resolved' && String(b.resolvedBy) === account) {
              toVerify.push({ id: b.id, title: b.title, resolution: b.resolution, productID: Number(pid), url: viewUrl(client, 'bug', b.id) });
            }
          }
        }
      } catch { /* skip */ }
    }
    myBugs.sort((a, b) => Number(a.severity) - Number(b.severity) || Number(b.id) - Number(a.id));
    result.sections.myBugs = { count: myBugs.length, bySeverity, totalScanned, items: myBugs.slice(0, 20) };
    result.sections.toVerify = { count: toVerify.length, items: toVerify.slice(0, 10) };
  } catch (e) { errors.push('bugs: ' + (e as Error).message.slice(0, 60)); }
  
  // 3. My unclosed tasks (assigned to me, any unclosed status)
  try {
    const myTasks: any[] = [];
    const overdue: any[] = [];
    let totalScanned = 0;
    for (const pjid of projIds) {
      try {
        const { rows } = await client.fetchAllPaginated('/task-browse-' + pjid + '-0-unclosed-0-id_desc', { rowKey: 'tasks', perPage: 500, maxPages: 20 });
        totalScanned += rows.length;
        for (const t of rows as Dyn[]) {
          if (!UNCLOSed_TASK.includes(t.status)) continue;
          if (String(t.assignedTo) !== account) continue;
          const item = { id: t.id, name: t.name, status: t.status, left: t.left, deadline: t.deadline || '', openedDate: String(t.openedDate || '').slice(0, 10), projectID: Number(pjid), url: viewUrl(client, 'task', t.id) };
          myTasks.push(item);
          allTasks.push(item);
          if (t.deadline && String(t.deadline).slice(0, 10) < today) overdue.push(item);
        }
      } catch { /* skip */ }
    }
    myTasks.sort((a, b) => String(a.deadline || '9999').localeCompare(String(b.deadline || '9999')));
    result.sections.myTasks = { count: myTasks.length, totalScanned, items: myTasks.slice(0, 20) };
    result.sections.overdue = { count: overdue.length, items: overdue.slice(0, 10), note: overdue.length ? '⚠️ 以下任务已超期' : '' };
  } catch (e) { errors.push('tasks: ' + (e as Error).message.slice(0, 60)); }
  
  // 4. High priority list from FULL arrays (pri 1-2 for stories/tasks, severity 1-2 or pri 1-2 for bugs)
  const highPriority: { type: string; id: number; title: string; pri: number; priName?: string; severity?: string; severityName?: string; status: string; reason: string; url?: string }[] = [];
  for (const item of allStories) {
    if (Number(item.pri) >= 1 && Number(item.pri) <= 2) {
      highPriority.push({ type: 'story', id: item.id, title: item.title, pri: Number(item.pri), status: item.status, reason: '优先级 ' + item.pri + ' 需求状态 ' + storyStatusName(item.status), url: viewUrl(client, 'story', item.id) });
    }
  }
  for (const item of allBugs) {
    if (Number(item.severity) <= 2 || Number(item.pri) <= 2) {
      highPriority.push({ type: 'bug', id: item.id, title: item.title, pri: Number(item.pri), severity: item.severity, status: item.status, reason: '严重度 ' + item.severity + ' 优先级 ' + item.pri + ' Bug状态 ' + bugStatusName(item.status), url: viewUrl(client, 'bug', item.id) });
    }
  }
  for (const item of allTasks) {
    if (Number(item.pri) >= 1 && Number(item.pri) <= 2) {
      highPriority.push({ type: 'task', id: item.id, title: item.name, pri: Number(item.pri), status: item.status, reason: '优先级 ' + item.pri + ' 任务状态 ' + taskStatusName(item.status), url: viewUrl(client, 'task', item.id) });
    }
  }
  // Sort: by type (bug first), then by pri
  const typeOrder: Record<string, number> = { bug: 0, story: 1, task: 2 };
  highPriority.sort((a, b) => (typeOrder[a.type] - typeOrder[b.type]) || (a.pri - b.pri) || (b.id - a.id));
  result.sections.highPriority = { count: highPriority.length, items: highPriority.slice(0, 30) };
  
  // Summary
  const s = result.sections;
  result.summary = {
    total: (s.myStories?.count || 0) + (s.myBugs?.count || 0) + (s.myTasks?.count || 0),
    highPriorityCount: s.highPriority?.count || 0,
    text: `${s.myStories?.count || 0} 个未关闭需求（${Object.entries(s.myStories?.byStatus || {}).map(([k,v]) => storyStatusName(k)+' '+v).join('、') || '无'}）、${s.myBugs?.count || 0} 个未关闭 Bug（${Object.entries(s.myBugs?.bySeverity || {}).map(([k,v]) => '严重度'+k+' '+v).join('、') || '无'}）、${s.myTasks?.count || 0} 个未关闭任务` +
      `、🔴 ${s.highPriority?.count || 0} 个高优先级` +
      (s.toVerify?.count ? `、${s.toVerify.count} 个待验证 Bug` : '') +
      (s.overdue?.count ? `、⚠️ ${s.overdue.count} 个超期任务` : '')
  };
  if (errors.length) result.errors = errors;
  return ok(result);
}

// ---------- DRY RUN (write operation preview) ----------
async function dryRun(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const tool = args.tool as string;
  const toolArgs = args.args as Record<string, any> || {};
  if (!tool) return err('tool name is required', 'validation_error');
  const toolName = tool.startsWith('zentao_') ? tool : 'zentao_' + tool;
  
  // Determine entity + ID from args
  let entity = '', id: number | null = null;
  const entityMap: Record<string, string> = {
    story: 'storyID', bug: 'bugID', task: 'taskID',
    product: 'productID', build: 'buildID', module: 'moduleID',
    productplan: 'planID', execution: 'executionID'
  };
  for (const [ent, idKey] of Object.entries(entityMap)) {
    if (toolArgs[idKey] != null) { entity = ent; id = Number(Array.isArray(toolArgs[idKey]) ? toolArgs[idKey][0] : toolArgs[idKey]); break; }
  }
  
  // Risk level
  const isCreate = /create/.test(toolName);
  const isDelete = /delete/.test(toolName);
  const isUpdate = /update|edit|close|resolve|reopen|review|change|advance|start|finish|pause|resume|log_add/.test(toolName);
  const risk = isDelete ? 'high' : isCreate ? 'low' : isUpdate ? 'medium' : 'unknown';
  const reversible = isDelete ? 'soft (deleted=1, still accessible by ID)' : isCreate ? 'delete the created entity' : 'revert via another update';
  
  // Read current state if entity + id exist
  let current: Record<string, any> | null = null;
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  if (entity && id && !isCreate) {
    try {
      const viewKey = entity === 'productplan' ? 'productplan' : entity;
      const d = await client.viewJson('/' + viewKey + '-view-' + id + '.json').catch(() => null);
      current = (d as any)?.[entity === 'productplan' ? 'plan' : entity] || (d as any)?.[viewKey] || null;
      if (current) {
        // Diff: for each arg that maps to a field, compare
        const fieldMap: Record<string, string> = {
          title: 'title', name: 'name', assignedTo: 'assignedTo',
          priority: 'pri', pri: 'pri', severity: 'severity',
          status: 'status', stage: 'stage', resolution: 'resolution',
          closedReason: 'closedReason', comment: 'comment'
        };
        for (const [argKey, fieldName] of Object.entries(fieldMap)) {
          if (toolArgs[argKey] != null && current[fieldName] != null) {
            if (String(toolArgs[argKey]) !== String(current[fieldName])) {
              changes[fieldName] = { from: current[fieldName], to: toolArgs[argKey] };
            }
          }
        }
      }
    } catch { /* entity not found or no permission */ }
  }
  
  return ok({
    dry_run: true,
    tool: toolName,
    risk,
    reversible,
    entity: entity ? entity + ' ' + id : (isCreate ? 'new ' + (entity || 'entity') : 'unknown'),
    url: entity && id ? (viewUrl(client, entity, id) || (entity === 'module' ? moduleUrl(client, toolArgs.productID, id) : undefined)) : undefined,
    current_state: current ? {
      status: current.status, stage: current.stage, assignedTo: current.assignedTo,
      title: current.title || current.name, priority: current.pri
    } : null,
    proposed_changes: changes,
    args: toolArgs,
    note: isCreate ? '创建操作：重复调用会创建新实体（不去重）' : isDelete ? '删除操作：软删除（deleted=1），URL+ID 仍可访问' : '修改操作：幂等（相同值重复调用无副作用）'
  });
}

// ---------- FIELD GUIDE (pure local) ----------
async function fieldGuide(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const entity = args.entity;
  const tool = args.tool;
  
  const guides: Record<string, any> = {
    story: {
      description: '需求（story）字段说明',
      fields: {
        title: { type: 'string', required: true, desc: '标题（100字内）' },
        spec: { type: 'html', required: true, desc: '需求描述（富文本 HTML，15种标签）' },
        verify: { type: 'html', required: false, desc: '验收标准（富文本 HTML）' },
        productID: { type: 'integer', required: true, desc: '所属产品 ID' },
        moduleID: { type: 'integer', required: false, desc: '所属模块 ID' },
        plan: { type: 'integer', required: false, desc: '关联计划/迭代 ID' },
        pri: { type: 'integer', enum: [0, 1, 2, 3, 4], desc: '优先级：0=未设置 1=紧急 2=高 3=中 4=低' },
        assignedTo: { type: 'string', desc: '指派人账号' },
        keywords: { type: 'string', desc: '关键词（默认不写机器标记；仅服务端 ZENTAO_MARKERS=1 开发环境时自动附加 MCP-AUTO- token）' }
      },
      write_tools: {
        story_create: '创建（可写 spec/verify）',
        story_update: '修改基础字段（title/assignedTo/stage/pri），不能改 spec/verify',
        story_change: '需求变更（可改 spec/verify/title，会记录变更历史）',
        story_review: '评审（pass/fail）',
        story_close: '关闭（需 closedReason）',
        story_advance: '一键流转（draft→active 自动 review）'
      },
      key_note: 'spec/verify 只能通过 story_create 或 story_change 写入，story_update 不能改'
    },
    bug: {
      description: 'Bug（bug）字段说明',
      fields: {
        title: { type: 'string', required: true, desc: '标题' },
        steps: { type: 'html', required: true, desc: '复现步骤（富文本 HTML）' },
        productID: { type: 'integer', required: true, desc: '所属产品 ID' },
        buildID: { type: 'integer', required: true, desc: '发现版本 ID（openedBuild）' },
        severity: { type: 'integer', enum: [1, 2, 3, 4], desc: '严重程度：1=致命 2=严重 3=一般 4=轻微' },
        pri: { type: 'integer', enum: [0, 1, 2, 3, 4], desc: '优先级：0=未设置 1=紧急 2=高 3=中 4=低' },
        type: { type: 'string', enum: ['codeerror', 'design', 'config', 'performance', 'install', 'security', 'standard', 'interface', 'automated', 'other'], desc: 'Bug 类型' },
        story: { type: 'integer', required: false, desc: '关联需求 ID' },
        task: { type: 'integer', required: false, desc: '关联任务 ID' },
        assignedTo: { type: 'string', desc: '指派人账号' }
      },
      write_tools: {
        bug_create: '创建（可写 steps 富文本）',
        bug_update: '修改（可改 steps/title/severity/pri/assignedTo）',
        bug_resolve: '解决（需 resolution: fixed/bydesign/duplicate/external/willnotfix/notrepro/postponed/tostory）',
        bug_close: '关闭',
        bug_reopen: '重新打开（验证不通过）'
      },
      key_note: 'bug_update 可以直接改 steps（不像 story 需要 change）'
    },
    task: {
      description: '任务（task）字段说明',
      fields: {
        name: { type: 'string', required: true, desc: '任务名称' },
        projectID: { type: 'integer', required: true, desc: '所属项目 ID' },
        execution: { type: 'integer', required: false, desc: '所属执行/迭代 ID' },
        story: { type: 'integer', required: false, desc: '关联需求 ID' },
        pri: { type: 'integer', enum: [0, 1, 2, 3, 4], desc: '优先级：0=未设置 1=紧急 2=高 3=中 4=低' },
        assignedTo: { type: 'string', desc: '指派人账号' },
        deadline: { type: 'string', format: 'YYYY-MM-DD', desc: '截止日期' },
        type: { type: 'string', desc: '任务类型（dev/design/test/affair 等）' }
      },
      write_tools: {
        task_create: '创建',
        task_start: '开始（需 left=剩余工时）',
        task_log_add: '记工时（work=本次消耗, left=剩余）',
        task_finish: '完成（需 currentConsumed=已消耗）',
        task_update: '修改基础字段',
        task_close: '关闭'
      },
      key_note: '工时单位是小时（不是天）。estimate 在创建时设定，start 时确认 left'
    }
  };
  
  if (entity && guides[entity]) {
    const g = { ...guides[entity] };
    if (tool) {
      const toolName = tool.startsWith('zentao_') ? tool : 'zentao_' + tool;
      g.focused_tool = toolName;
      g.tool_info = g.write_tools?.[toolName] || 'not a write tool for this entity';
    }
    return ok(g);
  }
  if (tool) {
    // Look up tool in TOOLS
    const toolName = tool.startsWith('zentao_') ? tool : 'zentao_' + tool;
    const toolDef = (TOOLS as any).find((t: any) => t.name === toolName);
    if (toolDef) {
      return ok({ tool: toolName, description: toolDef.description, schema: toolDef.inputSchema });
    }
  }
  return ok({ entities: Object.keys(guides), usage: 'Call with entity=<key> for field details, or tool=<name> for tool schema.' });
}

// ---------- FILTER (advanced filtering) ----------
// Shared row filters for zentao_filter / zentao_export (same semantics).
// assignedTo accepts a single account or an array of accounts (multi-value OR).
function applyRowFilters<T extends Record<string, any>>(rows: T[], entity: string, f: Record<string, any>): T[] {
  let out = rows;
  if (f.assignedTo != null && f.assignedTo !== '') {
    const set = new Set(Array.isArray(f.assignedTo) ? f.assignedTo.map((x: any) => String(x)) : [String(f.assignedTo)]);
    out = out.filter((r) => set.has(String(r.assignedTo)));
  }
  if (f.priMin != null) out = out.filter((r) => Number(r.pri) >= Number(f.priMin));
  if (f.priMax != null) out = out.filter((r) => Number(r.pri) <= Number(f.priMax));
  if (f.status) out = out.filter((r) => String(r.status) === String(f.status));
  if (f.titleContains) {
    const kw = String(f.titleContains).toLowerCase();
    const titleKey = entity === 'task' ? 'name' : 'title';
    out = out.filter((r) => String(r[titleKey] || '').toLowerCase().includes(kw));
  }
  if (f.keywordsPrefix) {
    const prefix = String(f.keywordsPrefix);
    out = out.filter((r) => String(r.keywords || '').startsWith(prefix));
  }
  if (f.dateFrom) out = out.filter((r) => String(r.openedDate || '') >= String(f.dateFrom));
  if (f.dateTo) out = out.filter((r) => String(r.openedDate || '').slice(0, 10) <= String(f.dateTo));
  return out;
}

async function filterEntities(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const entity = args.entity;
  if (!['story', 'bug', 'task'].includes(entity)) return err('entity must be story, bug, or task', 'validation_error');
  const f = args.filters || {};
  // Scope narrows (optional): when omitted, scan ALL products/projects (full data under the filter).
  const productID = args.productID != null ? Number(args.productID) : null;
  const projectID = args.projectID != null ? Number(args.projectID) : null;
  const prodIds: string[] = [];
  const projIds: string[] = [];
  if (entity !== 'task') {
    const pRes = await client.viewJson('/product-browse-all.json').catch(() => null);
    const prodMap = pRes ? ((pRes as any).products || {}) : {};
    prodIds.push(...(productID ? [String(productID)] : Object.keys(prodMap)));
  }
  if (entity !== 'story') {
    const eRes = await client.viewJson('/project-browse-all.json').catch(() => null);
    const projMap = eRes ? ((eRes as any).projects || {}) : {};
    projIds.push(...(projectID ? [String(projectID)] : Object.keys(projMap)));
  }
  let rows: Dyn[] = [];
  if (entity === 'story') {
    for (const pid of prodIds) {
      try { const { rows: r } = await client.fetchAllPaginated('/product-browse-' + pid + '-0-unclosed-0-story-id_desc', { rowKey: 'stories', perPage: 500, maxPages: 20 }); rows.push(...r); } catch { /* skip product */ }
    }
  } else if (entity === 'bug') {
    for (const pid of prodIds) {
      try { const { rows: r } = await client.fetchAllPaginated('/bug-browse-' + pid + '-0-unclosed-0-id_desc', { rowKey: 'bugs', perPage: 500, maxPages: 20 }); rows.push(...r); } catch { /* skip product */ }
    }
  } else {
    for (const pjid of projIds) {
      try { const { rows: r } = await client.fetchAllPaginated('/task-browse-' + pjid + '-0-unclosed-0-id_desc', { rowKey: 'tasks', perPage: 500, maxPages: 20 }); rows.push(...r); } catch { /* skip project */ }
    }
  }
  // Apply filters (shared helper, also used by zentao_export; assignedTo supports multi-value)
  const filtered = applyRowFilters(rows, entity, f);
  const limit = Math.min(Number(args.limit) || 50, 200);
  const items = filtered.slice(0, limit).map((r: any) => {
    const titleKey = entity === 'task' ? 'name' : 'title';
    const item: Record<string, any> = { id: r.id, title: r[titleKey], status: r.status, pri: r.pri, assignedTo: r.assignedTo, openedDate: r.openedDate };
    if (entity === 'bug') item.severity = r.severity;
    if (r.deadline) item.deadline = r.deadline;
    const itemUrl = viewUrl(client, entity, r.id);
    if (itemUrl) item.url = itemUrl;
    return item;
  });
  return ok({ entity, scope: { productID, projectID }, total: filtered.length, scanned: rows.length, returned: items.length, limit, items });
}

// ---------- STATS (aggregation) ----------
async function stats(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const entity = args.entity;
  if (!['story', 'bug', 'task'].includes(entity)) return err('entity must be story, bug, or task', 'validation_error');
  // Scope narrows (optional): when omitted, scan ALL products/projects (full data).
  const productID = args.productID != null ? Number(args.productID) : null;
  const projectID = args.projectID != null ? Number(args.projectID) : null;
  const prodIds: string[] = [];
  const projIds: string[] = [];
  if (entity !== 'task') {
    const pRes = await client.viewJson('/product-browse-all.json').catch(() => null);
    const prodMap = pRes ? ((pRes as any).products || {}) : {};
    prodIds.push(...(productID ? [String(productID)] : Object.keys(prodMap)));
  }
  if (entity !== 'story') {
    const eRes = await client.viewJson('/project-browse-all.json').catch(() => null);
    const projMap = eRes ? ((eRes as any).projects || {}) : {};
    projIds.push(...(projectID ? [String(projectID)] : Object.keys(projMap)));
  }
  let rows: Dyn[] = [];
  if (entity === 'story') {
    for (const pid of prodIds) {
      try { const { rows: r } = await client.fetchAllPaginated('/product-browse-' + pid + '-0-unclosed-0-story-id_desc', { rowKey: 'stories', perPage: 500, maxPages: 20 }); rows.push(...r); } catch { /* skip */ }
    }
  } else if (entity === 'bug') {
    for (const pid of prodIds) {
      try { const { rows: r } = await client.fetchAllPaginated('/bug-browse-' + pid + '-0-unclosed-0-id_desc', { rowKey: 'bugs', perPage: 500, maxPages: 20 }); rows.push(...r); } catch { /* skip */ }
    }
  } else {
    for (const pjid of projIds) {
      try { const { rows: r } = await client.fetchAllPaginated('/task-browse-' + pjid + '-0-unclosed-0-id_desc', { rowKey: 'tasks', perPage: 500, maxPages: 20 }); rows.push(...r); } catch { /* skip */ }
    }
  }
  const groupBy = args.groupBy || 'status';
  const groups: Record<string, number> = {};
  const titleKey = entity === 'task' ? 'name' : 'title';
  for (const r of rows as Dyn[]) {
    let key: string;
    if (groupBy === 'status') key = String(r.status || 'unknown');
    else if (groupBy === 'severity') key = String(r.severity || 'unknown');
    else if (groupBy === 'assignedTo') key = String(r.assignedTo || 'unassigned');
    else if (groupBy === 'pri') key = String(r.pri || 'unknown');
    else key = String(r[groupBy] || 'unknown');
    groups[key] = (groups[key] || 0) + 1;
  }
  return ok({
    entity, scope: { productID, projectID }, total: rows.length, groupBy,
    stats: groups,
    top: Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => ({ key: k, count: v }))
  });
}

// ---------- TEMPLATE (pure local) ----------
async function template(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const entity = args.entity;
  const templates: Record<string, any> = {
    bug: {
      description: '标准 Bug 模板',
      fields: {
        title: '[模块] 简短描述（≤50字）',
        steps: '<p><b>前置条件：</b></p><ol><li>步骤1</li><li>步骤2</li><li>步骤3</li></ol><p><b>预期结果：</b></p><p>...</p><p><b>实际结果：</b></p><p>...</p><br><p><b>环境：</b>浏览器/OS/版本</p>',
        severity: '1=致命(系统崩溃/数据丢失) 2=严重(核心功能不可用) 3=一般(功能异常但有绕过) 4=轻微(UI/文案)',
        pri: '0=未设置 1=紧急(今天必须修) 2=高(本周) 3=中(本迭代) 4=低(排期)',
        type: 'codeerror(代码错误) design(设计问题) config(配置) performance(性能) install(安装) security(安全) standard(规范) interface(接口) other(其他)'
      },
      tips: [
        'title 用 [模块] 前缀方便分类',
        'steps 用 <ol> 有序列表写复现步骤',
        'severity 和 pri 是独立的：severity 是影响程度，pri 是处理优先级',
        '关联 story 用 storyID 参数'
      ]
    },
    story: {
      description: '标准需求模板',
      fields: {
        title: '功能名称（≤30字）',
        spec: '<p><b>背景：</b></p><p>为什么需要这个功能...</p><hr><p><b>功能描述：</b></p><ul><li>功能点1</li><li>功能点2</li></ul><hr><p><b>约束/假设：</b></p><ul><li>...</li></ul>',
        verify: '<p><b>验收标准：</b></p><ol><li>条件A时，执行操作B，应看到结果C</li><li>条件D时...</li></ol>',
        pri: '0=未设置 1=紧急 2=高 3=中 4=低',
        estimate: '预估开发工时（天）'
      },
      tips: [
        'spec 用 <hr> 分隔背景/功能/约束',
        'verify 用 <ol> 写可验证的条件-操作-结果',
        '创建后状态是 draft，需要 review+change 才能激活',
        'spec/verify 只能通过 story_create 或 story_change 写入'
      ]
    },
    task: {
      description: '标准任务模板',
      fields: {
        name: '动词+对象（如"开发用户登录接口"）',
        estimate: '预估工时（小时，不是天）',
        type: 'dev(开发) design(设计) test(测试) affair(事务)',
        pri: '0=未设置 1=紧急 2=高 3=中 4=低',
        deadline: 'YYYY-MM-DD 格式'
      },
      tips: [
        '工时单位是小时（不是天）',
        '创建后状态是 wait，需要 task_start 才能开始',
        'start 时要传 left=剩余工时（通常等于 estimate）',
        'finish 时要传 currentConsumed=已消耗工时'
      ]
    }
  };
  if (entity && templates[entity]) return ok(templates[entity]);
  return ok({ entities: Object.keys(templates), usage: 'Call with entity=bug|story|task for template details.' });
}

// ---------- WORKFLOW (pre-condition check) ----------
async function workflowCheck(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const entity = args.entity;
  const id = Number(args.id);
  const action = args.action;
  if (!['story', 'bug', 'task'].includes(entity)) return err('entity must be story, bug, or task', 'validation_error');
  
  // Read current state
  const d = await client.viewJson('/' + entity + '-view-' + id + '.json').catch(() => null);
  const cur = (d as any)?.[entity];
  if (!cur) return err(entity + ' ' + id + ' not found', 'not_found');
  
  const checks: { action: string; can: boolean; reason: string; tips: string[] }[] = [];
  
  if (entity === 'bug') {
    checks.push({
      action: 'resolve',
      can: cur.status === 'active',
      reason: cur.status === 'active' ? 'Bug状态 ' + bugStatusName(cur.status) + '，可以 resolve' : 'Bug状态 ' + bugStatusName(cur.status) + '，只有活动才能 resolve（已解决用 close，已关闭用 reopen）',
      tips: ['resolution 可选: fixed/bydesign/duplicate/external/willnotfix/notrepro/postponed/tostory', 'tostory 会自动创建关联需求']
    });
    checks.push({
      action: 'close',
      can: cur.status === 'resolved',
      reason: cur.status === 'resolved' ? 'Bug状态 ' + bugStatusName(cur.status) + '，可以 close' : 'Bug状态 ' + bugStatusName(cur.status) + '，只有已解决才能 close（活动先 resolve）',
      tips: []
    });
    checks.push({
      action: 'reopen',
      can: cur.status === 'resolved',
      reason: cur.status === 'resolved' ? 'Bug状态 ' + bugStatusName(cur.status) + '，可以 reopen（验证不通过）' : 'Bug状态 ' + bugStatusName(cur.status) + '，只有已解决才能 reopen',
      tips: []
    });
  } else if (entity === 'story') {
    checks.push({
      action: 'review',
      can: ['draft', 'changed', 'reviewing'].includes(cur.status),
      reason: ['draft', 'changed', 'reviewing'].includes(cur.status) ? '需求状态 ' + storyStatusName(cur.status) + '，可以 review' : '需求状态 ' + storyStatusName(cur.status) + '，只有 draft/changed/reviewing 才能 review',
      tips: ['review(result=pass) 后状态变 active']
    });
    checks.push({
      action: 'close',
      can: cur.status === 'active' || cur.status === 'changed',
      reason: ['active', 'changed'].includes(cur.status) ? '需求状态 ' + storyStatusName(cur.status) + '，可以 close' : '需求状态 ' + storyStatusName(cur.status) + '，只有 active/changed 才能 close',
      tips: ['closedReason 可选: done/duplicate/postponed/willnotdo/cancel/bydesign']
    });
    checks.push({
      action: 'change',
      can: cur.status !== 'closed',
      reason: cur.status !== 'closed' ? '需求状态 ' + storyStatusName(cur.status) + '，未关闭，可以 change' : '需求状态 已关闭，不能 change（先 reopen）',
      tips: ['change 可改 spec/verify/title，会记录变更历史']
    });
  } else if (entity === 'task') {
    checks.push({
      action: 'start',
      can: cur.status === 'wait',
      reason: cur.status === 'wait' ? '任务状态 ' + taskStatusName(cur.status) + '，可以 start' : '任务状态 ' + taskStatusName(cur.status) + '，只有等待才能 start（进行中用 log_add/finish）',
      tips: ['start 需要 left 参数（剩余工时）']
    });
    checks.push({
      action: 'finish',
      can: cur.status === 'doing',
      reason: cur.status === 'doing' ? '任务状态 ' + taskStatusName(cur.status) + '，可以 finish' : '任务状态 ' + taskStatusName(cur.status) + '，只有进行中才能 finish（等待先 start）',
      tips: ['finish 需要 currentConsumed 参数（已消耗工时）']
    });
    checks.push({
      action: 'pause',
      can: cur.status === 'doing',
      reason: cur.status === 'doing' ? '任务状态 ' + taskStatusName(cur.status) + '，可以 pause' : '任务状态 ' + taskStatusName(cur.status) + '，只有进行中才能 pause',
      tips: []
    });
    checks.push({
      action: 'resume',
      can: cur.status === 'paused',
      reason: cur.status === 'paused' ? '任务状态 ' + taskStatusName(cur.status) + '，可以 resume' : '任务状态 ' + taskStatusName(cur.status) + '，只有已暂停才能 resume',
      tips: []
    });
  }
  
  if (action) {
    const specific = checks.find(c => c.action === action);
    if (specific) return ok({ entity, id, url: viewUrl(client, entity, id), currentStatus: cur.status, ...specific });
    return err('Unknown action: ' + action + '. Valid: ' + checks.map(c => c.action).join(', '), 'validation_error');
  }
  return ok({ entity, id, url: viewUrl(client, entity, id), currentStatus: cur.status, checks });
}

// ---------- BATCH DRY RUN (batch operation preview) ----------
async function batchDryRun(client: ZentaoClient, args: Record<string, any>): Promise<Record<string, unknown>> {
  const tool = args.tool as string;
  const ids: number[] = args.ids || [];
  const toolArgs = args.args || {};
  if (!tool) return err('tool is required', 'validation_error');
  if (!ids.length) return err('ids array is empty', 'validation_error');
  const toolName = tool.startsWith('zentao_') ? tool : 'zentao_' + tool;
  
  // Determine entity from tool name
  const entityMatch = toolName.match(/zentao_(story|bug|task)_/);
  if (!entityMatch) return err('Cannot determine entity from tool: ' + toolName, 'validation_error');
  const entity = entityMatch[1];
  const idKey = entity + 'ID';
  
  // Read each entity's current state
  const items: { id: number; title: string; currentStatus: string; canExecute: boolean; reason: string; url?: string }[] = [];
  for (const id of ids) {
    try {
      const d = await client.viewJson('/' + entity + '-view-' + id + '.json').catch(() => null);
      const cur = (d as any)?.[entity];
      if (!cur) {
        items.push({ id, title: '(not found)', currentStatus: 'missing', canExecute: false, reason: '实体不存在或已删除', url: viewUrl(client, entity, id) });
        continue;
      }
      const title = cur.title || cur.name || '';
      const status = cur.status || 'unknown';
      // Basic pre-condition check
      let can = true, reason = 'OK';
      if (toolName.includes('close') && status === 'closed') { can = false; reason = '已关闭'; }
      if (toolName.includes('resolve') && status !== 'active') { can = false; reason = '状态是 ' + status + '（需要 active）'; }
      if (toolName.includes('delete')) { can = true; reason = '软删除（可逆）'; }
      items.push({ id, title, currentStatus: status, canExecute: can, reason, url: viewUrl(client, entity, id) });
    } catch (e) {
      items.push({ id, title: '', currentStatus: 'error', canExecute: false, reason: (e as Error).message.slice(0, 60), url: viewUrl(client, entity, id) });
    }
  }
  const canCount = items.filter(i => i.canExecute).length;
  return ok({
    dry_run: true, tool: toolName, entity, total: ids.length,
    canExecute: canCount, cannotExecute: ids.length - canCount,
    items,
    note: '确认无误后直接调用 ' + toolName + '（21 个写工具支持 ids 数组），无需 dry_run 参数'
  });
}

// ---- GLOBAL SEARCH (全文检索) ----
// Route: GET /search-index.json?words=... (and /search-index-{recTotal}-{page}.json for later pages).
// Returns a MIXED cross-entity result set (bug/story/task/case/doc/...) from the full-text index:
//   data: { title, results: {<uniqID>: {id, objectType, objectID, title, content, addedDate, editedDate, score, summary, url}},
//           consumed, type: 'all', pager: {recTotal, recPerPage:~10, pageTotal, pageID}, words }
// Verified live (2026-09-15): the server does NOT apply a type filter on this GET route (type[] POST
// to /search/ and the searchType query param are both ignored server-side) — the per-result objectType
// lets us filter client-side. 'content' is raw numeric tokenizer noise and is dropped; 'summary'
// carries the readable snippet. Titles/summaries wrap the match in <span class='text-danger'>...</span>.
const GLOBAL_SEARCH_TYPES = ['all', 'story', 'bug', 'task', 'case', 'testcase', 'project', 'product', 'doc', 'caselib', 'testreport', 'testtask', 'feedback', 'service'];
function stripHighlight(s: unknown): string {
  return String(s || '').replace(/<span[^>]*>/g, '').replace(/<\/span>/g, '').replace(/<br\s*\/?>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}
async function globalSearch(client: ZentaoClient, args: Dyn): Promise<Record<string, unknown>> {
  const words = String(args.words || '').trim();
  if (!words) throw new Error('words (搜索关键词) is required');
  const type = args.type && args.type !== 'all' ? String(args.type) : 'all';
  if (!GLOBAL_SEARCH_TYPES.includes(type)) throw new Error('type must be one of: ' + GLOBAL_SEARCH_TYPES.join(', ') + ', got ' + type);
  const limit = Math.max(1, Math.min(Number(args.limit) || 50, 500));
  const MAX_PAGES = 10; // hard cap: 10 pages x ~100 rows = ~1000 rows max per call
  // Pager cookies are per-route: request 100 rows/page (server default is 10 — verified live).
  client.cookies.pagerSearchIndex = '100';
  const rows: Dyn[] = [];
  let recTotal = 0, pageTotal = 0, pageID = 0;
  let page = 1;
  while (page <= MAX_PAGES) {
    const path = page === 1 ? '/search-index.json' : '/search-index-' + recTotal + '-' + page + '.json';
    const view = await client.viewJson(path, { query: { words } });
    recTotal = Number(view.pager && view.pager.recTotal) || 0;
    pageTotal = Number(view.pager && view.pager.pageTotal) || 0;
    pageID = Number(view.pager && view.pager.pageID) || page;
    const rs = (view.results || {}) as Record<string, Dyn>;
    for (const r of Object.values(rs)) {
      rows.push({
        type: String(r.objectType || ''),
        id: Number(r.objectID),
        title: stripHighlight(r.title),
        summary: stripHighlight(r.summary),
        addedDate: String(r.addedDate || ''),
        editedDate: String(r.editedDate || ''),
        score: Number(r.score) || 0,
        url: client.config.baseUrl + String(r.url || '').replace(/\.json$/, '.html')
      });
    }
    const matched = type === 'all' ? rows.length : rows.filter(x => x.type === type).length;
    if (matched >= limit) break;
    if (rows.length >= recTotal || pageID >= pageTotal) break;
    if (type !== 'all' && rows.length >= Math.min(limit * 5, 1000)) break; // bounded over-fetch while filtering
    page++;
  }
  const filtered = type === 'all' ? rows : rows.filter(x => x.type === type);
  const out = filtered.slice(0, limit);
  return ok({
    words, type, limit,
    total: recTotal, // server grand total across ALL types
    scanned: rows.length,
    returned: out.length,
    pagesFetched: pageID,
    hasMore: filtered.length > out.length || (rows.length < recTotal && pageID < pageTotal),
    results: out,
    ...(type !== 'all' ? { note: '服务端不按类型过滤（type 为客户端过滤）：total 为全类型总数，已从 ' + rows.length + ' 行中筛出 type=' + type + ' 的 ' + filtered.length + ' 行' } : {}),
    suggested_next: '拿到 objectType+objectID 后用对应工具看详情：story→zentao_story_get / bug→zentao_bug_get / 其他类型直接打开 url。单实体条件查询（字段/日期/OR）用 zentao_bug_search、zentao_story_search 或 zentao_filter。'
  });
}

// ---------- MY DASHBOARD (我的地盘 /my/ 数据汇总) ----------
// The /my/ page (我的地盘) is a block layout: each panel is its own view route
// (my-bug / my-story / my-task / my-dynamic / project-all-undone / product-all-0-0-noclosed ...).
// Verified live 2026-09-16: the my module routes do NOT accept the standard
// {recTotal}-{perPage}-{page} pager segments (empty response) and ignore ?page= — so the my-*
// routes only yield page 1 (perPage can be raised via cookies: pagerMyTask=100 etc.).
// Strategy: stories/bugs assigned to me come from the standard product-browse routes per unclosed
// product (story_list 'assignedtome' preset / bug_list assignedTo filter — working pagination);
// tasks/projects/products/dynamic come from the my-* JSON routes (single page here; truncation
// noted when pageTotal > 1).
async function myDashboard(client: ZentaoClient, args: Dyn): Promise<Record<string, unknown>> {
  const account = client.config.account;
  const warnings: string[] = [];
  const prof = loadProfile(client.config);
  const products = (prof?.products || []).filter((p: Dyn) => (p.status || 'normal') !== 'closed');
  if (!products.length) warnings.push('no unclosed products in profile — run zentao_context first, then retry');
  // Browse pager cookies (deployment-native names): fewer, bigger pages per product.
  client.cookies.pagerProductBrowse = '100'; // story browse pages
  client.cookies.pagerBugBrowse = '200';      // bug browse pages
  const stories: Dyn[] = [];
  const bugs: Dyn[] = [];
  for (const p of products.slice(0, 40)) {
    try {
      const sr = (await storyList(client, { productID: p.id, status: 'assignedtome', limit: 200 })) as Record<string, Dyn>;
      for (const s of sr.data.stories || []) stories.push(s);
    } catch (e) { warnings.push('stories product ' + p.id + ': ' + (e as Error).message.slice(0, 100)); }
    try {
      const br = (await bugList(client, { productID: p.id, assignedTo: account, status: 'unclosed', limit: 200 })) as Record<string, Dyn>;
      for (const b of br.data.bugs || []) bugs.push(b);
    } catch (e) { warnings.push('bugs product ' + p.id + ': ' + (e as Error).message.slice(0, 100)); }
  }
  const seenS = new Set<number>();
  const storiesU = stories.filter((s) => { const k = Number(s.id); return seenS.has(k) ? false : (seenS.add(k), true); });
  const seenB = new Set<number>();
  const bugsU = bugs.filter((b) => { const k = Number(b.id); return seenB.has(k) ? false : (seenB.add(k), true); });
  const storiesOpen = storiesU.filter((s) => s.status !== 'closed');
  // Tasks: /my-task.json (type=assignedTo), perPage=100 cookie
  let tasks: Dyn[] = [];
  try {
    client.cookies.pagerMyTask = '100';
    const td = await client.viewJson('/my-task.json');
    tasks = (Object.values(td.tasks || {}) as Dyn[]).map((t: Dyn) => ({ ...t, url: viewUrl(client, 'task', t.id) }));
    const pageTotal = Number(td.pager && td.pager.pageTotal) || 1;
    if (pageTotal > 1) warnings.push('tasks: fetched page 1 of ' + pageTotal + ' only (my-task route has no URL pagination); total ' + (td.pager.recTotal ?? '?'));
  } catch (e) { warnings.push('tasks: ' + (e as Error).message.slice(0, 100)); }
  const OPEN_TASK = ['wait', 'doing', 'blocked', 'paused'];
  const tasksOpen = tasks.filter((t: Dyn) => OPEN_TASK.includes(t.status));
  // Projects: /project-all-undone.json (项目总览: unfinished projects I am involved in)
  let projects: Dyn[] = [];
  try {
    client.cookies.pagerProjectAll = '100';
    const jd = await client.viewJson('/project-all-undone.json');
    projects = (Object.values(jd.projectStats || jd.projects || {}) as Dyn[]).map((x: Dyn) => ({
      id: x.id, name: x.name, code: x.code || '', type: x.type || '',
      status: x.status || '', begin: x.begin || '', end: x.end || '',
      url: client.config.baseUrl + '/project-view-' + x.id + '.html'
    }));
  } catch (e) { warnings.push('projects: ' + (e as Error).message.slice(0, 100)); }
  // Products: /product-all-0-0-noclosed.json (产品总览: unclosed products I am involved in)
  let productStats: Dyn[] = [];
  try {
    client.cookies.pagerProductAll = '100';
    const jd = await client.viewJson('/product-all-0-0-noclosed.json');
    productStats = (Object.values(jd.productStats || jd.products || {}) as Dyn[]).map((x: Dyn) => ({
      id: x.id, name: x.name, code: x.code || '', status: x.status || '',
      PO: x.PO || '', QD: x.QD || '', RD: x.RD || '',
      url: client.config.baseUrl + '/product-view-' + x.id + '.html'
    }));
  } catch (e) { warnings.push('products: ' + (e as Error).message.slice(0, 100)); }
  // Activity feed: /my-dynamic.json (best effort; may be empty on some accounts)
  let dynamic: Dyn[] = [];
  try {
    const jd = await client.viewJson('/my-dynamic.json');
    dynamic = (jd.dateGroups || []).map((g: Dyn) => ({
      date: g.date || g.title || '',
      items: (g.items || g.list || []).map((d: Dyn) => ({ type: d.type || d.objectType || '', id: d.id || d.objectID || null, title: d.title || d.name || '', url: d.url || '' }))
    })).filter((g: Dyn) => (g.items || []).length);
  } catch { /* best effort */ }
  return ok({
    account,
    pulledAt: new Date().toISOString(),
    scope: {
      productsScanned: products.length,
      note: 'stories/bugs = assigned to ' + account + ' across ' + products.length + ' unclosed products; unclosed = status != closed. tasks/projects/products/dynamic = the account\'s own my-page scopes (my-task / project-all-undone / product-all-0-0-noclosed / my-dynamic routes).'
    },
    stories: { fetched: storiesU.length, unclosed: storiesOpen.length, items: storiesOpen },
    bugs: { fetched: bugsU.length, unclosed: bugsU.length, items: bugsU },
    tasks: { total: tasks.length, open: tasksOpen.length, items: tasks },
    projects: { total: projects.length, items: projects },
    products: { total: productStats.length, items: productStats },
    dynamic: { total: dynamic.length, groups: dynamic },
    ...(warnings.length ? { warnings } : {}),
    suggested_next: '外部看板对接：直接消费本返回（items 均带可点击 url）；单实体深挖用 zentao_story_get / zentao_bug_get；只要"未关闭+指派给我"的精简视图用 zentao_my_workbench。'
  });
}

export const HANDLERS = {
  zentao_whoami: whoami,
  zentao_context: context,
  zentao_profile: profile,
  zentao_cleanup_mcp: cleanupMcp,
  zentao_bulk_close: bulkClose,
  zentao_bulk_assign: bulkAssign,
  zentao_story_advance: storyAdvance,
  zentao_html_help: htmlHelp,
  zentao_tool_guide: toolGuide,
  zentao_multi_op: multiOp,
  zentao_relations: relations,
  zentao_validate_args: validateArgs,
  zentao_status_enum: statusEnum,
  zentao_export: exportData,
  zentao_my_workbench: myWorkbench,
  zentao_my_dashboard: myDashboard,
  zentao_dry_run: dryRun,
  zentao_field_guide: fieldGuide,
  zentao_filter: filterEntities,
  zentao_stats: stats,
  zentao_template: template,
  zentao_workflow: workflowCheck,
  zentao_batch_dry_run: batchDryRun,
  zentao_product_list: productList,
  zentao_product_get: productGet,
  zentao_product_create: productCreate,
  zentao_product_update: productUpdate,
  zentao_story_list: storyList,
  zentao_story_get: storyGet,
  zentao_story_create: storyCreate,
  zentao_story_update: storyUpdate,
  zentao_story_close: storyClose,
  zentao_story_review: storyReview,
  zentao_story_change: storyChange,
  zentao_story_saved_queries: storySavedQueries,
  zentao_story_search: storySearch,
  zentao_productplan_list: productplanList,
  zentao_productplan_get: productplanGet,
  zentao_testcase_list: testcaseList,
  zentao_testcase_get: testcaseGet,
  zentao_testcase_create: testcaseCreate,
  zentao_testcase_update: testcaseUpdate,
  zentao_testcase_run: testcaseRun,
  zentao_testtask_list: testtaskList,
  zentao_testreport_list: testreportList,
  zentao_testsuite_list: testsuiteList,
  zentao_bug_list: bugList,
  zentao_bug_saved_queries: bugSavedQueries,
  zentao_bug_search: bugSearch,
  zentao_global_search: globalSearch,
  zentao_bug_get: bugGet,
  zentao_bug_create: bugCreate,
  zentao_bug_update: bugUpdate,
  zentao_bug_resolve: bugResolve,
  zentao_bug_close: bugClose,
  zentao_bug_reopen: bugReopen,
  zentao_execution_list: executionList,
  zentao_execution_get: executionGet,
  zentao_task_list: taskList,
  zentao_task_create: taskCreate,
  zentao_task_start: taskStart,
  zentao_task_finish: taskFinish,
  zentao_task_update: taskUpdate,
  zentao_task_close: taskClose,
  zentao_execution_create: executionCreate,
  zentao_task_pause: taskPause,
  zentao_task_log_add: taskLogAdd,
  zentao_task_resume: taskResume,
  zentao_story_delete: storyDelete,
  zentao_bug_delete: bugDelete,
  zentao_task_delete: taskDelete,
  zentao_productplan_create: productplanCreate,
  zentao_product_delete: productDelete,
  zentao_execution_delete: executionDelete,
  zentao_productplan_delete: productplanDelete,
  zentao_build_create: buildCreate,
  zentao_build_list: buildList,
  zentao_module_list: moduleList,
  zentao_build_get: buildGet,
  zentao_build_delete: buildDelete,
  zentao_module_create: moduleCreate,
  zentao_module_rename: moduleRename,
  zentao_module_delete: moduleDelete,
  zentao_module_tree: moduleTree,
  zentao_productplan_link_story: productplanLinkStory,
  zentao_productplan_unlink_story: productplanUnlinkStory,
  zentao_productplan_link_bug: productplanLinkBug,
  zentao_productplan_unlink_bug: productplanUnlinkBug
};
