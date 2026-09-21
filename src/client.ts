// ZenTao Legacy MCP - session-based HTTP client for the biz4.1.3 legacy API.
//
// Authentication flow (verified against a live biz4.1.3 instance):
//   1. GET the login page  -> server sets a zentaosid cookie (session).
//   2. Extract verifyRand (a per-page nonce) from the login form.
//   3. POST /user-login.html with account + md5(md5(password) + verifyRand) + verifyRand.
//   4. On success the zentaosid cookie becomes a valid session; carry it on every request.
//
// Business calls use the "view" JSON API: the same PATH_INFO route with a .json suffix
// (e.g. /product-view-20.json) which returns {"status":"success","data":"<json string>"}.
// Write actions use PATH_INFO routes with form-encoded bodies.

import { createHash } from 'node:crypto';
import type { ZentaoConfig } from './config.js';

export type FetchImpl = (url: string | URL | Request, init?: RequestInit) => Promise<Response>;

type OptionMap = Record<string, string>;
type BuildRef = { id: string | number; name?: string; [k: string]: unknown };
type FetchAllOpts = { rowKey: string; perPage?: number; maxPages?: number; urlTemplate?: string; cacheTTL?: number };
type FetchAllResult = { rows: Record<string, unknown>[]; recTotal: number; pagesFetched: number; pageRecTotal?: number; cached?: boolean };

// NOTE: Per the auth-persistence spec, session state is held ONLY in memory
// (the in-process singleton below). We do NOT write the sid to disk or any
// external store, to avoid security exposure and cross-process inconsistency.

function md5(s: string): string {
  return createHash('md5').update(s, 'utf8').digest('hex');
}

export function hashPassword(password: string, verifyRand: string): string {
  // Matches the JS the login page sends: md5( md5(password) + verifyRand )
  return md5(md5(password) + verifyRand);
}

// Convert a product-view modules map (id -> "/path/to/module") into flat rows
// with derived parent ids (the parent's path prefix must already be seen).
function modulesFromPathMap(map: Record<string, unknown>): any[] {
  const out: any[] = [];
  const byPath = new Map<string, number>();
  byPath.set('', 0);
  const entries: [string, unknown][] = Array.isArray(map) ? (map as any[]).map(m => [String(m.id), m.path]) : Object.entries(map);
  for (const [id, pathVal] of entries) {
    if (!id || id === '0') continue;
    const norm = String(pathVal || '').replace(/^\/+/, '').replace(/\/+$/, '');
    if (!norm) continue;
    const segs = norm.split('/');
    const name = segs[segs.length - 1];
    const parent = byPath.get(segs.slice(0, -1).join('/')) || 0;
    byPath.set(norm, Number(id));
    out.push({ id: Number(id), name, parent, sort: out.length + 1, path: '/' + norm, stories: 0, bugs: 0 });
  }
  return out;
}

export class ZentaoClient {
  config!: ZentaoConfig;
  fetchImpl!: FetchImpl;
  zentaosid: string | null = null;
  cookies: Record<string, string> = {};
  loggedIn: boolean = false;
  verified: boolean = false;

  private _loginAttempts: number[] = [];
  private _loginWindowMs = 5 * 60 * 1000;
  private _loginMaxPerWindow = 3;
  private _lockoutUntil: number | null = null;
  private _lastLockoutMsg: string | null = null;
  private _loginInFlight: Promise<void> | null = null;
  private _lastActiveTime = 0;
  private _cacheMaxSize = 50;
  private _requestTimeoutMs!: number;
  private _fetchAllCache: Map<string, { ts: number; val: FetchAllResult }> | null = null;

  constructor(config: ZentaoConfig, fetchImpl?: FetchImpl) {
    this.config = config;
    // Optional: disable HTTP Keep-Alive (ZENTAO_DISABLE_KEEPALIVE=1) to test whether
    // connection-reuse causes the server to flag repeated logins as anomalous.
    // undici's default fetch pools connections (Keep-Alive on); a fresh Agent with
    // keepAlive:false forces a new TCP connection per request.
    if (!fetchImpl && process.env.ZENTAO_DISABLE_KEEPALIVE === '1') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Agent } = require('undici') as { Agent: new (o: { connect: { keepAlive: boolean } }) => unknown };
        const _agent = new Agent({ connect: { keepAlive: false } });
        const origFetch = globalThis.fetch.bind(globalThis) as FetchImpl;
        fetchImpl = ((url: string | URL | Request, init: RequestInit = {}) =>
          origFetch(url, { ...init, dispatcher: _agent } as RequestInit)) as FetchImpl;
        this._log('keepAlive DISABLED (fresh TCP per request)');
      } catch (e) {
        this._log('undici not available, using default fetch: ' + (e as Error).message);
      }
    }
    this.fetchImpl = fetchImpl || globalThis.fetch;
    // Pre-injected sid (test framework optimization): if provided, seed the session
    // so ensureLogin() skips the login POST entirely. This lets the test parent
    // process log in once and share the sid with the child, avoiding repeated
    // logins that trip the server's short-window login-rate protection.
    this.zentaosid = (config.injectedSid || null);
    if (this.zentaosid) {
      this.cookies = { lang: 'zh-cn', device: 'desktop', theme: 'default' };
      this.loggedIn = true; // treat injected sid as already logged in
      this._log('Using injected ZENTAO_SID (skipping login POST): ' + this.zentaosid.slice(0, 8) + '...');
    }
    this.cookies = this.cookies || {}; // other cookies to carry
    this.loggedIn = this.loggedIn || false;
    this.verified = false;
    // Login-rate guard: track real login POSTs within a sliding window so a buggy
    // retry loop cannot hammer the login endpoint and trip the server's lockout.
    this._loginAttempts = []; // timestamps of real login POSTs
    // Expert-confirmed: ZenTao locks after 5 login attempts, for 10 minutes. Each attempt
    // (success or failure) counts. We stay well under 5 to never trip the protection.
    this._loginWindowMs = 5 * 60 * 1000; // 5-minute window (covers the lockout period)
    this._loginMaxPerWindow = 3; // hard cap: max 3 real login POSTs per window (< 5 threshold)
    this._lockoutUntil = null;
    this._lastLockoutMsg = null;
    // --- Auth singleton (in-memory only, per spec §1) ---
    // cachedSid holds the valid session id for the whole process lifetime.
    // It is populated lazily on the first business call (spec §2) and reused
    // thereafter. Never written to disk.
    this._loginInFlight = null; // in-flight login promise (dedupes concurrent logins)
    this._lastActiveTime = 0;   // for optional session keep-alive (spec §4)
    this._cacheMaxSize = 50; // max full-scan cache entries (LRU eviction beyond this)
    this._requestTimeoutMs = config.requestTimeoutMs || 30000; // per-request timeout (prevents hangs)
  }

  // fetch with a timeout: aborts the request after timeoutMs to prevent a slow/hung
  // server response from blocking the MCP event loop indefinitely.
  private async _fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this._requestTimeoutMs);
    try {
      return await this.fetchImpl(url, { ...init, signal: ctrl.signal });
    } catch (e) {
      if ((e as Error).name === 'AbortError' || /aborted|timeout/i.test((e as Error).message)) {
        throw new Error('Request timed out after ' + Math.round(this._requestTimeoutMs / 1000) + 's: ' + url);
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  private _log(...a: unknown[]): void {
    if (this.config.debug) process.stderr.write('[zentao] ' + a.join(' ') + '\n');
  }

  private _cookieHeader(): string {
    const parts: string[] = [];
    if (this.zentaosid) parts.push('zentaosid=' + this.zentaosid);
    for (const [k, v] of Object.entries(this.cookies)) parts.push(k + '=' + v);
    return parts.join('; ');
  }

  // biz 4.1.3 server-side quirk (verified live 2026-09-13): rendering a bySearch STORY view
  // stores that query's status scope in the server session, and a later byModule story view on the
  // same product silently intersects with it (e.g. an unclosed-scoped query drops ALL closed
  // stories from the module list: 718 -> 594 rows, and it persists until a plain story browse view
  // is rendered, which ignores and clears the scope). The bug side is NOT affected. We track which
  // products were dirtied and reset deterministically before module-scoped story fetches.
  storyDirtyProducts = new Set<number>();
  markStorySearchDirty(productID: number): void {
    this.storyDirtyProducts.add(Number(productID));
  }
  // True once at least one upload in this session has been verified good (see uploadBuffer).
  uploadWarmed = false;

  async ensureStoryScopeClean(productID: number): Promise<void> {
    if (!this.storyDirtyProducts.has(Number(productID))) return;
    this.storyDirtyProducts.delete(Number(productID));
    try {
      await this._get(this.config.baseUrl + '/product-browse-' + productID + '-0-allstory-0-story.json', { Accept: 'application/json' });
    } catch (e) {
      this._log('story scope reset failed (non-fatal):', (e as Error).message);
    }
  }

  // Browse pages set scope/memory cookies (storyModule, bugModule, preProductID, ...) that the
  // SERVER READS on every subsequent request to filter the view. Carrying them in the jar would
  // leak one list call's scope into the next (verified live 2026-09-13: byModule-464 sets
  // storyModule=464, after which ALL story views silently scoped to module 464). Never persist
  // them: each list call must carry an explicit, deterministic scope via its URL.
  private static readonly COOKIE_BLOCKLIST = new Set([
    'storyModule', 'bugModule', 'taskModule', 'caseModule', 'storyBranch', 'taskBranch',
    'preBranch', 'preProductID', 'preModule', 'preExecution',
    'lastProduct', 'lastStoryModule', 'lastBugModule', 'lastTaskModule', 'lastCaseModule', 'lastExecution',
    'productStoryOrder', 'productBugOrder', 'productTaskOrder'
  ]);

  private _storeCookies(res: Response): void {
    const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    for (const c of raw) {
      const [pair] = c.split(';');
      const idx = pair.indexOf('=');
      if (idx === -1) continue;
      const name = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      if (name === 'zentaosid') this.zentaosid = val;
      else if (!ZentaoClient.COOKIE_BLOCKLIST.has(name)) this.cookies[name] = val;
    }
  }

  private _headers(extra: Record<string, string> = {}): Record<string, string> {
    const h: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (compatible; zentao-legacy-mcp/1.0)',
      ...extra,
    };
    const ck = this._cookieHeader();
    if (ck) h['Cookie'] = ck;
    return h;
  }

  async _get(url: string, extra: Record<string, string> = {}): Promise<Response> {
    const res = await this._fetchWithTimeout(url, { headers: this._headers(extra), redirect: 'follow' });
    this._storeCookies(res);
    return res;
  }

  async _postForm(url: string, params: Record<string, unknown>, extra: Record<string, string> = {}): Promise<Response> {
    const body = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) body.set(k, v == null ? '' : String(v));
    const res = await this._fetchWithTimeout(url, {
      method: 'POST',
      headers: this._headers({ 'Content-Type': 'application/x-www-form-urlencoded', ...extra }),
      body: body.toString(),
      redirect: 'follow',
    });
    this._storeCookies(res);
    return res;
  }

  // --- Authentication ---

  // Probe whether the current zentaosid session is still valid WITHOUT hitting the login
  // endpoint. Hitting a lightweight authenticated page and checking it is not a login redirect.
  // This lets us reuse an existing session (e.g. keepLogin) and avoid triggering the server's
  // failed-login lockout when an already-valid cookie is injected.
  async _sessionValid(): Promise<boolean> {
    if (!this.zentaosid) return false;
    try {
      const res = await this._get(this.config.baseUrl + '/my.html', { 'X-Requested-With': 'XMLHttpRequest' });
      const html = await res.text();
      // If we got a real page (not a login redirect) the session is valid.
      return !/user-login|verifyRand/.test(html.slice(0, 2000));
    } catch { return false; }
  }

  // Unified session guard (spec §3 "request interception"). Every business request must
  // pass through this. Guarantees:
  //   - Lazy login: NO login at startup; the first business call triggers it (spec §2).
  //   - In-memory singleton: cachedSid (this.zentaosid) is reused for the process lifetime.
  //   - In-flight dedup: concurrent callers share ONE login promise (no double-login).
  //   - Rate/lockout guard: never hammers the login endpoint.
  // `force` is used ONLY by the session-expiry retry path (spec §3), never by startup.
  async ensureLogin(force = false): Promise<void> {
    // Fast path: a valid in-memory session exists -> reuse, zero login.
    if (!force && this.loggedIn && this.zentaosid) {
      this._lastActiveTime = Date.now();
      return;
    }
    // In-flight dedup: if a login is already running, await it (this is what prevents
    // the double-login that the startup-prefetch design caused).
    if (!force && this._loginInFlight) return this._loginInFlight;

    const doLogin = async () => {
      const base = this.config.baseUrl;

      // Lockout protection: if we recently hit a "too many attempts" lockout, do NOT
      // hammer the login endpoint again (each attempt resets the server lockout timer).
      if (this._lockoutUntil && Date.now() < this._lockoutUntil) {
        const secs = Math.ceil((this._lockoutUntil - Date.now()) / 1000);
        this._lastLockoutMsg = 'Account is locked (too many failed login attempts). Retry in ~' + secs + 's.';
        throw new Error(this._lastLockoutMsg);
      }
      this._lastLockoutMsg = null;

      // Login-rate guard: refuse a real login POST if we've exceeded the per-window cap.
      const now = Date.now();
      this._loginAttempts = this._loginAttempts.filter(t => now - t < this._loginWindowMs);
      if (this._loginAttempts.length >= this._loginMaxPerWindow) {
        const waitSecs = Math.ceil((this._loginWindowMs - (now - this._loginAttempts[0])) / 1000);
        throw new Error('Login rate limit (client): ' + this._loginMaxPerWindow + ' logins in ' + Math.round(this._loginWindowMs/60000) + 'min. Wait ~' + waitSecs + 's before retrying to avoid server lockout.');
      }

      // 1. Obtain the session via the AUTHORITATIVE getSessionID endpoint (ZenTao docs:
      //    "一、获得session：访问 api 模块的 getSessionID 方法"). This is more stable than
      //    scraping the login page, and avoids the verifyRand one-time-expiry issue.
      let res = await this._get(base + '/api-getsessionid.json', { Accept: 'application/json' });
      let sidText = await res.text();
      let getSessionID = null;
      try {
        const outer = JSON.parse(sidText);
        getSessionID = typeof outer.data === 'string' ? JSON.parse(outer.data) : outer.data;
      } catch { /* fall back to login page below */ }
      if (getSessionID && getSessionID.sessionID) {
        // Carry the authoritative session id. (storeCookies also picks it up from Set-Cookie.)
        this.zentaosid = getSessionID.sessionID;
      }

      // 2. POST credentials. Per the docs, login takes `account` + `password`. The server
      //    accepts the PLAIN password (the double-md5+verifyRand is a browser-side obfuscation
      //    in the login page JS, not a server requirement). Using plain password + no
      //    verifyRand eliminates the one-time-expiry flakiness.
      this._loginAttempts.push(Date.now());
      this._log('LOGIN-POST #' + this._loginAttempts.length + ' (window count=' + this._loginAttempts.length + ')');
      if (this.config.debug) {
        process.stderr.write('[zentao-debug] LOGIN POST triggered, loggedIn-was=' + this.loggedIn + ' inFlight-was=' + (this._loginInFlight ? 'yes' : 'no') + '\n');
      }
      const params: Record<string, string> = {
        account: this.config.account,
        password: this.config.password,
      };
      if (this.config.keepLogin) params['keepLogin[]'] = 'on';
      // LOGIN DUMP (diagnostic): ZENTAO_DUMP_LOGIN=<path> writes the full login request+
      // response for byte-level diff against a known-good login (captures the child's
      // actual login, not just the result).
      const _dumpPath = process.env.ZENTAO_DUMP_LOGIN;
      const _dumpBody = new URLSearchParams(params).toString();
      res = await this._postForm(base + '/user-login.html', params, { 'X-Requested-With': 'XMLHttpRequest' });
      const text = await res.text();
      if (_dumpPath) {
        try {
          const { writeFileSync } = await import('node:fs');
          writeFileSync(_dumpPath, 'PID: ' + process.pid + '\nTIME: ' + new Date().toISOString() + '\n' +
            'zentaosid(getSessionID): ' + this.zentaosid + '\n\n' +
            'POST URL: ' + base + '/user-login.html\n' +
            'POST HEADERS: ' + JSON.stringify(this._headers({ 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' }), null, 2) + '\n\n' +
            'POST BODY: ' + _dumpBody + '\n\n' +
            'RESPONSE STATUS: ' + res.status + '\nRESPONSE SET-COOKIE: ' + JSON.stringify(res.headers.getSetCookie ? res.headers.getSetCookie() : []) + '\n\n' +
            'RESPONSE BODY: ' + text.slice(0, 500) + '\n');
          this._log('LOGIN DUMPED to ' + _dumpPath);
        } catch (e) { this._log('login dump failed: ' + (e as Error).message); }
      }
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 300) }; }

      if (data.result !== 'success') {
        const msg = data.message || data.msg || 'login failed';
        if (/尝试次数|too many|locked|解锁|填写正确|尝试机会/i.test(msg)) {
          // Expert-confirmed: the server lockout is 10 minutes. Match it exactly so we
          // stop for the full duration (a shorter cooldown would make us retry mid-lock,
          // and each attempt resets the timer, making the lock persistent).
          this._lockoutUntil = Date.now() + 10 * 60 * 1000;
          this._lastLockoutMsg = 'Account is locked (ZenTao locks after 5 login attempts, for 10 minutes). Retry in ~10 minutes, or have an admin unlock it.';
        }
        throw new Error('Login failed: ' + msg + (data.code ? ' (code ' + data.code + ')' : ''));
      }

      this.loggedIn = true;
      this.verified = false;
      this._lockoutUntil = null; // a successful login clears any client-side cooldown
      this._lastLockoutMsg = null;
      this._lastActiveTime = Date.now();
      this._log('Login OK as', this.config.account, 'sid=', (this.zentaosid || '').slice(0, 8) + '...');
    };

    this._loginInFlight = doLogin();
    try {
      await this._loginInFlight;
    } finally {
      this._loginInFlight = null;
    }
  }

  // Verify the session is still alive by hitting a lightweight JSON view.
  async verifySession(): Promise<boolean> {
    if (!this.loggedIn) return false;
    try {
      const r = await this._get(this.config.baseUrl + '/my-view.html', { Accept: 'application/json' });
      // A redirect to login or a 401/403 means the session is gone.
      if (r.status === 401 || r.status === 403) return false;
      const ct = r.headers.get('content-type') || '';
      const t = await r.text();
      if (ct.includes('json')) return true;
      // If we got HTML back that mentions login, session expired.
      if (/user-login|登录/.test(t) && t.length < 5000) return false;
      return true;
    } catch {
      return false;
    }
  }

  // --- View JSON API ---
  // GET a PATH_INFO route with .json suffix, parse the nested data string.
  // Returns `any` — the ZenTao view API returns different field sets per endpoint.
  // The shape is dynamic and endpoint-specific; handlers access fields directly.
  async viewJson(routePath: string, { query = {} }: { query?: Record<string, string | number> } = {}): Promise<any> {
    await this.ensureLogin();
    const qs = new URLSearchParams(query as Record<string, string>).toString();
    let url = this.config.baseUrl + routePath + (routePath.endsWith('.json') ? '' : '.json');
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    let res = await this._get(url, { Accept: 'application/json' });
    const ct = res.headers.get('content-type') || '';
    const text = await res.text();

    // Detect session expiry: HTML redirect to login.
    if (!ct.includes('json') && /user-login/.test(text)) {
      this.loggedIn = false;
      await this.ensureLogin(true);
      res = await this._get(url, { Accept: 'application/json' });
      return this._parseJsonResponse(await res.text());
    }
    return this._parseJsonResponse(text);
  }

  _parseJsonResponse(text: string): any {
    let outer;
    try { outer = JSON.parse(text); } catch { throw new Error('Non-JSON response' + (text.trim() === '' ? ' (0-byte body — this route/feature may be disabled on the deployment or not enabled for this account)' : ': ' + text.slice(0, 200))); }
    if (outer.status && outer.status !== 'success') {
      throw new Error('API returned status=' + outer.status + ' ' + (outer.message || ''));
    }
    // data is a JSON *string* in the legacy view API
    if (typeof outer.data === 'string') {
      try { return JSON.parse(outer.data); } catch { return outer.data; }
    }
    return outer.data !== undefined ? outer.data : outer;
  }

  // --- Write actions (form POST to PATH_INFO routes) ---
  async postRoute(routePath: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
    await this.ensureLogin();
    const url = this.config.baseUrl + routePath;
    const res = await this._postForm(url, params);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 300) }; }
    if (data.result && data.result !== 'success' && !data.locate) {
      throw new Error('Action failed: ' + (data.message || JSON.stringify(data)));
    }
    return data;
  }

  // Extract a fresh verifyRand for write actions that require it.
  async getVerifyRand() {
    const res = await this._get(this.config.baseUrl + '/index.php?m=user&f=login&t=html');
    const html = await res.text();
    const m = html.match(/verifyRand[^>]*value='?([0-9]+)'?/);
    return m ? m[1] : '';
  }

  // GET a create-form page and extract the anti-CSRF kuid token (var kuid = 'hex').
  // This token MUST be echoed back in the create POST or the server silently rejects it.
  async getKuid(createPageUrl: string): Promise<string> {
    const res = await this._get(this.config.baseUrl + createPageUrl, { 'X-Requested-With': 'XMLHttpRequest' });
    const html = await res.text();
    const m = html.match(/kuid\s*=\s*'([0-9a-f]+)'/);
    return m ? m[1] : '';
  }

  // Get the product's builds (array of {id, name}). Used to satisfy the required
  // openedBuild[] field on bug/case create. Returns [] if none.
  async getProductBuilds(productID: number): Promise<BuildRef[]> {
    try {
      const d = await this.viewJson('/product-build-' + productID + '.json');
      const b = d.builds || [];
      return Array.isArray(b) ? b : Object.values(b || {});
    } catch { return []; }
  }

  // Get the product's full module tree (flat rows {id, name, parent, sort, ...}).
  // Primary route: /module-browse-<pid>.json. Some deployments disable that route
  // (HTTP 200 + 0-byte body → viewJson throws "Non-JSON response"); in that case fall
  // back to the product-browse view, whose modules field is an id -> "/path" map.
  // `context` is used only in error messages.
  async getModuleTree(productID: number, context: string): Promise<{ modules: any[]; source: 'module-browse' | 'product-browse-fallback' }> {
    try {
      const data = await this.viewJson('/module-browse-' + productID + '.json');
      if (data && (data as any).status === 'fail' && (data as any).message) {
        throw new Error('module browse denied: ' + (data as any).message);
      }
      const raw = data.modules ? (Array.isArray(data.modules) ? data.modules : Object.values(data.modules)) : [];
      return { modules: raw as any[], source: 'module-browse' };
    } catch (e: any) {
      const msg = String(e?.message || e);
      // Only fall back when the dedicated route is dead (0-byte/non-JSON body),
      // not on permission denials or real network errors.
      if (!/Non-JSON response/i.test(msg)) throw e;
      const view = await this.viewJson('/product-browse-' + productID + '.json');
      const raw = (view as any).modules;
      if (!raw) throw new Error('Module route disabled and product view has no modules field (deployment ' + this.config.baseUrl + ', ' + context + ').');
      return { modules: modulesFromPathMap(raw), source: 'product-browse-fallback' };
    }
  }

  // Parse user-saved search queries out of a search build-form page.
  // Queries appear as data-query-id='N' title='Name' (or double-quoted) tags.
  parseSavedQueriesHtml(html: string): { queryID: number; title: string }[] {
    const queries: { queryID: number; title: string }[] = [];
    const seen = new Set<number>();
    for (const re of [/data-query-id='(\d+)'[^>]*title='([^']*)'/g, /data-query-id="(\d+)"[^>]*title="([^"]*)"/g]) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(html)) !== null) {
        const id = Number(m[1]);
        if (seen.has(id)) continue;
        seen.add(id);
        queries.push({ queryID: id, title: m[2] });
      }
    }
    return queries;
  }

  // ---------- Ad-hoc server-side search (search-buildQuery) ----------
  // ZenTao 4.x search form: up to 6 conditions in 2 groups (3+3), each = field + operator + value.
  //   POST /search-buildQuery.html  (module, groupItems=3, formType, andOr1..6, field1..6,
  //   operator1..6, value1..6, groupAndOr, actionURL)
  // Two verified success modes (verified on a live biz 4.1.3 deployment, 2026-09-14):
  //   (a) Row mode: the response URL has 'myQueryID' replaced with a NEW numeric queryID — a
  //       temporary query row was created; the bySearch-<N> page executes it.
  //   (b) Session mode (this deployment): the response echoes the actionURL with 'myQueryID'
  //       UNTOUCHED — no DB row is created, but the conditions are stored in the session and
  //       the bySearch-myQueryID page (and its .json endpoint) execute them. A browser search
  //       that lands on bySearch-myQueryID IS working, not failing (verified live: exact
  //       filtered rows returned; 0 rows for impossible keywords).
  // null = neither (deny redirect / empty location) → treat as feature disabled.
  // operators: =  !=  >  >=  <  <=  include(包含)  notinclude(不包含)  between(介于, value=start,end)  belong(从属于)
  // common bug fields: title keywords openedBy assignedTo status severity pri type module openedDate openedBuild
  // common story fields: title keywords openedBy assignedTo status category pri module openedDate
  // Returns the numeric queryID (row mode), the literal 'myQueryID' sentinel (session mode),
  // or null (feature disabled / deny).
  async buildAdhocQuery(module: 'bug' | 'story', conditions: { field: string; operator?: string; value: string; andOr?: 'and' | 'or' }[], productID: number, branch: number): Promise<number | 'myQueryID' | null> {
    await this.ensureLogin();
    if (!conditions.length) return null;
    const conds = conditions.slice(0, 6);
    const params: Record<string, string> = {
      module, groupItems: '3', formType: conds.length > 3 ? 'more' : 'lite',
      // Form structure (verified byte-for-byte from the live buildForm fragment, hidden controls
      // included):  G1 = c1 [andOr1=hidden 'AND'] c2 [andOr2] c3 [andOr3]  groupAndOr  G2 = c4
      //   [andOr4=hidden 'AND'] c5 [andOr5] c6 [andOr6].
      // The connector BEFORE c4 is the groupAndOr select (that is what conditions[3].andOr maps to);
      // andOr4 itself is a fixed hidden 'AND' and must always be submitted.
      groupAndOr: 'and',
      andOr1: 'AND',
      andOr4: 'AND',
      actionURL: '/product-browse-' + productID + '-' + branch + '-bySearch-myQueryID-' + module + '.html'
    };
    // The search form's field list is rendered from the session's current-product context
    // (verified live: buildForm without context has 0 fields, with context 27-42). Establish
    // it before building, or the server-side condition builder has no field config to validate
    // against and silently drops every condition.
    try {
      await this._get(this.config.baseUrl + '/product-browse-' + productID + '-' + branch + '-' + module + '.html', { 'X-Requested-With': 'XMLHttpRequest' });
    } catch { /* context is best-effort */ }
    conds.forEach((cnd, i) => {
      const n = i + 1;
      if (n === 4) params['groupAndOr'] = cnd.andOr === 'or' ? 'or' : 'and';
      else if (n > 1) params['andOr' + n] = cnd.andOr === 'or' ? 'or' : 'and';
      params['field' + n] = String(cnd.field);
      params['operator' + n] = cnd.operator || 'include';
      // between = two values: visible input valueN + hidden twin dateValueN (see the form's
      // resetForm which clears both #value<N> and #dateValue<N> independently).
      if (cnd.operator === 'between' && String(cnd.value).includes(',')) {
        const [v1, v2] = String(cnd.value).split(',');
        params['value' + n] = v1.trim();
        params['dateValue' + n] = v2.trim();
      } else {
        params['value' + n] = String(cnd.value);
      }
    });
    const res = await this._postForm(this.config.baseUrl + '/search-buildQuery.html', params, {
      'X-Requested-With': 'XMLHttpRequest',
      Referer: this.config.baseUrl + '/product-browse-' + productID + '-' + branch + '-' + (module === 'bug' ? 'bug' : 'story') + '.html'
    });
    const text = await res.text();
    const url = (text.match(/location='([^']+)'/) || [])[1] || '';
    const m = url.match(/bySearch-(\d+)/);
    if (m) return Number(m[1]);
    // Session mode: myQueryID echoed untouched → conditions are held in the session and the
    // bySearch-myQueryID page executes them. Nothing was created in the DB → no cleanup needed.
    if (url.includes('bySearch-myQueryID')) return 'myQueryID';
    // deny redirect / empty location → feature point disabled for this account
    return null;
  }

  // Best-effort deletion of a search query created by buildAdhocQuery (keeps the server clean —
  // ad-hoc queries are temporary by design). Returns true on success; false is not an error.
  async deleteQuery(queryID: number): Promise<boolean> {
    try {
      await this.ensureLogin();
      const res = await this._get(this.config.baseUrl + '/search-deleteQuery-' + queryID + '.html', { 'X-Requested-With': 'XMLHttpRequest' });
      const text = await res.text();
      return text.trim() === 'success' || /success/i.test(text.slice(0, 40));
    } catch {
      return false;
    }
  }

  // Discover the search-field list for an entity from a search build-form fragment.
  // The fragment renders `var bugparams = { <field>: {operator, control, ...}, ... }` when the
  // search feature point is enabled (empty {} on restricted deployments — then validation is
  // skipped and the ad-hoc build itself fails with a feature_not_enabled downstream).
  parseSearchFieldParams(html: string): string[] {
    const m = html.match(/var\s+(?:bug|story|task)params\s*=\s*(\{[\s\S]*?\});/);
    if (!m) return [];
    const body = m[1];
    // Top-level entries look like:  fieldName: { ... }   (nested values are scalars)
    const keys: string[] = [];
    const re = /['\"]?([a-zA-Z_][a-zA-Z0-9_]*)['\"]?\s*:\s*\{/g;
    let mm: RegExpExecArray | null;
    while ((mm = re.exec(body)) !== null) if (!keys.includes(mm[1])) keys.push(mm[1]);
    return keys;
  }

  // Full per-field metadata from the same `var bugparams/storyparams = {...}` JSON: default
  // operator per field (title→include, stage→=, module→belong, version→>=, …), control type,
  // date flag (class:'date'), and the select value domain (incl. the 'null'=空 pseudo-value).
  // Used to default omitted operators and to reject values the deployment's own form would not
  // offer (the server would silently drop them). Empty object when the fragment has no params.
  parseSearchFieldMeta(html: string): Record<string, { operator: string; control: 'input' | 'select'; date: boolean; values?: string[] }> {
    const out: Record<string, { operator: string; control: 'input' | 'select'; date: boolean; values?: string[] }> = {};
    const m = html.match(/var\s+(?:bug|story|task)params\s*=\s*(\{[\s\S]*?\});/);
    if (!m) return out;
    try {
      const obj = JSON.parse(m[1]) as Record<string, any>;
      for (const [field, def] of Object.entries(obj)) {
        const d = def || {};
        const entry: { operator: string; control: 'input' | 'select'; date: boolean; values?: string[] } = {
          operator: typeof d.operator === 'string' && d.operator ? d.operator : '=',
          control: d.control === 'select' ? 'select' : 'input',
          date: d.class === 'date'
        };
        if (entry.control === 'select' && d.values && typeof d.values === 'object') {
          entry.values = Object.keys(d.values).filter(v => v !== '');
        }
        out[field] = entry;
      }
    } catch { /* non-JSON fragment → no meta */ }
    return out;
  }

  // Extract the cloud-configured option values embedded in a create-form page's JS.
  // Returns a flat map { optionValue: optionLabel } for all <option value='X'>Y</option>.
  // Use to validate/normalize user-supplied type/severity/pri/build against what the
  // cloud actually offers (so we never send a value the deployment doesn't define).
  async getCreateFormOptions(createPageUrl: string): Promise<OptionMap> {
    const res = await this._get(this.config.baseUrl + createPageUrl, { 'X-Requested-With': 'XMLHttpRequest' });
    const html = await res.text();
    const optRe = /<option[^>]*value='([^']*)'[^>]*>([^<]*)/g;
    const map: OptionMap = {};
    let m;
    while ((m = optRe.exec(html)) !== null) { if (!(m[1] in map)) map[m[1]] = m[2]; }
    return map;
  }

  // Resolve a build reference (id OR name like "trunk"/"主干"/"staging") to the value the
  // cloud's resolve/create form expects. Reads the product's builds from cloud config.
  // Returns '' if not found.
  async resolveBuildValue(productID: number, ref: string | number): Promise<string> {
    const builds = await this.getProductBuilds(productID);
    if (!builds.length) return '';
    const s = String(ref);
    const byId = builds.find(b => String(b.id) === s);
    if (byId) return String(byId.id) === 'trunk' ? 'trunk' : String(byId.id);
    const byName = builds.find(b => b.name === s || b.name === 'trunk' && s === '主干');
    if (byName) return String(byName.id);
    // special: 主干/trunk maps to the trunk build value
    if (s === '主干' || s === 'trunk' || s === 'Trunk') {
      const trunk = builds.find(b => b.name === 'trunk' || b.id === 'trunk');
      return trunk ? String(trunk.id) : 'trunk';
    }
    return '';
  }

  // POST a create/edit form as multipart/form-data (ZenTao create forms require this encoding).
  // attachments: optional local file paths, appended as 'files[]' — ZenTao associates them
  // with the object automatically (objectType/objectID filled server-side). Verified: the
  // edit form's <input type="file" name="files[]"> uploads inline with the form (≤50M/file).
  // Returns the parsed JSON response body: { result, message, locate } or { raw }.
  async postMultipartCreate(pageUrl: string, fields: Record<string, unknown>, attachments: string[] = []): Promise<{ status: number; location: string; data: Record<string, unknown> }> {
    const fs = await import('node:fs');
    const pathMod = await import('node:path');
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) {
      if (k === 'files[]') continue; // real attachments replace the empty placeholder
      fd.append(k, v == null ? '' : String(v));
    }
    for (const p of attachments) {
      if (!fs.existsSync(p) || !fs.statSync(p).isFile()) throw new Error('attachment not found: ' + p);
      const size = fs.statSync(p).size;
      if (size > 50 * 1024 * 1024) throw new Error('attachment exceeds 50M limit: ' + p);
      fd.append('files[]', new Blob([fs.readFileSync(p)]), pathMod.basename(p));
    }
    const headers = this._headers({ 'X-Requested-With': 'XMLHttpRequest' });
    delete headers['Content-Type']; // let FormData set the multipart boundary
    const res = await this._fetchWithTimeout(this.config.baseUrl + pageUrl, {
      method: 'POST', headers, body: fd, redirect: 'manual'
    });
    this._storeCookies(res);
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 300) }; }
    return { status: res.status, location: res.headers.get('location') || '', data };
  }

// Upload a local file to the ZenTao file store via the KindEditor ajaxUpload route —
  // the SAME route the bug/story edit pages' image button uses
  // (page config: uploadJson: createLink('file', 'ajaxUpload', 'uid=' + kuid)).
  //   POST /file-ajaxUpload.html?uid=<kuid>  multipart, file field 'imgFile'
  //   response: {"error":0,"url":"/file-read-<fileID>.<ext>"}
  // Returned urls are publicly readable (no session needed), so they render in the UI.
  //
  // SELF-VERIFY (verified live 2026-09-18): the FIRST upload right after a fresh login can be
  // silently stored as a 0-byte file under a wrong extension (.txt) while the response is still
  // error:0 — the embedded image then renders broken. A re-upload seconds later succeeds. So
  // every upload is verified after the fact (anonymous GET of the returned URL must return 200
  // and be byte-identical); on mismatch the kuid is re-fetched and the upload retried (max 3).
  // If all attempts fail, a descriptive error is thrown instead of embedding a broken URL.
  // @param localPath  local file to upload (must exist)
  // @param kuidPage   any authenticated form/view page on the site used to extract the
  //                   anti-CSRF kuid (e.g. '/bug-view-123.html'). View pages are lightest.
  async uploadFile(localPath: string, kuidPage: string): Promise<{ fileID: number; url: string; absUrl: string }> {
    const fs = await import('node:fs');
    const path = await import('node:path');
    if (!fs.existsSync(localPath) || !fs.statSync(localPath).isFile()) {
      throw new Error('uploadFile: local file not found: ' + localPath);
    }
    const r = await this.uploadBuffer(fs.readFileSync(localPath), path.basename(localPath), kuidPage);
    return { fileID: r.fileID, url: r.url, absUrl: r.absUrl };
  }

  // Core upload: buffer + filename. Same self-verify/retry contract as uploadFile.
  // Exposed so callers can upload in-memory buffers (e.g. the pre-create warm-up upload that
  // absorbs the first-upload-after-login failure before a form carrying real attachments).
  async uploadBuffer(buf: Buffer, fname: string, kuidPage: string): Promise<{ fileID: number; url: string; absUrl: string; attempts: number }> {
    await this.ensureLogin();
    // 5 attempts with exponential backoff (2s/4s/8s/16s; attempts at ~0/2/6/14/30s):
    // the server's poison window (first-after-login uploads stored 0-byte .txt) has been
    // observed to outlast 10s — a re-upload 12s later on bug 20630 recovered while 5
    // attempts finishing at ~10s all failed (2026-09-21 live data).
    const MAX_ATTEMPTS = 5;
    let lastDiag = '';
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      // 1. extract anti-CSRF kuid from an authenticated page (fresh per attempt)
      let kuid = '';
      try {
        const r = await this._get(this.config.baseUrl + kuidPage);
        const html = await r.text();
        kuid = html.match(/var kuid = '([a-f0-9]+)'/)?.[1] || '';
      } catch (e) {
        if (attempt === MAX_ATTEMPTS) throw new Error('uploadFile: cannot fetch kuid from ' + kuidPage + ': ' + String(e));
      }
      if (!kuid) throw new Error('uploadFile: could not extract kuid from ' + kuidPage + ' (page layout changed?)');
      // 2. multipart upload
      const fd = new FormData();
      fd.append('uid', kuid);
      fd.append('imgFile', new Blob([new Uint8Array(buf)]), fname); // Uint8Array copy: tsgo rejects Buffer params as BlobPart
      const headers = this._headers({ 'X-Requested-With': 'XMLHttpRequest' });
      delete headers['Content-Type']; // let FormData set the multipart boundary
      const res = await this._fetchWithTimeout(this.config.baseUrl + '/file-ajaxUpload.html?uid=' + kuid, {
        method: 'POST', headers, body: fd, redirect: 'manual'
      });
      this._storeCookies(res);
      const text = await res.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 200) }; }
      if (!data || data.error) {
        throw new Error('uploadFile failed for ' + fname + ': ' + JSON.stringify(data).slice(0, 200));
      }
      const url = String(data.url || '');
      if (!url) throw new Error('uploadFile: no url in response: ' + JSON.stringify(data).slice(0, 200));
      // 3. VERIFY: anonymous GET of the returned URL — must be publicly readable (NO Cookie
      //    header on purpose: embedded images must render for any viewer) and byte-identical.
      let verified = false;
      let diag = '';
      try {
        const absUrl = url.startsWith('http') ? url : this.config.baseUrl + url;
        const chk = await this._fetchWithTimeout(absUrl, { headers: { 'Accept': 'image/*, application/octet-stream, */*' }, redirect: 'follow' });
        const chkBuf = Buffer.from(await chk.arrayBuffer());
        verified = chk.status === 200 && chkBuf.length === buf.length && chkBuf.equals(buf);
        diag = 'status=' + chk.status + ' bytes=' + chkBuf.length + '/' + buf.length + ' ctype=' + (chk.headers.get('content-type') || 'none');
      } catch (e) {
        diag = 'verify fetch failed: ' + (e as Error).message.slice(0, 100);
      }
      if (verified) {
        this.uploadWarmed = true;
        const m = url.match(/file-read-(\d+)/);
        return { fileID: m ? Number(m[1]) : 0, url, absUrl: url.startsWith('http') ? url : this.config.baseUrl + url, attempts: attempt };
      }
      lastDiag = 'url=' + url + ' ' + diag;
      this._log('uploadFile: verify FAILED (attempt ' + attempt + '/' + MAX_ATTEMPTS + '): ' + lastDiag + ' — retrying');
      if (attempt < MAX_ATTEMPTS) await new Promise((r2) => setTimeout(r2, 2000 * 2 ** (attempt - 1))); // exponential: 2s/4s/8s/16s
    }
    throw new Error('uploadFile: server accepted the upload but the file is not retrievable at the returned url (embedding it would show a broken image). last attempt: ' + lastDiag + ' — the server\'s first-upload-after-login poison window is still open; wait a few minutes or start a fresh MCP session and retry the call; nothing was embedded.');
  }

  // Fetch ALL rows of a paginated browse via the URL-path pagination this deployment uses.
  // Route format: <base>-<recTotal>-<recPerPage>-<page>.json
  // base should be the full browse path WITHOUT the trailing recTotal/recPerPage/page, e.g.
  //   /bug-browse-20-0-unclosed-0-id_desc
  //   /my-story-browse-id_desc
  // Returns { rows, recTotal, pagesFetched, pageRecTotal }.
  // In-process TTL cache (default 60s) so repeated full scans within one session are instant.
  async fetchAllPaginated(baseRoute: string, { rowKey, perPage = 1000, maxPages = 20, urlTemplate, cacheTTL = 60000 }: FetchAllOpts): Promise<FetchAllResult> {
    await this.ensureLogin();
    // Cache key includes perPage+maxPages: a partial scan (small maxPages) must never be
    // served as the result of a fuller scan (larger maxPages) — that would return stale partial data.
    const ck = baseRoute + '|' + rowKey + '|' + perPage + '|' + maxPages;
    if (cacheTTL > 0 && this._fetchAllCache) {
      const hit = this._fetchAllCache.get(ck);
      if (hit && (Date.now() - hit.ts) < cacheTTL) return { ...hit.val, cached: true };
    } else if (cacheTTL > 0 && !this._fetchAllCache) {
      this._fetchAllCache = new Map();
    }
    // urlTemplate (optional) overrides the default "<base>-<recTotal>-<perPage>-<page>" pattern.
    // Use {recTotal},{perPage},{page} placeholders. E.g. bySearch uses a double dash:
    //   "/bug-browse-20-0-bySearch-200--{recTotal}-{perPage}-{page}"
    const pageUrl = (rt: number, pp: number, pg: number): string => urlTemplate
      ? this.config.baseUrl + urlTemplate.replace('{recTotal}', String(rt)).replace('{perPage}', String(pp)).replace('{page}', String(pg)) + '.json'
      : this.config.baseUrl + baseRoute + '-' + rt + '-' + pp + '-' + pg + '.json';
    // Cache eviction: bound the cache size to prevent unbounded memory growth in
    // long-running server processes. Evict the oldest entry when the cap is reached.
    if (cacheTTL > 0 && this._fetchAllCache && this._fetchAllCache.size >= (this._cacheMaxSize || 50)) {
      const oldestKey = this._fetchAllCache.keys().next().value;
      if (oldestKey !== undefined) this._fetchAllCache.delete(oldestKey);
    }
    // Step 1: get page 1 (plain) to discover recTotal.
    const firstUrl = this.config.baseUrl + baseRoute + '.json';
    const first = await this._parseJsonResponse(await (await this._get(firstUrl, { Accept: 'application/json' })).text());
    const pager0 = (first.pager || {}) as { recTotal?: number };
    const recTotal0 = pager0.recTotal || 0;
    const firstRows = first[rowKey];
    const firstList: Record<string, unknown>[] = Array.isArray(firstRows) ? firstRows as Record<string, unknown>[] : Object.values((firstRows || {}) as Record<string, Record<string, unknown>>);
    if (recTotal0 === 0 || !firstList.length) {
      const v: FetchAllResult = { rows: firstList, recTotal: recTotal0, pagesFetched: 1 };
      if (cacheTTL > 0 && this._fetchAllCache) this._fetchAllCache.set(ck, { ts: Date.now(), val: v });
      return v;
    }

    // If perPage covers everything, we already have it all (first page had min(perPage_default, recTotal) rows).
    // But first page used the server default (20). So re-fetch with explicit large perPage.
    const rows: Record<string, unknown>[] = [];
    const seen = new Set<string>();
    const addRow = (r: Record<string, unknown>): void => { const k = r.id != null ? String(r.id) : JSON.stringify(r).slice(0,80); if (!seen.has(k)) { seen.add(k); rows.push(r); } };
    let pagesFetched = 0;
    for (let page = 1; page <= maxPages; page++) {
      const url = pageUrl(recTotal0, perPage, page);
      let data: Record<string, unknown>;
      try {
        data = await this._parseJsonResponse(await (await this._get(url, { Accept: 'application/json' })).text());
      } catch (e) {
        // recTotal may have shifted; stop on error to avoid infinite loop.
        break;
      }
      if (!data || !data[rowKey]) break;
      const rv = data[rowKey];
      const list: Record<string, unknown>[] = Array.isArray(rv) ? rv as Record<string, unknown>[] : Object.values((rv || {}) as Record<string, Record<string, unknown>>);
      if (!list.length) break;
      for (const r of list) addRow(r);
      pagesFetched++;
      const gotThisPage = list.length;
      if (rows.length >= recTotal0 || gotThisPage < perPage) break; // done
    }
    const result: FetchAllResult = { rows, recTotal: recTotal0, pagesFetched, pageRecTotal: recTotal0 };
    if (cacheTTL > 0 && this._fetchAllCache) this._fetchAllCache.set(ck, { ts: Date.now(), val: result });
    return result;
  }

}
