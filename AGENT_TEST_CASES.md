# ZenTao Legacy MCP — Agent 对话场景测试用例

用**自然语言 prompt 驱动 MCP 工具**的端到端测试。模拟真人对 AI agent 说一句话，
agent 应路由到正确的禅道 MCP 工具并返回符合语义的结果。

> 前置：本 MCP 已按 README 接入 agent（Claude Desktop / Codex / DeepSeek IDE）。
> 测试分**三级判定**：
> - **意图路由**（intent）— agent 是否选对了工具
> - **工具返回**（tool）— 工具调用是否成功、数据结构是否符合预期
> - **语义验收**（semantic）— 人/LLM 对照 prompt 复核回复是否答到点上

---

## 快速运行（自动化）

```bash
# 只读场景（安全，默认）
ZENTAO_BASE_URL=... ZENTAO_ACCOUNT=... ZENTAO_PASSWORD=*** node test/run_agent_tests.mjs

# 含写操作（会在线上创建测试 Bug/需求，结尾打印 ID 供清理）
ZENTAO_BASE_URL=... ZENTAO_ACCOUNT=... ZENTAO_PASSWORD=*** node test/run_agent_tests.mjs --apply
```

或**手动**：把下面每个"Agent Prompt"逐句粘贴进你的 agent 对话框，对照"期望调用工具 + 验收标准"人工判定。

---

## 只读场景（8 个，已实测全过）

### A-01 会话健康检查
- **Agent Prompt**：`帮我确认下禅道登录状态正不正常`
- **期望调用工具**：`zentao_whoami`
- **验收标准**：明确告知"已登录/会话正常"，给出账号名；异常则提示重登。

### A-02 产品列表
- **Agent Prompt**：`看看我们有哪些还没关闭的产品，列一下名字`
- **期望调用工具**：`zentao_product_list` (status=open)
- **验收标准**：以列表列出所有未关闭产品名称（≥1），不含已关闭产品。

### A-03 产品详情（负责人/代码）
- **Agent Prompt**：`主产品这个产品的负责人是谁？代码是什么？`
- **期望调用工具**：`zentao_product_get` (productID=20)
- **验收标准**：给出产品代码与产品负责人(PO)账号；PO 为空应说明"未设置"。

### A-04 Bug 概览（数量+标题）
- **Agent Prompt**：`主产品现在有多少个没关闭的 bug？把前几个标题给我`
- **期望调用工具**：`zentao_bug_list` (productID=20, status=unclosed)
- **验收标准**：给出未关闭 bug 总数，并列出前几条标题（带 id），条数与总数自洽。

### A-05 按指派人过滤 Bug
- **Agent Prompt**：`主产品里指派给 <某账号> 的未关闭 bug 有哪些？`
- **期望调用工具**：`zentao_bug_list` (productID=<主产品ID>, assignedTo=<某账号>)
- **验收标准**：**只**返回 assignedTo=<某账号> 的未关闭 bug；无则明说"没有"，不得混入他人。
- ⚠️ 本部署服务端忽略 assignedTo 查询参数，MCP 已改为客户端过滤——验证过滤确实生效。

### A-06 Bug 详情 + 历史
- **Agent Prompt**：`帮我看下 20477 号这个 bug 的详情，包括它的处理历史`
- **期望调用工具**：`zentao_bug_get` (bugID=20477)
- **验收标准**：给出标题/状态/严重度，并按时间列出处理历史（谁在何时做了什么）；无历史应说明。

### A-07 需求概览
- **Agent Prompt**：`主产品现在有多少个需求？挑最近的两个给我看看`
- **期望调用工具**：`zentao_story_list` (productID=20)
- **验收标准**：给出该产品需求总数（>0），并展示其中两条标题+状态。
- 注：本部署 story-browse 被禁，MCP 自动改用 my-story-browse 翻页过滤。

### A-08 按严重度过滤 Bug
- **Agent Prompt**：`主产品 里严重程度为 1（致命）的未关闭 bug 有吗？`
- **期望调用工具**：`zentao_bug_list` (productID=20, severity=1)
- **验收标准**：**只**返回 severity=1 的未关闭 bug；无则明说"没有致命级别"，不得返回其他严重度。
- ⚠️ 同 A-05，severity 为客户端过滤。

---

## 写操作场景（5 个，--apply 才执行，会留线上数据）

### A-09 提 Bug
- **Agent Prompt**：`提一个 bug：标题"测试-列表页分页组件点击后白屏"，复现步骤是"1.打开列表页 2.点击下一页 3.页面白屏"，严重程度3`
- **期望调用工具**：`zentao_bug_create` (productID=<主产品ID>, moduleID=自动取, title/steps/severity)
- **验收标准**：确认创建成功并给新 bug id；标题/复现步骤/指派人应与描述一致。

### A-10 解决 Bug（设计如此）
- **Agent Prompt**：`把刚创建的那个测试 bug 标记为"设计如此"并加一句"符合预期行为"`
- **期望调用工具**：`zentao_bug_resolve` (bugID=A-09 的新 id, resolution=bydesign, comment)
- **验收标准**：A-09 的 bug 置为已解决，解决方案=bydesign，备注含"符合预期行为"。
- 注：依赖 agent 记住"刚创建的"=A-09 的 id（上下文延续）。

### A-11 关闭 Bug
- **Agent Prompt**：`确认这个 bug 没问题，关闭它`
- **期望调用工具**：`zentao_bug_close` (bugID=A-09 的新 id)
- **验收标准**：A-09 的 bug 状态置为 closed；再查详情应见 closed。

### A-12 建需求
- **Agent Prompt**：`给 主产品 建一个需求：标题"支持按空间维度筛选渲染结果"，描述"允许用户选择空间后只看该空间的渲染输出"，预估 2 小时`
- **期望调用工具**：`zentao_story_create` (productID=20, title/spec/estimate=2)
- **验收标准**：确认创建成功并给新 id；标题/描述/预估工时应与描述一致。

### A-13 更新需求描述
- **Agent Prompt**：`把刚建的那个需求的描述补充一句"需要和后端确认接口字段"`
- **期望调用工具**：`zentao_story_update` (storyID=A-12 的新 id, spec=原文+追加)
- **验收标准**：A-12 需求的 spec 更新后包含"需要和后端确认接口字段"。
- 注：同样依赖上下文延续（记住 A-12 的 id）。

---

## 判定说明

| 标记 | 含义 |
|------|------|
| intent✓ | agent 路由到正确工具 |
| tool✓ | 工具调用成功且结构符合预期 |
| sem✓ | 语义验收确定性子检查通过 |
| sem? | 需 LLM/人工对照 prompt 复核（自动检查覆盖不到的语义细节） |

自动化运行器对确定性字段（id 匹配、数组非空、过滤字段一致性）自动判 sem✓/sem✗；
对"回复措辞是否到位""是否只答了该答的"这类纯语义，标记 sem?，由你或 LLM judge 复核。

## 上下文延续场景（A-10/A-11/A-13）特别说明

这三个 prompt 用"刚创建的""这个"指代前一条，**验证 agent 的跨轮上下文记忆**：
- 能否把"刚创建的 bug"正确解析为 A-09 返回的 newBugID
- 能否把"刚建的需求"正确解析为 A-12 返回的 newStoryID

手动测试时按 A-09→A-10→A-11（Bug 链）、A-12→A-13（需求链）顺序在同一会话内连续发送。

## 搜索 / 计划 / 测试栏目场景（A-14 ~ A-20）

覆盖 2026-09 新增的服务端搜索、产品计划、测试用例等模块。

| ID | Agent Prompt | 预期工具 | 验收 |
|----|-------------|---------|------|
| A-14 | 我保存了哪些 bug 搜索条件？列一下名字和编号 | zentao_bug_saved_queries | 返回 queryID+标题列表（≥1），编号与名称对应 |
| A-15 | 用我保存的"验收"这个搜索条件查一下 主产品，看看有多少条，给我前 3 个 | zentao_bug_saved_queries → zentao_bug_search | 先按标题解析 queryID，再执行搜索；total 为该查询真实完整数；前 3 条标题 |
| A-16 | 用我保存的"验收"需求查询搜一下 主产品，有多少条？前 2 个是什么 | zentao_story_saved_queries → zentao_story_search | 服务端需求搜索（mode=server）；total 完整数；前 2 条 |
| A-17 | 主产品 里描述或标题带"封装"的需求有哪些？ | zentao_story_search | 客户端全扫关键词"封装"；total 完整匹配数；结果含"封装" |
| A-18 | 主产品 现在有哪些迭代/产品计划？列最近的 3 个，带日期 | zentao_productplan_list | total 完整数；前 3 个含标题+起止日期 |
| A-19 | 主产品 有多少个测试用例？给我前 3 个标题 | zentao_testcase_list | total=完整数（438 左右）；前 3 条标题 |
| A-20 | 看下第一个测试用例的详情，包括前置条件和步骤 | zentao_testcase_get | 返回用例详情，含 precondition + steps |

**要点**：
- A-15/A-16 演示"保存查询→按 queryID 服务端搜索"的高效路径（避免全量拉取无关数据）。
- A-17 演示客户端关键词全扫（当没有对应保存查询时的兜底）。
- A-18~A-20 覆盖产品栏目（计划）和测试栏目（用例）的新模块，均为全量分页（total 是完整数，非第一页）。
- 测试单/报告/套件（zentao_testtask/testreport/testsuite_list）当前该产品下为 0 条，故未列入对话场景（工具已实现可用）。

## 任务 / 模块 / 版本 / 执行场景（A-21 ~ A-30）

覆盖 2026-09 新增的任务全生命周期、模块 CRUD、版本/执行管理。

| ID | Agent Prompt | 预期工具 | 验收 |
|----|-------------|---------|------|
| A-21 | 在筑星云国际站点建一个开发任务：标题"修复登录页验证码不刷新"，指派给我，预计 4 小时 | zentao_task_create (projectID=42, name/type=devel/assignedTo/estimate=4) | 返回 newTaskID；task-browse 可见 |
| A-22 | 开始刚建的那个任务 | zentao_task_start (taskID=A-21) | status→doing；left=estimate |
| A-23 | 刚建的任务记一条日志：完成了 2 小时开发，还剩 2 小时 | zentao_task_log_add (taskID=A-21, consumed=2, left=2) | 日志写入；task left→2 |
| A-24 | 把刚建的任务优先级改成 1（紧急） | zentao_task_update (taskID=A-21, pri=1) | pri→1；其他字段不变 |
| A-25 | 完成刚建的任务 | zentao_task_finish (taskID=A-21, consumed=remaining) | status→done；closedDate 有值 |
| A-26 | 主产品 的故事模块下建一个叫"MCP 流程测试"的模块 | zentao_module_create (productID=20, name, type=story) | 返回 newModuleID；三棵树可见 |
| A-27 | 在"MCP 流程测试"模块下建一个子模块叫"子功能" | zentao_module_create (productID=20, name, parentID=A-26, type=story) | 返回 newModuleID；parent=A-26 |
| A-28 | 把"MCP 流程测试"模块改名为"MCP 流程测试-已改名" | zentao_module_rename (productID=20, moduleID=A-26, name) | 名称更新；子模块不受影响 |
| A-29 | 删掉"MCP 流程测试-已改名"模块（连同子模块） | zentao_module_delete dry_run→confirm (productID=20, moduleID=A-26) | 二次确认；模块+子模块均消失 |
| A-30 | 主产品 建一个版本：名字"MCP 测试版本"，关联 主产品 产品 | zentao_build_create (projectID=42, name, productID=20) | 返回 newBuildID；build-browse 可见 |

## 富文本场景（A-31 ~ A-36）

验证需求/Bug 的富文本 HTML 字段（KindEditor）。覆盖全部 15 种标签。

### 标签覆盖矩阵

| 标签 | A-31 story.spec | A-31 story.verify | A-32 bug.steps | A-33 story_change | A-34 bug_update |
|------|:-:|:-:|:-:|:-:|:-:|
| `<b>` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `<i>` | ✅ | — | ✅ | — | — |
| `<u>` | — | — | ✅ | ✅ | — |
| `<ol>` | ✅ | ✅ | ✅ | ✅ | — |
| `<ul>` | ✅ | — | ✅ | — | — |
| `<li>` | ✅ | ✅ | ✅ | ✅ | — |
| `<p>` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `<br>` | ✅ | — | ✅ | — | — |
| `<code>` | ✅ | — | ✅ | — | ✅ |
| `<a>` | ✅ | — | — | — | — |
| `<img>` | ✅ | — | ✅ | — | — |
| `<table>` | ✅ | — | — | — | — |
| `<blockquote>` | ✅ | — | — | ✅ | — |
| `<hr>` | ✅ | — | — | — | — |
| `<font>` | ✅ | — | ✅ | — | — |

| ID | Agent Prompt | 预期工具 | 验收 |
|----|-------------|---------|------|
| A-31 | 给 主产品 建一个需求，标题"富文本全标签测试"，描述用 15 种标签 HTML（含真实图片），验收标准用 4 种标签 HTML | zentao_story_create (productID=20, title, spec=HTML, verify=HTML) | 返回 newStoryID；spec 含 15/15 标签 + 真实图片；verify 含 `<b> <ol> <li>`。测完关闭此需求（临时实体，不保留）。✅ 实测 9350 |
| A-32 | 把通用测试 Bug 20494 的重现步骤改成 15 种标签 HTML（含真实图片） | zentao_bug_update (bugID=20494, steps=HTML) | bug-view JSON 的 steps 含 15/15 标签 + 真实图片。✅ 实测 20494 |
| A-33 | 对 A-31 的需求做变更，描述追加 `<u>` `<blockquote>` `<font>` 三种标签 | zentao_story_change (storyID=A-31, spec=原HTML+追加) | spec 同时含原文 + 新增标签。⚠️ story_update **不能**改 spec/verify，必须走需求变更 |
| A-34 | 把 Bug 20494 的步骤改成纯文本：`1.打开列表 2.翻页 3.白屏` | zentao_bug_update (bugID=20494, steps=纯文本) | steps 不含 HTML 标签 |
| A-35 | 把 Bug 20494 的步骤改回富文本（恢复 A-32 的 HTML） | zentao_bug_update (bugID=20494, steps=HTML) | steps 恢复 15 种标签 |
| A-36 | 查看通用测试需求 9344 的详情，确认 spec 格式 | zentao_story_get (storyID=9344) | 返回的 spec 字段为纯文本或 HTML（取决于最后变更） |

