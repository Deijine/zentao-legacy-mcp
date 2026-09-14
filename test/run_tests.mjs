// Test runner: exercises all 13 tools over the real MCP stdio protocol.
//   node test/run_tests.mjs              -> READ cases only (safe)
//   node test/run_tests.mjs --apply      -> READ + WRITE cases (mutates live data)
// Env: ZENTAO_BASE_URL / ZENTAO_ACCOUNT / ZENTAO_PASSWORD required.

import { spawn } from 'node:child_process';
import { loadTestEnv } from './testenv.mjs';
const T = loadTestEnv();
import { READ_CASES, WRITE_CASES } from './cases/cases.mjs';

const APPLY = process.argv.includes('--apply');
if (!process.env.ZENTAO_BASE_URL || !process.env.ZENTAO_ACCOUNT || !process.env.ZENTAO_PASSWORD) {
  console.error('Set ZENTAO_BASE_URL / ZENTAO_ACCOUNT / ZENTAO_PASSWORD first.');
  process.exit(2);
}

const child = spawn('node', ['src/index.js'], { cwd: new URL('..', import.meta.url).pathname, env: process.env });
const pending = new Map();
let outBuf = '';
let stderrBuf = '';
child.stderr.on('data', d => stderrBuf += d);
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

await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'runner', version: '1' } });
notify('notifications/initialized');

async function call(tool, args) {
  const r = await rpc('tools/call', { name: tool, arguments: args || {} });
  if (r.result && r.result.isError) {
    return { __isError: true, text: r.result.content[0].text };
  }
  if (r.timeout) return { __timeout: true };
  try { return JSON.parse(r.result.content[0].text); } catch { return { __parseError: r.result.content[0].text.slice(0, 200) }; }
}

const results = [];
function record(id, name, pass, detail) {
  results.push({ id, name, pass, detail });
  console.log((pass ? 'PASS' : 'FAIL') + '  ' + id + '  ' + name + (pass ? '' : '  -> ' + detail));
}

// ---- Resolve dynamic args by doing real reads first ----
const who = await call('zentao_whoami', {});
record('R-01', 'whoami: session healthy', !who.__isError && !who.__timeout && who.data && who.data.loggedIn === true && who.data.sessionActive === true,
  JSON.stringify(who).slice(0, 120));

const pl = await call('zentao_product_list', { status: 'open' });
const plOk = !pl.__isError && !pl.__timeout && pl.data && Array.isArray(pl.data.products) && pl.data.products.length > 0;
record('R-02', 'product_list: open products', plOk, JSON.stringify(pl).slice(0, 120));
const product20 = plOk && pl.data.products.find(p => String(p.id) === '20');
const anyProduct = product20 || (plOk && pl.data.products[0]);

const pg = await call('zentao_product_get', { productID: T.productID });
record('R-03', 'product_get: primary product detail', !pg.__isError && !pg.__timeout && pg.data && String(pg.data.id) === String(T.productID) && pg.data.name, JSON.stringify(pg).slice(0, 120));

const bl = await call('zentao_bug_list', { productID: T.productID, status: 'unclosed' });
const blOk = !bl.__isError && !bl.__timeout && bl.data && Array.isArray(bl.data.bugs) && bl.data.bugs.length > 0;
record('R-04', 'bug_list: product 20 unclosed', blOk, JSON.stringify(bl).slice(0, 120));

const bg = await call('zentao_bug_get', { bugID: 20477 });
record('R-05', 'bug_get: bug 20477 detail + history', !bg.__isError && !bg.__timeout && bg.data && String(bg.data.id) === '20477' && bg.data.title && Array.isArray(bg.data.history), JSON.stringify(bg).slice(0, 120));

const sl = await call('zentao_story_list', { productID: T.productID });
const slOk = !sl.__isError && !sl.__timeout && sl.data && Array.isArray(sl.data.stories) && sl.data.stories.length > 0;
record('R-06', 'story_list: product 20 (via my-story-browse)', slOk, JSON.stringify(sl).slice(0, 120));

const firstStory = slOk ? sl.data.stories[0] : null;
if (firstStory) {
  const sg = await call('zentao_story_get', { storyID: Number(firstStory.id) });
  record('R-07', 'story_get: first product-20 story detail', !sg.__isError && !sg.__timeout && sg.data && sg.data.id && sg.data.title, JSON.stringify(sg).slice(0, 120));
} else {
  record('R-07', 'story_get: first product-20 story detail', false, 'no story to fetch (R-06 failed)');
}

// ---- WRITE cases (only with --apply) ----
let createdProductID = null, createdBugID = null, createdStoryID = null;
const moduleID = blOk ? Number(bl.data.bugs[0].module) : null;

if (APPLY) {
  // W-01 product create
  const ts = Date.now();
  const pc = await call('zentao_product_create', { name: 'MCP测试产品-' + ts, code: 'mcptest' + (ts % 100000), desc: 'MCP auto-test product', type: 'normal' });
  const pcOk = !pc.__isError && pc.data && pc.data.created === true && pc.data.newProductID != null;
  record('W-01', 'product_create: new test product', pcOk, JSON.stringify(pc).slice(0, 160));
  if (pcOk) createdProductID = pc.data.newProductID;

  // W-02 bug create (use product 20 + a real module)
  const bc = await call('zentao_bug_create', { productID: T.productID, moduleID: moduleID || 0, title: 'MCP测试Bug-' + ts, steps: '自动测试复现步骤\n1. 打开页面\n2. 观察\n预期：无', severity: 3, pri: 3, type: 'others' });
  const bcOk = !bc.__isError && bc.data && bc.data.created === true && bc.data.newBugID != null;
  record('W-02', 'bug_create: new test bug', bcOk, JSON.stringify(bc).slice(0, 160));
  if (bcOk) createdBugID = bc.data.newBugID;

  // W-03 bug resolve
  if (createdBugID) {
    const br = await call('zentao_bug_resolve', { bugID: createdBugID, resolution: 'bydesign', comment: 'MCP auto-test resolve' });
    record('W-03', 'bug_resolve: resolve created bug (bydesign)', !br.__isError && br.data && br.data.resolved === true, JSON.stringify(br).slice(0, 160));
    // W-04 bug close
    const bc2 = await call('zentao_bug_close', { bugID: createdBugID, comment: 'MCP auto-test close' });
    record('W-04', 'bug_close: close resolved bug', !bc2.__isError && bc2.data && bc2.data.closed === true, JSON.stringify(bc2).slice(0, 160));
  } else {
    record('W-03', 'bug_resolve: resolve created bug (bydesign)', false, 'no bug created (W-02 failed)');
    record('W-04', 'bug_close: close resolved bug', false, 'no bug created (W-02 failed)');
  }

  // W-05 story create
  const sc = await call('zentao_story_create', { productID: T.productID, title: 'MCP测试需求-' + ts, spec: '自动测试需求描述', estimate: 1, category: 'feature', pri: 3 });
  const scOk = !sc.__isError && sc.data && sc.data.created === true && sc.data.newStoryID != null;
  record('W-05', 'story_create: new test story', scOk, JSON.stringify(sc).slice(0, 160));
  if (scOk) createdStoryID = sc.data.newStoryID;

  // W-06 story update
  if (createdStoryID) {
    const su = await call('zentao_story_update', { storyID: createdStoryID, spec: '自动测试需求描述（已更新）' });
    record('W-06', 'story_update: update spec', !su.__isError && su.data && su.data.updated === true, JSON.stringify(su).slice(0, 160));
  } else {
    record('W-06', 'story_update: update spec', false, 'no story created (W-05 failed)');
  }
} else {
  console.log('\n[skip] WRITE cases W-01..W-06 — run with --apply to execute (mutates live data).');
}

// ---- Summary ----
const pass = results.filter(r => r.pass).length;
const fail = results.length - pass;
console.log('\n================ SUMMARY ================');
console.log('Total:', results.length, '  Pass:', pass, '  Fail:', fail, APPLY ? '  (APPLY mode)' : '  (READ-only mode)');
if (fail) console.log('Failing: ' + results.filter(r => !r.pass).map(r => r.id).join(', '));
if (APPLY && (createdProductID || createdBugID || createdStoryID)) {
  console.log('\nCreated test data (clean up manually or via tools):');
  if (createdProductID) console.log('  productID=' + createdProductID);
  if (createdBugID) console.log('  bugID=' + createdBugID + ' (resolved+closed)');
  if (createdStoryID) console.log('  storyID=' + createdStoryID);
}
console.log('\nSTDERR tail:', stderrBuf.trim().slice(-200) || '(none)');
child.kill();
process.exit(fail ? 1 : 0);
