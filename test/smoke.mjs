// Smoke test: login + a few read calls against the live instance.
import { ZentaoClient, hashPassword } from '../src/client.js';

const base = process.env.ZENTAO_BASE_URL;
const account = process.env.ZENTAO_ACCOUNT;
const password = process.env.ZENTAO_PASSWORD;

if (!base || !account || !password) {
  console.error('Set ZENTAO_BASE_URL / ZENTAO_ACCOUNT / ZENTAO_PASSWORD env vars first.');
  process.exit(1);
}
const c = new ZentaoClient({ baseUrl: base, account, password, keepLogin: true, debug: false });

// 1. Login
await c.ensureLogin(true);
console.log('loggedIn =', c.loggedIn, 'sid =', (c.zentaosid || '').slice(0, 10) + '...');

// 3. Read product list (v1-style view)
const products = await c.viewJson('/product-browse-0.json');
console.log('product-browse keys:', Object.keys(products).slice(0, 10).join(','));
const pstats = products.productStats || products.products || [];
if (Array.isArray(pstats)) console.log('product count:', pstats.length, 'first:', pstats[0] && (pstats[0].name || pstats[0]));

// 4. Read a specific bug detail
const bug = await c.viewJson('/bug-view-20477.json');
const b = bug.bug || {};
console.log('bug 20477:', b.id, '-', b.title, 'status=' + b.status);
