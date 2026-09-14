// Test case definitions for the 13 implemented ZenTao MCP tools.
import { loadTestEnv } from '../testenv.mjs';
const T = loadTestEnv();
// READ cases are safe to run against the live instance.
// WRITE cases are DRY-RUN by default (assert the tool is callable & schema-valid) and only
// actually mutate when the runner is given { apply: true }.

export const READ_CASES = [
  {
    id: 'R-01',
    tool: 'zentao_whoami',
    args: {},
    name: 'whoami: session healthy',
    assert: (d) => d.data && d.data.loggedIn === true && d.data.sessionActive === true,
  },
  {
    id: 'R-02',
    tool: 'zentao_product_list',
    args: { status: 'open' },
    name: 'product_list: open products',
    assert: (d) => d.data && Array.isArray(d.data.products) && d.data.products.length > 0
      && d.data.products.every(p => p.id && p.name),
  },
  {
    id: 'R-03',
    tool: 'zentao_product_get',
    args: { productID: T.productID },
    name: 'product_get: primary product detail',
    assert: (d) => d.data && String(d.data.id) === String(T.productID) && d.data.name,
  },
  {
    id: 'R-04',
    tool: 'zentao_bug_list',
    args: { productID: T.productID, status: 'unclosed' },
    name: 'bug_list: product 20 unclosed',
    assert: (d) => d.data && Array.isArray(d.data.bugs) && d.data.bugs.length > 0
      && d.data.bugs.every(b => b.id && b.title),
  },
  {
    id: 'R-05',
    tool: 'zentao_bug_get',
    args: { bugID: 20477 },
    name: 'bug_get: bug 20477 detail + history',
    assert: (d) => d.data && d.data.id === '20477' && d.data.title && Array.isArray(d.data.history),
  },
  {
    id: 'R-06',
    tool: 'zentao_story_list',
    args: { productID: T.productID },
    name: 'story_list: product 20 (via my-story-browse)',
    assert: (d) => d.data && Array.isArray(d.data.stories) && d.data.stories.length > 0
      && d.data.stories.every(s => s.id && s.title),
  },
  {
    id: 'R-07',
    tool: 'zentao_story_get',
    args: null, // filled at runtime with first story id from R-06
    name: 'story_get: first product-20 story detail',
    assert: (d) => d.data && d.data.id && d.data.title,
  },
];

export const WRITE_CASES = [
  {
    id: 'W-01',
    tool: 'zentao_product_create',
    args: { name: 'MCP测试产品-' + Date.now(), code: 'mcptest' + (Date.now() % 10000), desc: 'MCP auto-test product', type: 'normal' },
    name: 'product_create: new test product',
    cleanupTool: 'zentao_product_close',
    assert: (d) => d.data && d.data.created === true && d.data.newProductID != null,
  },
  {
    id: 'W-02',
    tool: 'zentao_bug_create',
    args: null, // needs productID + moduleID from R-02/R-04 at runtime
    name: 'bug_create: new test bug',
    assert: (d) => d.data && d.data.created === true && d.data.newBugID != null,
  },
  {
    id: 'W-03',
    tool: 'zentao_bug_resolve',
    args: null, // needs newBugID from W-02
    name: 'bug_resolve: resolve the created bug (bydesign)',
    assert: (d) => d.data && d.data.resolved === true,
  },
  {
    id: 'W-04',
    tool: 'zentao_bug_close',
    args: null, // needs newBugID from W-02
    name: 'bug_close: close the resolved bug',
    assert: (d) => d.data && d.data.closed === true,
  },
  {
    id: 'W-05',
    tool: 'zentao_story_create',
    args: null, // needs productID 20
    name: 'story_create: new test story',
    assert: (d) => d.data && d.data.created === true && d.data.newStoryID != null,
  },
  {
    id: 'W-06',
    tool: 'zentao_story_update',
    args: null, // needs newStoryID from W-05
    name: 'story_update: append note to title',
    assert: (d) => d.data && d.data.updated === true,
  },
];
