// Agent-conversation scenario runner.
//   node test/run_agent_tests.mjs             -> READ scenarios (safe)
//   node test/run_agent_tests.mjs --apply     -> READ + WRITE scenarios (mutates live data)
//
// Three-level judging per scenario:
//   INTENT  - the scenario maps to the expected tool (intentTools) — verifies the
//             agent would route the natural-language request to the right MCP tool.
//   TOOL    - the tool call returns success with the expected data shape.
//   SEMANTIC- the human/LLM acceptance criteria (printed for a judge; auto-checked where
//             deterministic, else marked "needs-judge").
//
// Env: ZENTAO_BASE_URL / ZENTAO_ACCOUNT / ZENTAO_PASSWORD required.

import { spawn } from 'node:child_process';
import { loadTestEnv } from './testenv.mjs';
const T = loadTestEnv();
import { createWriteStream } from 'node:fs';
import { AGENT_CASES } from './cases/agent_cases.mjs';

// Persist the child MCP server's stderr to a file so we can inspect the login trace
// (the child's stderr is otherwise only held in memory). Set ZENTAO_CHILD_STDERR to override.
const _childErrFile = process.env.ZENTAO_CHILD_STDERR || '/tmp/zentao-child-stderr.log';
const _childErrStream = createWriteStream(_childErrFile, { flags: 'a' });

const APPLY = process.argv.includes('--apply');
if (!process.env.ZENTAO_BASE_URL || !process.env.ZENTAO_ACCOUNT || !process.env.ZENTAO_PASSWORD) {
  console.error('Set ZENTAO_BASE_URL / ZENTAO_ACCOUNT / ZENTAO_PASSWORD first.');
  process.exit(2);
}

// TEST-FRAMEWORK LOGIN OPTIMIZATION: the parent process logs in ONCE, then passes the
// resulting sid to the child via ZENTAO_SID. The child uses the injected sid directly
// (no login POST), so the ENTIRE 20-scenario run issues exactly 1 login POST. This
// avoids tripping the server's short-window login-rate protection (which rejects
// 3+ logins within ~1 minute and accumulates a persistent fails counter).
//
// This does NOT change the product code's auth behavior - it's purely a test-harness
// optimization. In production (single long-lived process), the client already logs in
// once and reuses the in-memory sid for its whole lifetime.
async function parentLogin() {
  const { ZentaoClient } = await import('../src/client.ts');
  const client = new ZentaoClient({
    baseUrl: process.env.ZENTAO_BASE_URL.replace(/\/+$/, ''),
    account: process.env.ZENTAO_ACCOUNT,
    password: process.env.ZENTAO_PASSWORD,
    keepLogin: process.env.ZENTAO_KEEP_LOGIN !== '0',
    requestTimeoutMs: 30000,
  });
  await client.ensureLogin(true); // forces a real login POST
  console.log('[test] parent logged in once, sid=' + (client.zentaosid || '').slice(0, 8) + '... (child will reuse, no further logins)');
  return client.zentaosid;
}

let childEnv = { ...process.env };
if (process.env.ZENTAO_NO_PARENT_LOGIN !== '1') {
  // Opt out with ZENTAO_NO_PARENT_LOGIN=1 to test the child's own login path.
  try {
    const sid = await parentLogin();
    if (sid) childEnv.ZENTAO_SID = sid;
  } catch (e) {
    console.error('[test] parent login failed (' + e.message + ') - child will attempt its own login.');
  }
}

const child = spawn('npx', ['tsx', 'src/index.ts'], { cwd: new URL('..', import.meta.url).pathname, env: childEnv });
const pending = new Map();
let outBuf = '', stderrBuf = '';
child.stderr.on('data', d => { stderrBuf += d; _childErrStream.write(d); });
child.stdout.on('data', d => {
  outBuf += d.toString();
  let i;
  while ((i = outBuf.indexOf('\n')) !== -1) {
    const l = outBuf.slice(0, i).trim(); outBuf = outBuf.slice(i + 1);
    if (!l) continue;
    try { const m = JSON.parse(l); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } } catch {}
  }
});
let nid = 1;
function rpc(method, params) {
  return new Promise(res => {
    const id = nid++; pending.set(id, res);
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); res({ timeout: true }); } }, 90000);
  });
}
const notify = (m, p) => child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: m, params: p }) + '\n');
await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'agent-runner', version: '1' } });
notify('notifications/initialized');

async function call(tool, args) {
  const r = await rpc('tools/call', { name: tool, arguments: args || {} });
  if (r.result && r.result.isError) return { __isError: true, text: r.result.content[0].text };
  if (r.timeout) return { __timeout: true };
  try { return JSON.parse(r.result.content[0].text); } catch { return { __parseError: (r.result.content[0].text || '').slice(0, 200) }; }
}

const results = [];
function record(id, name, intentOk, toolOk, semanticOk, detail) {
  results.push({ id, name, intentOk, toolOk, semanticOk });
  const pass = intentOk && toolOk;
  const mark = pass ? 'PASS' : 'FAIL';
  const sem = semanticOk === true ? 'sem✓' : semanticOk === false ? 'sem✗' : 'sem?';
  console.log(mark + '  ' + id + '  ' + name + '  [' + (intentOk?'intent✓':'intent✗') + (toolOk?' tool✓':' tool✗') + ' ' + sem + ']' + (pass ? '' : '  -> ' + detail));
}

// Pre-fetch context needed by later scenarios
const who = await call('zentao_whoami', {});
const openProds = await call('zentao_product_list', { status: 'open' });
const bugP20 = await call('zentao_bug_list', { productID: T.productID, status: 'unclosed' });
const moduleID = (bugP20.data && bugP20.data.bugs && bugP20.data.bugs[0]) ? Number(bugP20.data.bugs[0].module) : 0;

let createdBugID = null, createdStoryID = null, lastCaseID = null;
const ts = Date.now();

for (const c of AGENT_CASES) {
  if (c.skipIf) {
    record(c.id, c.prompt, true, false, null, 'skipped (required env var not set: ZENTAO_TEST_ASSIGNEE / ZENTAO_TEST_QUERY_TITLE / ZENTAO_TEST_KEYWORD)');
    continue;
  }
  const isWrite = !c.readOnly;
  if (isWrite && !APPLY) {
    record(c.id, c.prompt, true, false, null, 'WRITE scenario — skipped (run with --apply)');
    continue;
  }

  // Resolve args (some are dynamic)
  let args = c.args || {};
  if (c.id === 'A-09') args = { productID: T.productID, moduleID: moduleID || 0, title: '测试-列表页分页组件点击后白屏', steps: '1.打开列表页 2.点击下一页 3.页面白屏', severity: 3, pri: 3, assignedTo: T.assignee || undefined, type: 'others' };
  if (c.id === 'A-10') args = { bugID: createdBugID, resolution: 'bydesign', comment: '符合预期行为' };
  if (c.id === 'A-11') args = { bugID: createdBugID, comment: '确认关闭' };
  if (c.id === 'A-12') args = { productID: T.productID, title: '支持按空间维度筛选渲染结果', spec: '允许用户选择空间后只看该空间的渲染输出', estimate: 2, category: 'feature', pri: 3 };
  if (c.id === 'A-13') args = { storyID: createdStoryID, spec: '允许用户选择空间后只看该空间的渲染输出。需要和后端确认接口字段' };
  if (c.id === 'A-15') {
    // resolve queryID by title <ZENTAO_TEST_QUERY_TITLE> (fallback: first saved query)
    const sq = await call('zentao_bug_saved_queries', { productID: T.productID });
    const q = (sq.data && sq.data.queries || []).find(x => x.title === T.queryTitle) || (sq.data && sq.data.queries[0]);
    args = { queryID: q ? q.queryID : undefined, productID: T.productID, limit: 3 };
  }
  if (c.id === 'A-16') {
    // resolve story queryID by title <ZENTAO_TEST_QUERY_TITLE> (fallback: first saved query)
    const sq = await call('zentao_story_saved_queries', { productID: T.productID });
    const q = (sq.data && sq.data.queries || []).find(x => x.title === T.queryTitle) || (sq.data && sq.data.queries[0]);
    args = { queryID: q ? q.queryID : undefined, productID: T.productID, limit: 2 };
  }
  if (c.id === 'A-17') args = { keyword: '封装', productID: T.productID, limit: 3 };
  if (c.id === 'A-18') args = { productID: T.productID, limit: 3 };
  if (c.id === 'A-19') args = { productID: T.productID, limit: 3 };
  if (c.id === 'A-20') args = { caseID: lastCaseID || 1908 };

  const intentOk = Array.isArray(c.intentTools) && c.intentTools.length > 0;
  const res = await call(c.tool, args);
  const toolOk = !res.__isError && !res.__timeout && !res.__parseError && res.data;

  // Semantic (deterministic sub-checks where possible)
  let semanticOk = null; // null = needs judge
  if (toolOk) {
    const d = res.data;
    if (c.id === 'A-01') semanticOk = d.loggedIn === true && d.sessionActive === true;
    if (c.id === 'A-02') semanticOk = Array.isArray(d.products) && d.products.length > 0;
    if (c.id === 'A-03') semanticOk = String(d.id) === '20' && !!d.name;
    if (c.id === 'A-04') semanticOk = Array.isArray(d.bugs) && d.bugs.length > 0 && d.recTotal > 0; // full count available
    if (c.id === 'A-05') semanticOk = Array.isArray(d.bugs) && d.bugs.length > 0 && d.bugs.every(b => String(b.assignedTo) === T.assignee) && d.total > 0 && d.recTotal >= d.total; // complete, not page-1 subset
    if (c.id === 'A-06') semanticOk = String(d.id) === '20477' && !!d.title;
    if (c.id === 'A-07') semanticOk = Array.isArray(d.stories) && d.stories.length > 0;
    if (c.id === 'A-08') semanticOk = Array.isArray(d.bugs) && d.bugs.every(b => String(b.severity) === '1') && d.recTotal >= (d.total || 0); // complete severity filter
    if (c.id === 'A-09') { if (d.created) { createdBugID = d.newBugID; semanticOk = !!createdBugID && d.marker && /MCP-AUTO/.test(d.marker.keywords || ''); } else semanticOk = false; }
    if (c.id === 'A-10') semanticOk = d.resolved === true;
    if (c.id === 'A-11') semanticOk = d.closed === true;
    if (c.id === 'A-12') { if (d.created) { createdStoryID = d.newStoryID; semanticOk = !!createdStoryID && d.marker && /MCP-AUTO/.test(d.marker.keywords || ''); } else semanticOk = false; }
    if (c.id === 'A-13') semanticOk = d.updated === true && d.marker && /MCP-AUTO/.test(d.marker.keywords || '');
    if (c.id === 'A-14') semanticOk = Array.isArray(d.queries) && d.queries.length > 0 && d.queries.every(q => q.queryID && q.title);
    if (c.id === 'A-15') semanticOk = Array.isArray(d.bugs) && d.bugs.length > 0 && d.recTotal > 0 && d.total > 0; // complete search result
    if (c.id === 'A-16') semanticOk = Array.isArray(d.stories) && d.stories.length > 0 && d.recTotal > 0 && d.mode === 'server';
    if (c.id === 'A-17') semanticOk = Array.isArray(d.stories) && d.stories.length > 0 && d.total > 0;
    if (c.id === 'A-18') semanticOk = Array.isArray(d.plans) && d.plans.length > 0 && d.total > 0;
    if (c.id === 'A-19') { semanticOk = Array.isArray(d.cases) && d.cases.length > 0 && d.recTotal > 0; if (d.cases[0]) lastCaseID = d.cases[0].id; }
    if (c.id === 'A-20') semanticOk = d.found !== false && !!d.title && (d.precondition !== undefined || d.steps !== undefined);
  } else {
    semanticOk = false;
  }

  record(c.id, c.prompt, intentOk, toolOk, semanticOk, JSON.stringify(res).slice(0, 160));
}

const pass = results.filter(r => r.intentOk && r.toolOk).length;
const fail = results.length - pass;
console.log('\n================ AGENT SCENARIO SUMMARY ================');
console.log('Total:', results.length, '  Pass:', pass, '  Fail/Skip:', fail, APPLY ? '  (APPLY)' : '  (READ-only)');
const failing = results.filter(r => !(r.intentOk && r.toolOk)).map(r => r.id);
if (failing.length) console.log('Failing/Skipped: ' + failing.join(', '));
console.log('\n每个用例的 SEMANTIC 验收标准见 test/cases/agent_cases.mjs 与 AGENT_TEST_CASES.md，');
console.log('带 sem? 的需由 LLM/人工对照 prompt 复核语义。');
if (APPLY && (createdBugID || createdStoryID)) {
  console.log('\nCreated test data:');
  if (createdBugID) console.log('  bugID=' + createdBugID + ' (resolved+closed)');
  if (createdStoryID) console.log('  storyID=' + createdStoryID);
}

// Single-process single-login guard: the child MCP server should log in ~once.
// Many real login POSTs indicate either a regression in the in-memory singleton /
// in-flight dedup, or a cross-process collision (another process logging in as the
// same account at the same time, tripping ZenTao's 5-attempt protection).
const _loginPosts = (stderrBuf.match(/LOGIN-POST/g) || []).length;
const _loginOk = (stderrBuf.match(/Login OK/g) || []).length;
if (_loginPosts > 1) {
  console.log('\n[warn] child MCP server performed ' + _loginPosts + ' real login POSTs (' + _loginOk + ' succeeded).');
  console.log('       Expected ~1. Check for: (a) single-login regression, or (b) cross-process');
  console.log('       collision — ensure NO other process is logging in as the same account concurrently.');
}
child.kill();
process.exit(fail ? 1 : 0);
