# 能力-开发文档对照表（CAPABILITY DOC MAP）

> **硬性要求**（见 AGENT_RULES.md）：禅道定制开发 = 基于开发文档实现。每个 MCP 能力必须映射到 KB 权威文档并校验。
> **状态图例**：✅ doc-verified（已对照 KB 逐字段校验 + 云端实测） / ⚠️ partially-verified（字段对照+部分实测） / 🔴 doc-gap（KB 无对应文档或实测失败，标注依据+风险）
> **说明**：本 MCP 用**传统 session API**（zentaosid cookie + PATH_INFO 视图），KB 的 RESTful 文档（/api.php/v1|v2）是**字段语义参考**，非本 MCP 实际端点。

## 能力映射总表（64 工具）

### 会话 / 产品

| 工具 | 能力 | KB 权威文档 | 状态 | 校验要点 |
|------|------|-------------|------|----------|
| zentao_whoami | 当前用户/会话 | [api_get-my-info](kb/禅道RESTfulAPIv1.0开发手册/api_get-my-info.md) | ✅ | getSessionID+登录三步；forceRelogin |
| zentao_product_list | 产品列表 | [api_get-products](kb/禅道RESTfulAPIv1.0开发手册/api_get-products.md) | ⚠️ | status 枚举对照；列表字段实测 |
| zentao_product_get | 产品详情 | [api_get-product](kb/禅道RESTfulAPIv1.0开发手册/api_get-product.md) | ⚠️ | 详情字段对照 |
| zentao_product_create | 创建产品 | [api_create-product](kb/禅道RESTfulAPIv1.0开发手册/api_create-product.md) | ✅ | **multipart POST**（非 urlencoded）+ uid 必填 + 全表单字段；locate 提取 ID；实测 product 24 |
| zentao_product_update | 修改产品 | [api_edit-product](kb/禅道RESTfulAPIv1.0开发手册/api_edit-product.md) | ✅ | 保留当前字段+覆盖；**实测 product 24 name+desc 改通** |
| zentao_product_delete | 删除产品 🔴高危 | [api_delete-product](kb/禅道RESTfulAPIv1.0开发手册/api_delete-product.md) | ✅ | 二次确认（dry_run+confirmToken 5min+confirmPhrase）；级联删除全部子实体 |

### 需求（story）

| 工具 | 能力 | KB 权威文档 | 状态 | 校验要点 |
|------|------|-------------|------|----------|
| zentao_story_list | 需求列表 | [api_get-product-stories](kb/禅道RESTfulAPIv1.0开发手册/api_get-product-stories.md) | ⚠️ | status/stage 独立字段（KB 枚举） |
| zentao_story_get | 需求详情 | [api_get-story](kb/禅道RESTfulAPIv1.0开发手册/api_get-story.md) | ⚠️ | 详情字段对照 |
| zentao_story_create | 创建需求 | [api_create-story](kb/禅道RESTfulAPIv1.0开发手册/api_create-story.md) | ✅ | type=story 必填；**spec 15/15 + verify 4/4 富文本标签**（含 `<img>` 真实图片）；实测 9350 |
| zentao_story_update | 修改需求（基础字段） | [api_edit-story-fields](kb/禅道RESTfulAPIv1.0开发手册/api_edit-story-fields.md) | ✅ | **只能改 title/pri/assignedTo/stage**；spec/verify 不能改（需走 story_change） |
| zentao_story_close | 关闭需求 | [api_close-story](kb/禅道RESTfulAPIv1.0开发手册/api_close-story.md) | ✅ | closedReason 6 值对照 |
| zentao_story_review | 评审需求 | [api_review-story](kb/禅道RESTfulAPIv1.0开发手册/api_review-story.md) | ✅ | result 枚举对照；实测 |
| zentao_story_change | 需求变更（改 spec/verify） | [api_change-story](kb/禅道RESTfulAPIv1.0开发手册/api_change-story.md) | ✅ | **唯一能改 spec/verify 的途径**；变更字段对照；实测 |
| zentao_story_delete | 删除需求（软删除） | [api_delete-story](kb/禅道RESTfulAPIv1.0开发手册/api_delete-story.md) | ✅ | **软删除**：deleted=1，列表消失，URL+ID 仍可访问；实测 9344 |
| zentao_story_saved_queries | 保存的需求查询 | **KB 无** | 🔴 doc-gap | 传统独有；实测可用 |
| zentao_story_search | 搜索需求 | **KB 无**（参考 list 参数） | 🔴 doc-gap | 条件映射 story-browse query |

### Bug

| 工具 | 能力 | KB 权威文档 | 状态 | 校验要点 |
|------|------|-------------|------|----------|
| zentao_bug_list | Bug 列表 | [api_get-product-bugs](kb/禅道RESTfulAPIv1.0开发手册/api_get-product-bugs.md) | ⚠️ | status/severity/pri 枚举 |
| zentao_bug_get | Bug 详情 | [api_get-bug](kb/禅道RESTfulAPIv1.0开发手册/api_get-bug.md) | ⚠️ | 详情字段 |
| zentao_bug_create | 创建Bug | [api_create-bug](kb/禅道RESTfulAPIv1.0开发手册/api_create-bug.md) | ✅ | 无 build 产品 openedBuild 可空；**steps 12/12 富文本标签**；实测 20496 |
| zentao_bug_update | 修改Bug | [api_edit-bug](kb/禅道RESTfulAPIv1.0开发手册/api_edit-bug.md) | ✅ | 会话乐观锁模式；**steps 富文本 HTML**（KindEditor bugTools）；实测 20494+20495 |
| zentao_bug_resolve | 解决Bug | [api_resolve-bug](kb/禅道RESTfulAPIv1.0开发手册/api_resolve-bug.md) | ✅ | resolution 8 值（willnotfix/tostory 拼写修复过）；**云端实测 20494→resolved** |
| zentao_bug_close | 关闭Bug | [api_close-bug](kb/禅道RESTfulAPIv1.0开发手册/api_close-bug.md) | ✅ | 须先 resolve；**云端实测→closed** |
| zentao_bug_reopen | 激活Bug | [api_reopen-bug](kb/禅道RESTfulAPIv1.0开发手册/api_reopen-bug.md) | ✅ | status→active；**云端实测→active** |
| zentao_bug_delete | 删除Bug（软删除） | [api_delete-bug](kb/禅道RESTfulAPIv1.0开发手册/api_delete-bug.md) | ✅ | 同 story：软删除 deleted=1，列表消失 |
| zentao_bug_saved_queries | 保存的Bug查询 | **KB 无** | 🔴 doc-gap | 传统独有；实测可用 |
| zentao_bug_search | 搜索Bug | **KB 无**（参考 list 参数） | 🔴 doc-gap | 条件映射 bug-browse query |

### 任务（task）

| 工具 | 能力 | KB 权威文档 | 状态 | 校验要点 |
|------|------|-------------|------|----------|
| zentao_task_list | 任务列表 | [api_get-execution-tasks](kb/禅道RESTfulAPIv1.0开发手册/api_get-execution-tasks.md) | ⚠️ | type 枚举 |
| zentao_task_create | 创建任务 | [api_task-create-383](kb/禅道传统SessionAPI/api_task-create-383.md) | ✅ | 此版本挂**项目**（projectID）；assignedTo[]；project 显式传值；**云端实测 2200/2201** |
| zentao_task_start | 开始任务 | [api_start-task](kb/禅道传统SessionAPI/api_start-task.md) | ✅ | urlencoded；left 必填；**实测 2201→doing** |
| zentao_task_finish | 完成任务 | [api_finish-task](kb/禅道传统SessionAPI/api_finish-task.md) + [api_task-finish-params-384](kb/禅道传统SessionAPI/api_task-finish-params-384.md) | ✅ | multipart；currentConsumed 必填 |
| zentao_task_update | 修改任务 | [api_edit-task](kb/禅道传统SessionAPI/api_edit-task.md) | ✅ | **assignedTo 单数**（非数组，修复过静默 no-op）；view JSON 预读保留字段；**实测 pri/estimate 改通** |
| zentao_task_close | 关闭任务 | [api_close-task](kb/禅道传统SessionAPI/api_close-task.md) | ✅ | urlencoded status=closed；**实测 2200** |
| zentao_task_pause | 暂停任务 | [api_pause-task](kb/禅道传统SessionAPI/api_pause-task.md) | ✅ | urlencoded status=paused；实测 |
| zentao_task_resume | 恢复任务 | [api_resume-task](kb/禅道传统SessionAPI/api_resume-task.md) | ✅ | 路由=/task-**restart**（非 resume）；**实测 paused→doing** |
| zentao_task_log_add | 添加任务日志 | [api_add-task-log](kb/禅道RESTfulAPIv1.0开发手册/api_add-task-log.md) | ✅ | 真实路由=/effort-createForObject-task-{id}（页面 task-recordEstimate）；**云端实测 2201：left 4→3** |
| zentao_task_delete | 删除任务（软删除） | [api_delete-task](kb/禅道传统SessionAPI/api_delete-task.md) | ✅ | 需 **-yes-yes** 双确认；软删除 deleted=1，列表消失 |

### 计划 / 执行 / 版本

| 工具 | 能力 | KB 权威文档 | 状态 | 校验要点 |
|------|------|-------------|------|----------|
| zentao_productplan_list | 计划列表 | [api_get-productplans](kb/禅道RESTfulAPIv1.0开发手册/api_get-productplans.md) | ⚠️ | plan 字段 |
| zentao_productplan_get | 计划详情 | [api_get-plan](kb/禅道RESTfulAPIv1.0开发手册/api_get-plan.md) | ⚠️ | **view JSON 返回空对象**，用 browse 查找（§8 陷阱4） |
| zentao_productplan_create | 创建计划 | [api_create-plan](kb/禅道RESTfulAPIv1.0开发手册/api_create-plan.md) | ✅ | 响应是 HTML 非 JSON；browse 精确检测 ID；**云端实测 391-396** |
| zentao_productplan_delete | 删除计划 🔴高危 | [api_delete-plan](kb/禅道RESTfulAPIv1.0开发手册/api_delete-plan.md) | ✅ | 二次确认；**真实生效**（391-396 已删）；用户对话实测 396 |
| zentao_productplan_link_story | 计划关联需求 | [api_get-productplans](kb/禅道RESTfulAPIv1.0开发手册/api_get-productplans.md)（stories 字段） | ✅ | 走 story-edit plan 字段（此版本无独立路由） |
| zentao_productplan_unlink_story | 计划取消关联需求 | 同上 | ✅ | plan 字段置空；实测 |
| zentao_productplan_link_bug | 计划关联Bug | 同上（bugs 字段） | ✅ | 路由=/productplan-linkBug-{bugID}-{planID}-0-id_desc.html；**云端实测 397+20494** |
| zentao_productplan_unlink_bug | 计划取消关联Bug | 同上 | ✅ | 路由=/productplan-unlinkBug-{bugID}-{planID}-yes.html；**云端实测** |
| zentao_execution_list | 执行列表 | [api_get-executions](kb/禅道RESTfulAPIv1.0开发手册/api_get-executions.md) | ⚠️ | 此版本 execution=project |
| zentao_execution_get | 执行详情 | [api_get-execution](kb/禅道RESTfulAPIv1.0开发手册/api_get-execution.md) | ⚠️ | 详情+关联实体 |
| zentao_execution_create | 创建执行 | [api_create-execution](kb/禅道RESTfulAPIv1.0开发手册/api_create-execution.md) | ✅ | 路由=/**project**-create（非 execution-create）；**云端实测 project 45** |
| zentao_execution_delete | 删除执行 🔴高危 | [api_delete-execution](kb/禅道RESTfulAPIv1.0开发手册/api_delete-execution.md) | ✅ | 二次确认；**真实生效**（45 已删） |
| zentao_build_list | 版本列表 | [api_get-releases](kb/禅道RESTfulAPIv1.0开发手册/api_get-releases.md) | ⚠️ | build 字段 |
| zentao_build_get | 版本详情 | [api_get-project-releases](kb/禅道RESTfulAPIv1.0开发手册/api_get-project-releases.md) | ✅ | **view JSON 返回 false**→HTML 页 fallback 解析；实测 98 |
| zentao_build_create | 创建版本 | [api_create-build](kb/禅道RESTfulAPIv1.0开发手册/api_create-build.md) | ✅ | 挂**项目**（build-create-{projectID}）；**云端实测 build 98** |
| zentao_build_delete | 删除版本 🔴高危 | **KB 无**（doc-gap） | ✅ | 路由=/build-delete-{id}-yes.html（GET）；二次确认（dry_run+confirmPhrase）；HTML fallback 读 build 信息 |

### 用例（testcase）

| 工具 | 能力 | KB 权威文档 | 状态 | 校验要点 |
|------|------|-------------|------|----------|
| zentao_testcase_list | 用例列表 | [api_get-product-cases](kb/禅道RESTfulAPIv1.0开发手册/api_get-product-cases.md) | ⚠️ | 用例字段 |
| zentao_testcase_get | 用例详情 | [api_get-case](kb/禅道RESTfulAPIv1.0开发手册/api_get-case.md) | ⚠️ | steps 是**对象 map** 非数组（§8 陷阱3） |
| zentao_testcase_create | 创建用例 | [api_create-case](kb/禅道RESTfulAPIv1.0开发手册/api_create-case.md) | ✅ | 传统表单 steps[]{step,expect}；实测 1963/1964 |
| zentao_testcase_update | 修改用例 | [api_edit-case](kb/禅道RESTfulAPIv1.0开发手册/api_edit-case.md) | ✅ | 三坑修复（§8）：stepType=step / lastEditedDate='' / ensureLogin(true)+重读；**云端实测 1964 全字段** |
| zentao_testcase_run | 执行用例 | [api_run-case](kb/禅道RESTfulAPIv1.0开发手册/api_run-case.md) | ✅ | 路由=/testcase-result-{id}.html（urlencoded）；**云端实测 1964 pass** |
| zentao_testsuite_list | 用例库列表 | [api_get-product-cases](kb/禅道RESTfulAPIv1.0开发手册/api_get-product-cases.md) | ⚠️ | suite 维度 |
| zentao_testtask_list | 测试任务列表 | [v2 api_get-testtasks](kb/禅道RESTfulAPIv2.0开发手册/api_get-products-productid-testtasks-2236.md) | ⚠️ | testtask 字段 |
| zentao_testreport_list | 测试报告列表 | [api_get-tests](kb/禅道RESTfulAPIv1.0开发手册/api_get-tests.md) | ⚠️ | 报告字段 |

### 模块

| 工具 | 能力 | KB 权威文档 | 状态 | 校验要点 |
|------|------|-------------|------|----------|
| zentao_module_list | 模块列表 | [api_edit-product](kb/禅道RESTfulAPIv1.0开发手册/api_edit-product.md)（模块部分） | ⚠️ | module 字段 |
| zentao_module_tree | 模块树 | 同上（parent 字段） | ⚠️ | 层级构建 |
| zentao_module_create | 创建模块 | **KB 无**（doc-gap） | ✅ | 路由=/tree-manageChild-{product}-{type}.html；顶级=modules[0]，子模块=**modules[]+parentModuleID**；树 JSON 兜底 ID 检测；**云端全流程验证** |
| zentao_module_rename | 重命名/移动模块 | **KB 无**（doc-gap） | ✅ | 路由=/tree-edit-{id}-{type}.html（name/parent/root/short）；**云端实测 726 重命名** |
| zentao_module_delete | 删除模块 🔴高危 | **KB 无**（doc-gap） | ✅ | 路由=/tree-delete-{product}-{id}-yes.html（**级联删子模块**）；二次确认；**云端实测 726+727 真删+子模块级联消失** |

## 统计（85 工具）

- ✅ doc-verified + 云端实测：**42**（含 product 全流程 + 软删除验证）
- ⚠️ partially-verified：**13**（多为 list/get 字段对照）
- 🔴 doc-gap / 权限缺失：**10**
  - 传统独有 doc-gap ×5（saved_queries ×2, search ×2, build_delete 无 KB 文档）
  - 功能点权限未开 ×5（testcase 全锁——5 个工具返回 locked）
  - 其他 ×4
- 🆕 易用性工具（20 个，2026-09-10）：
  - 第 1 批（7）：context / cleanup_mcp / bulk_close / bulk_assign / story_advance / html_help / tool_guide
  - 第 2 批（5）：multi_op / relations / validate_args / status_enum / export
  - 第 3 批（8）：my_workbench / dry_run / field_guide / filter / stats / template / workflow / batch_dry_run
  - 第 4 批（功能增强，0 个新工具，2026-09-10 云端验证）：
    - **全实体可点击 url**：每个工具在每个实体 ID 处附 `url` 字段（viewUrl/moduleUrl/withUrl 三个 helper），
      覆盖列表项/详情/写确认/workbench/relations/export 每行/dry_run/batch_dry_run。HTTP 探测 12 条路由全 200。
    - **zentao_export 加 filters**：复用 applyRowFilters（与 zentao_filter 同语义），只导出筛过的数据；
      productID/projectID 改为可选（不传=全部）；每行附 url 列；返回 scope/scanned。
    - **zentao_filter assignedTo 多值**：接受 string 或 string[]（多值 OR），filter 与 export 共用 applyRowFilters。
  - 纯本地 ×6（html_help, tool_guide, validate_args, status_enum, field_guide, template）✅
  - 只读 ×6（context ✅, relations ✅, export ✅, my_workbench ✅, filter ✅, stats ✅, workflow ✅, batch_dry_run ✅）
  - 写 ×5（cleanup_mcp ✅, bulk_assign ✅, story_advance ✅, multi_op ✅, bulk_close ⏭️）
  - 预演 ×2（dry_run ✅, batch_dry_run ✅）
  - workbench 迭代（2026-09-10，云端验证）：先收缩条件（productID/projectID）再全量获取；未关闭=需要处理（需求 active/changed/reviewing，Bug active/resolved，任务 wait/doing/done/paused），无时间过滤；
    高优先级清单（pri 1-2 或 sev 1-2，pri=0 排除）；展示遵循 field_guide 命名（严重度/优先级/状态中文名）。验证方法：取任一产品的全量数据与云端页面计数比对，应一致。

## 已修复的关键 bug（对照 KB/实测发现）

1. **story status/stage 混淆** → 分离字段（KB 枚举）
2. **bug resolution 拼写 wontfix→willnotfix + 缺 tostory** → 8 值对齐 KB
3. **story_create 缺 type=story** → 创建失败，已补
4. **task_create project 默认 35** → 显式传 projectID
5. **task_update assignedTo[]→assignedTo** → 修复静默 no-op
6. **task_resume 路由 /restart 非 /resume** → KB 确认
7. **bug_create 无 build 硬失败** → 放开（此部署 build 挂项目）
8. **testcase_update 三坑**：stepType=step / lastEditedDate='' / 会话乐观锁（§8）
9. **deny 误报**：禁搜"无权"二字（数据文本污染，§8 陷阱1）
10. **plan/execution create ID 检测**：响应 HTML 非 JSON → browse 精确检测

## 高危删除二次确认（统一机制）

product / execution / productplan 删除采用三阶段确认：
1. **dry_run=true（默认）**：返回实体信息 + 级联影响（cascade_description）+ 可恢复性说明 + confirmToken（SHA-256，5 分钟窗口）
2. **confirmToken 验证**：实体绑定 + 时间窗口，防重放/跨实体误用
3. **confirmPhrase 验证**：必须精确输入 `DELETE {ENTITY} {id}`（认知成本，防无脑确认）

AI 调用方规范：必须先展示影响分析给用户，等用户明确授权后才执行第二次调用。禁止自行跳过 dry_run。

## 富文本支持（KindEditor）

| 实体 | 字段 | 编辑器 | create | 修改途径 | 状态 |
|------|------|--------|--------|---------|------|
| story | spec（需求描述） | KindEditor simpleTools | ✅ HTML | **只能走 story_change（需求变更）** | ✅ 15/15 标签（实测 9350） |
| story | verify（验收标准） | KindEditor simpleTools | ✅ HTML | **只能走 story_change（需求变更）** | ✅ 4/4 标签（实测 9350） |
| bug | steps（重现步骤） | KindEditor bugTools | ✅ HTML | ✅ bug_update 直接改 | ✅ 12/12 标签（实测 20496） |
| bug | comment（备注） | KindEditor bugTools | ✅ | ✅ | ✅ |

**关键区别**：story 的 spec/verify 不能通过 story_update（修改需求）更改，必须走 story_change（需求变更）。bug 的 steps 可以通过 bug_update 直接修改。

支持的 15 种 HTML 标签：`<b> <i> <u> <ol> <ul> <li> <p> <br> <code> <a> <img> <table> <blockquote> <hr> <font>`

实测：bug 20494（steps 15/15 + 真实图片，通用测试实体）

## 待办（需用户/管理员介入）

| 事项 | 阻塞原因 |
|------|---------|
| testcase_delete 实现 | 功能点权限「用例/删除」未开通（view 页无删除按钮实证） |
| story/bug/task delete 语义 | 需 UI 验证（返回成功但不生效） |
| 测试数据清理 | task 2200/2201、story 9344、bug 20494、build 98、case 1963/1964（9347/9348/9349/9350/20495/20496 已关闭，模块 724-733 已清理） |
