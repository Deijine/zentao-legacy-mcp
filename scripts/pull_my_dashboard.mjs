#!/usr/bin/env node
// Pull "my dashboard" (我的地盘) data through the installed zentao-legacy-mcp binary and write
// a JSON + per-section CSV bundle for external dashboard/app integration.
//
//   node scripts/pull_my_dashboard.mjs
//
// One MCP session login, one zentao_my_dashboard call (~30-90s, scans all unclosed products).
// Output (default ~/.local/share/zentao-legacy-mcp/dashboard/):
//   my-dashboard.json   full raw payload (account/pulledAt/stories/bugs/tasks/projects/products/dynamic)
//   stories.csv bugs.csv tasks.csv projects.csv products.csv
//
// Env:
//   ZENTAO_MCP_BIN        path to the MCP binary (default ~/.local/bin/zentao-legacy-mcp.js)
//   ZENTAO_DASHBOARD_OUT  output directory
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const MCP_BIN = process.env.ZENTAO_MCP_BIN || path.join(os.homedir(), '.local', 'bin', 'zentao-legacy-mcp.js');
const OUT = process.env.ZENTAO_DASHBOARD_OUT || path.join(os.homedir(), '.local', 'share', 'zentao-legacy-mcp', 'dashboard');
if (!fs.existsSync(MCP_BIN)) {
  console.error('MCP binary not found: ' + MCP_BIN + ' (set ZENTAO_MCP_BIN)');
  process.exit(1);
}

const proc = spawn(process.execPath, [MCP_BIN], { stdio: ['pipe', 'pipe', 'pipe'] });
let buf = '';
const pending = new Map();
proc.stdout.on('data', (d) => {
  buf += d.toString();
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i); buf = buf.slice(i + 1);
    if (!line.trim()) continue;
    try {
      const m = JSON.parse(line);
      if (m.id !== undefined && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    } catch { /* non-JSON progress line */ }
  }
});
let nid = 0;
const call = (method, params) => new Promise((resolve, reject) => {
  const id = ++nid;
  pending.set(id, resolve);
  proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params: { name: method, arguments: params } }) + '\n');
  setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error('MCP call timed out')); } }, 600000);
});

const t0 = Date.now();
const r = await call('zentao_my_dashboard', {});
if (!r || !r.result) { console.error('MCP error:', JSON.stringify(r).slice(0, 300)); proc.kill(); process.exit(1); }
const d = JSON.parse(r.result.content[0].text).data;
if (!d) { console.error('no data:', r.result.content[0].text.slice(0, 300)); proc.kill(); process.exit(1); }
proc.kill();

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'my-dashboard.json'), JSON.stringify(d, null, 1));

const esc = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return '"' + s.replace(/"/g, '""') + '"';
};
const writeCsv = (name, rows, cols) => {
  const lines = [cols.map(esc).join(',')]
    .concat(rows.map((row) => cols.map((c) => esc(row[c])).join(',')));
  fs.writeFileSync(path.join(OUT, name), lines.join('\r\n') + '\r\n');
  console.log('  ' + name + ': ' + rows.length + ' rows');
};
console.log('pulled in ' + ((Date.now() - t0) / 1000).toFixed(1) + 's -> ' + OUT);
console.log('  my-dashboard.json (' + JSON.stringify(d).length + ' bytes)');
writeCsv('stories.csv', d.stories.items, ['id', 'title', 'status', 'stage', 'category', 'pri', 'product', 'assignedTo', 'openedBy', 'openedDate', 'url']);
writeCsv('bugs.csv', d.bugs.items, ['id', 'title', 'status', 'severity', 'pri', 'type', 'product', 'module', 'assignedTo', 'openedBy', 'openedDate', 'resolution', 'url']);
writeCsv('tasks.csv', d.tasks.items, ['id', 'name', 'status', 'type', 'pri', 'project', 'story', 'estimate', 'consumed', 'left', 'deadline', 'assignedTo', 'url']);
writeCsv('projects.csv', d.projects.items, ['id', 'name', 'code', 'type', 'status', 'begin', 'end', 'url']);
writeCsv('products.csv', d.products.items, ['id', 'name', 'code', 'status', 'PO', 'QD', 'RD', 'url']);
console.log('counts: stories=' + d.stories.unclosed + ' bugs=' + d.bugs.unclosed + ' tasks=' + d.tasks.total + '(open ' + d.tasks.open + ') projects=' + d.projects.total + ' products=' + d.products.total);
if (d.warnings && d.warnings.length) console.log('warnings: ' + d.warnings.join(' | '));
