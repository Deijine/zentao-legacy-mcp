import { spawn } from 'node:child_process';
import { loadTestEnv } from './testenv.mjs';
const T = loadTestEnv();

if (!process.env.ZENTAO_BASE_URL || !process.env.ZENTAO_ACCOUNT || !process.env.ZENTAO_PASSWORD) {
  console.error('Set ZENTAO_BASE_URL / ZENTAO_ACCOUNT / ZENTAO_PASSWORD env vars first.');
  process.exit(1);
}
const env = { ...process.env };

import { fileURLToPath } from 'node:url';
import path from 'node:path';
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const child = spawn('node', ['src/index.js'], { cwd: REPO_ROOT, env });
let stderrBuf = '';
child.stderr.on('data', d => { stderrBuf += d; });

const pending = new Map();
let outBuf = '';
child.stdout.on('data', d => {
  outBuf += d.toString();
  let idx;
  while ((idx = outBuf.indexOf('\n')) !== -1) {
    const line = outBuf.slice(0, idx).trim();
    outBuf = outBuf.slice(idx + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id !== undefined && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    } catch {}
  }
});

let nextId = 1;
function rpc(method, params) {
  return new Promise((resolve) => {
    const id = nextId++;
    pending.set(id, resolve);
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); resolve({ timeout: true }); } }, 60000);
  });
}
const notify = (method, params) => child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');

// 1. initialize
const init = await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
console.log('INIT serverInfo:', JSON.stringify(init.result && init.result.serverInfo), 'protocol:', init.result && init.result.protocolVersion);
notify('notifications/initialized');

// 2. list tools
const tools = await rpc('tools/list', {});
console.log('TOOLS count:', tools.result && tools.result.tools.length);
console.log('TOOLS:', tools.result.tools.map(t => t.name).join(', '));

// 3. whoami
const who = await rpc('tools/call', { name: 'zentao_whoami', arguments: {} });
console.log('WHOAMI:', who.result.content[0].text.slice(0, 200));

// 4. product list (open)
const pl = await rpc('tools/call', { name: 'zentao_product_list', arguments: { status: 'open' } });
const plp = JSON.parse(pl.result.content[0].text).data;
console.log('PRODUCTS total:', plp.total, 'first:', plp.products && plp.products[0] && plp.products[0].name);

// 5. bug list for product 20
const bl = await rpc('tools/call', { name: 'zentao_bug_list', arguments: { productID: T.productID, status: 'unclosed' } });
const blp = JSON.parse(bl.result.content[0].text).data;
console.log('BUGS(20) total:', blp.total, 'first:', blp.bugs && blp.bugs[0] && (blp.bugs[0].id + ' ' + blp.bugs[0].title));

child.kill();
console.log('STDERR:', stderrBuf.trim().slice(0, 300));
