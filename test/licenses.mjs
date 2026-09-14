import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const root = process.cwd() + '/node_modules';
const seen = new Map();
function walk(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (e.name === '.bin' || e.name === '.cache') continue;
    const p = join(dir, e.name);
    const pj = join(p, 'package.json');
    if (e.name.startsWith('@')) { walk(p); continue; }
    if (existsSync(pj)) {
      try {
        const d = JSON.parse(readFileSync(pj, 'utf8'));
        const lic = (d.license || (d.licenses && d.licenses[0] && d.licenses[0].type) || 'UNSPECIFIED').toString().toUpperCase();
        const key = d.name + '@' + d.version;
        if (!seen.has(key)) seen.set(key, lic);
      } catch {}
    }
  }
}
walk(root);
const counts = {};
for (const [name, lic] of seen) counts[lic] = (counts[lic]||0)+1;
console.log('Total packages:', seen.size);
console.log('License distribution:');
for (const [lic, n] of Object.entries(counts).sort((a,b)=>b[1]-a[1])) console.log('  ' + lic + ': ' + n);
// Flag any non-permissive
const risky = [...seen.entries()].filter(([,l]) => !/^(MIT|ISC|BSD|Apache-2.0|0BSD|Python-2.0|BlueOak-1.0.0|CC0-1.0)$/.test(l));
console.log('\nNon-standard licenses (review):');
for (const [name, lic] of risky) console.log('  ' + name + ' -> ' + lic);
