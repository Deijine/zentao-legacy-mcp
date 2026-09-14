// Agent-conversation test scenarios for the ZenTao MCP tools.
// Test targets come from test/testenv.mjs (env-driven; no deployment-specific IDs in the repo).
import { loadTestEnv } from '../testenv.mjs';
const T = loadTestEnv();
// Each case simulates a human typing a natural-language request into an AI agent
// that has this MCP server connected. The runner checks three levels:
//   1. INTENT  — the agent picked the right tool(s) (intentTools)
//   2. TOOL    — the tool call succeeded and returned the expected shape
//   3. SEMANTIC— the human-level acceptance criteria (documented for LLM/human judge)

export const AGENT_CASES = [
  {
    id: 'A-01', tool: 'zentao_whoami', intentTools: ['zentao_whoami'],
    prompt: '帮我确认下禅道登录状态正不正常',
    expect: { loggedIn: true, sessionActive: true },
    semantic: '回复中应明确告知"已登录/会话正常"，并给出账号名；若异常应提示重新登录。',
    readOnly: true,
  },
  {
    id: 'A-02', tool: 'zentao_product_list', intentTools: ['zentao_product_list'],
    prompt: '看看我们有哪些还没关闭的产品，列一下名字',
    args: { status: 'open' },
    semantic: '应列出所有未关闭产品的名称（至少1个），以列表形式呈现，不含已关闭产品。',
    readOnly: true,
  },
  {
    id: 'A-03', tool: 'zentao_product_get', intentTools: ['zentao_product_get'],
    prompt: (T.productName ? T.productName + ' 这个产品' : '这个产品') + ' 的负责人是谁？代码是什么？',
    args: { productID: T.productID },
    semantic: '应给出产品代码和产品负责人(PO)账号；若 PO 为空应说明"未设置负责人"。',
    readOnly: true,
  },
  {
    id: 'A-04', tool: 'zentao_bug_list', intentTools: ['zentao_bug_list'],
    prompt: (T.productName ? T.productName : '这个产品') + ' 现在有多少个没关闭的 bug？把前几个标题给我',
    args: { productID: T.productID, status: 'unclosed' },
    semantic: '应给出未关闭 bug 的总数，并列出前几条的标题（带 id），数量应与总数一致。',
    readOnly: true,
  },
  {
    id: 'A-05', tool: 'zentao_bug_list', intentTools: ['zentao_bug_list'], skipIf: !T.assignee,
    prompt: '指派给 ' + T.assignee + ' 的未关闭 bug 有哪些？',
    args: { productID: T.productID, status: 'unclosed', assignedTo: T.assignee },
    semantic: '只列出 assignedTo=<T.assignee> 的未关闭 bug；若没有应明确说"没有指派给他的"，不能混入其他人的。',
    readOnly: true,
  },
  {
    id: 'A-06', tool: 'zentao_bug_get', intentTools: ['zentao_bug_get'],
    prompt: '帮我看下 20477 号这个 bug 的详情，包括它的处理历史',
    args: { bugID: 20477 },
    semantic: '应给出该 bug 的标题、状态、严重度，并按时间列出处理历史（谁在何时做了什么）；无历史应说明。',
    readOnly: true,
  },
  {
    id: 'A-07', tool: 'zentao_story_list', intentTools: ['zentao_story_list'],
    prompt: PN + ' 现在有多少个需求？挑最近的两个给我看看',
    args: { productID: T.productID },
    semantic: '应给出该产品的需求总数，并展示其中两条的标题+状态；总数应 >0。',
    readOnly: true,
  },
  {
    id: 'A-08', tool: 'zentao_bug_list', intentTools: ['zentao_bug_list'],
    prompt: '严重程度为 1（致命）的未关闭 bug 有吗？',
    args: { productID: T.productID, status: 'unclosed', severity: 1 },
    semantic: '只返回 severity=1 的未关闭 bug；若为空应明确"没有致命级别的未关闭 bug"，不能返回其他严重度。',
    readOnly: true,
  },
  // ---------- WRITE scenarios (default dry-run; --apply executes) ----------
  {
    id: 'A-09', skipIf: !T.assignee,  tool: 'zentao_bug_create', intentTools: ['zentao_bug_create'],
    prompt: '提一个 bug：标题"测试-列表页分页组件点击后白屏"，复现步骤是"1.打开列表页 2.点击下一页 3.页面白屏"，严重程度3' + (T.assignee ? '，指派给 ' + T.assignee : ''),
    args: null, // moduleID from A-04, assignedTo=T.assignee
    semantic: '应确认 bug 创建成功并给出新 bug 的 id；复现步骤与指派对象应与用户描述一致；返回的 marker.keywords 应含 MCP-AUTO 前缀（云端可据此筛选）。',
    readOnly: false,
  },
  {
    id: 'A-10', tool: 'zentao_bug_resolve', intentTools: ['zentao_bug_resolve'],
    prompt: '把刚创建的那个测试 bug 标记为"设计如此"并加一句"符合预期行为"',
    args: null, // bugID from A-09, resolution=bydesign
    semantic: '应将 A-09 创建的 bug 置为已解决，解决方案=bydesign，备注含"符合预期行为"。',
    readOnly: false,
  },
  {
    id: 'A-11', tool: 'zentao_bug_close', intentTools: ['zentao_bug_close'],
    prompt: '确认这个 bug 没问题，关闭它',
    args: null, // bugID from A-09
    semantic: '应将 A-09 的 bug 状态置为 closed；关闭后查详情应能看到 closed 状态。',
    readOnly: false,
  },
  {
    id: 'A-12', tool: 'zentao_story_create', intentTools: ['zentao_story_create'],
    prompt: '建一个需求：标题"测试-按维度筛选结果"，描述"允许用户选择维度后只看该维度的输出"，预估 2 小时',
    args: null, // productID=20, estimate=2
    semantic: '应确认需求创建成功并给新 id；标题/描述/预估工时应与用户描述一致；返回的 marker.keywords 应含 MCP-AUTO 前缀（云端可据此筛选）。',
    readOnly: false,
  },
  {
    id: 'A-13', tool: 'zentao_story_update', intentTools: ['zentao_story_update'],
    prompt: '把刚建的那个需求的描述补充一句"需要和后端确认接口字段"',
    args: null, // storyID from A-12, append to spec
    semantic: '应更新 A-12 需求的 spec，新描述应包含追加的"需要和后端确认接口字段"。',
    readOnly: false,
  },
  // ---------- SEARCH scenarios (server-side saved queries - the efficient path) ----------
  {
    id: 'A-14', tool: 'zentao_bug_saved_queries', intentTools: ['zentao_bug_saved_queries'],
    prompt: '我保存了哪些 bug 搜索条件？列一下名字和编号',
    args: { productID: T.productID },
    semantic: '应列出账号已保存的 bug 查询（queryID + 标题），至少 1 个；编号与名称一一对应。',
    readOnly: true,
  },
  {
    id: 'A-15', tool: 'zentao_bug_search', intentTools: ['zentao_bug_search', 'zentao_bug_saved_queries'], skipIf: !T.queryTitle,
    prompt: '用我保存的"' + (T.queryTitle || '某查询') + '"这个搜索条件查一下，看看有多少条，给我前 3 个',
    args: null, // resolve queryID by title <ZENTAO_TEST_QUERY_TITLE> from saved queries
    semantic: '应先用 saved_queries 找到 ZENTAO_TEST_QUERY_TITLE 指定查询的 queryID，再用 bug_search 执行；给出总数与前 3 条标题；总数应为该查询的真实完整数（非第一页）。',
    readOnly: true,
  },
  // ---------- STORY SEARCH / PLAN / TEST MODULES ----------
  {
    id: 'A-16', tool: 'zentao_story_search', intentTools: ['zentao_story_search', 'zentao_story_saved_queries'], skipIf: !T.queryTitle,
    prompt: '用我保存的"' + (T.queryTitle || '某查询') + '"需求查询搜一下，有多少条？前 2 个是什么',
    args: null, // resolve story queryID by title <ZENTAO_TEST_QUERY_TITLE>
    semantic: '应用 story_saved_queries 找到 ZENTAO_TEST_QUERY_TITLE 指定查询的 queryID，再 story_search 执行；总数应为该查询真实完整数；给出前 2 条标题。',
    readOnly: true,
  },
  {
    id: 'A-17', tool: 'zentao_story_search', intentTools: ['zentao_story_search'],
    prompt: '描述或标题带"' + (T.keyword || '某关键词') + '"的需求有哪些？',
    args: T.keyword ? { keyword: T.keyword, productID: T.productID, limit: 3 } : null, skipIf: !T.keyword,
    semantic: '应用 ZENTAO_TEST_KEYWORD 指定关键词做客户端全扫搜索；total 是完整匹配数；前几条标题/描述应含该关键词。',
    readOnly: true,
  },
  {
    id: 'A-18', tool: 'zentao_productplan_list', intentTools: ['zentao_productplan_list'],
    prompt: '现在有哪些迭代/产品计划？列最近的 3 个，带日期',
    args: { productID: T.productID, limit: 3 },
    semantic: '应返回产品计划列表，total 是完整数；前 3 个含标题+起止日期。',
    readOnly: true,
  },
  {
    id: 'A-19', tool: 'zentao_testcase_list', intentTools: ['zentao_testcase_list'],
    prompt: '有多少个测试用例？给我前 3 个标题',
    args: { productID: T.productID, limit: 3 },
    semantic: '应用 testcase_list 拉全量（应 438 左右），total 完整数；前 3 条标题。',
    readOnly: true,
  },
  {
    id: 'A-20', tool: 'zentao_testcase_get', intentTools: ['zentao_testcase_get'],
    prompt: '看下第一个测试用例的详情，包括前置条件和步骤',
    args: null, // caseID from A-19 first case
    semantic: '应用 testcase_get 返回用例详情，含 precondition + steps。',
    readOnly: true,
  },
];
