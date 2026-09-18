# ZenTao Legacy MCP Server（禅道 Legacy MCP）

面向 **禅道（ZenTao）经典版 biz 4.x** 的跨客户端 MCP Server。通过 session-based 经典 API 提供 **88 个工具**：产品/需求/Bug/任务/执行/版本/计划/模块/用例的完整读写，富文本图片自动上传，附件上传，以及**首次运行自动部署发现**。

> 本仓库是开源版本：**不包含任何特定部署的域名、账号、产品 ID 等部署信息**。所有部署结构（有哪些产品/项目/模块/版本、哪些功能点可用）在**首次运行时自动抓取并缓存到本地**，换一个禅道域名即可直接使用。

## 特性

- **88 个工具**，覆盖禅道 biz 4.x 日常研发管理全流程（需求/Bug/任务/执行/版本/计划/模块/用例）
- **首次运行自动发现**：启动后第一次 `zentao_context`（或任何需要产品 ID 的工具）会抓取部署结构——产品列表、项目、模块树、版本、功能点状态、用户已保存的查询——缓存为本地 `profile.json`，之后秒回；`ZENTAO_PROFILE_TTL_HOURS` 控制缓存时长
- **部署自适应**：无任何硬编码的产品/项目/模块 ID；部分部署禁用的路由（0 字节响应）自动 fallback；未开通的功能点（如测试用例）自动探测并返回明确错误
- **富文本图片自动上传**：steps/spec/verify 中 `<img>` 的本地路径或 data: URI 自动上传到禅道文件存储并替换为公开 URL，其余 HTML 逐字节保留
- **附件上传**：`attachments` 参数把本地文件挂为禅道「附件」（≤50M/个），与富文本内联图是两条独立通道
- **需求一次成单**：`zentao_story_create` 创建时即上传附件，并默认自动评审通过（`autoReview: true`）——一次调用得到 ACTIVE 需求（附件先于评审的顺序由构造保证）；`autoReview: false` 保留 DRAFT 交人工评审
- **交付模式默认**：创建的实体就是真实数据，不写任何机器标记；`ZENTAO_MARKERS=1` 开发模式可开启 [MCP] 标题/MCP-AUTO 关键词/颜色标记，便于测试实体清理
- **单文件独立部署**：esbuild 打包成零依赖单文件，`node xxx.cjs` 直接跑；凭据走本地 env 文件（chmod 600），客户端配置零敏感信息
- **安全内建**：删除类工具两步确认（dry_run + confirmToken/confirmPhrase）、写前 dry_run 预演、参数本地预检、推荐值必须用户确认

## 快速开始

### 1. 构建

```bash
npm install
npm run build              # tsc → dist/
npm run build:standalone   # esbuild → dist/standalone/zentao-legacy-mcp.cjs（零依赖单文件）
```

### 2. 配置凭据（本地 env 文件，服务端自动加载）

```bash
mkdir -p ~/.local/share/zentao-legacy-mcp
cp .env.example ~/.local/share/zentao-legacy-mcp/env
chmod 600 ~/.local/share/zentao-legacy-mcp/env
# 编辑: 填 ZENTAO_BASE_URL / ZENTAO_ACCOUNT / ZENTAO_PASSWORD
```

> 真实环境变量优先于 env 文件。凭据只存在于本机，服务端从不在日志/返回值中回显密码。

### 3. 客户端接入

所有客户端指向独立单文件即可（凭据不写进客户端配置）：

```json
{ "mcpServers": { "zentao-legacy": { "command": "node", "args": ["/ABS/PATH/dist/standalone/zentao-legacy-mcp.cjs"] } } }
```

- Claude Desktop / Claude Code：`claude_desktop_config.json`
- Codex：`~/.codex/config.toml`（`[mcp_servers.zentao-legacy]`）
- DeepSeek IDE / DSH：bundle 目录或 mcpServers JSON
- 详见 `examples/client-configs.md` 与 `config/` 下模板；npm 全局安装后可直接用 `zentao-legacy-mcp` 命令

### 4. 首次运行（部署发现）

客户端第一次调用 `zentao_context` 时，服务端自动执行只读发现（约 10-30 秒，取决于产品数量）：

| 抓取内容 | 说明 |
|---|---|
| products | 产品列表（id/名称/代号/状态）+ 每产品模块树/迭代/版本 |
| projects | 全局项目列表 + 每项目下的执行（迭代） |
| features | 模块直连路由是否可用、测试用例功能点是否开通 |
| savedQueries | 用户在禅道里保存的 Bug/需求查询 |

结果写入 `~/.local/share/zentao-legacy-mcp/profile.json`（0600，可 `ZENTAO_PROFILE_FILE` 改位置）。单项抓取失败只记 warning 不阻塞整体。`zentao_profile` 工具可随时查看画像（支持 `refresh: true` 强制重新发现、`productID` 只看单个产品）。

## 配置参考（env）

| 变量 | 必填 | 默认 | 说明 |
|---|---|---|---|
| `ZENTAO_BASE_URL` | ✅ | — | 禅道部署 URL（无尾部斜杠） |
| `ZENTAO_ACCOUNT` | ✅ | — | 登录账号 |
| `ZENTAO_PASSWORD` | ✅ | — | 登录密码（仅存本机） |
| `ZENTAO_ENV_FILE` | | `~/.local/share/zentao-legacy-mcp/env` | env 文件位置 |
| `ZENTAO_PROFILE_FILE` | | env 文件同目录 `profile.json` | 部署画像缓存位置 |
| `ZENTAO_PROFILE_TTL_HOURS` | | `24` | 画像缓存时长（小时），0=每次重新发现 |
| `ZENTAO_MARKERS` | | `0` | 机器标记总开关。**交付环境保持 0**（真实数据无标记）；仅开发环境设 1 |
| `ZENTAO_OPERATOR` | | 账号 | 标记 token / builder 字段里的操作者名 |
| `ZENTAO_KEEP_LOGIN` | | `1` | 跨进程重启保持会话 |
| `ZENTAO_REQUEST_TYPE` | | `PATH_INFO` | URL 风格（PATH_INFO/GET） |
| `ZENTAO_REQUEST_TIMEOUT_MS` | | `30000` | 单请求超时 |
| `ZENTAO_DEBUG` | | `0` | stderr 调试日志 |

完整示例见 `.env.example`。

## 工具列表（88）

### 会话 / 发现
| 工具 | 用途 |
|---|---|
| `zentao_whoami` | 账号/角色/会话健康/`markersEnabled`/`mode` |
| `zentao_context` | 部署画像摘要 + 推荐产品/项目（**推荐值必须用户确认**），首次触发发现；`refresh` 强制重建 |
| `zentao_profile` | 完整部署画像：产品（含模块树/迭代/版本）/项目/功能点/已保存查询 |

### 需求（story）
`story_list` `story_get` `story_create` `story_update` `story_change` `story_review` `story_advance`（一键状态流转）`story_close` `story_delete` `story_search` `story_saved_queries`

> `story_create` 一次成单：`attachments` 随创建上传，默认自动评审通过（`autoReview: true` → 直接 ACTIVE，返回 `reviewed`/`reviewError`）；`autoReview: false` 保留 DRAFT 交人工评审。创建参数含 `plan`（迭代）/`source`/`assignedTo`/`keywords`/`moduleID`，schema 已全量声明。

### Bug
`bug_list` `bug_get` `bug_create` `bug_update` `bug_resolve` `bug_close` `bug_reopen` `bug_delete` `bug_search` `bug_saved_queries`

### 任务（task）
`task_list` `task_create` `task_update` `task_start` `task_finish` `task_close` `task_pause` `task_resume` `task_delete` `task_log_add`

### 执行 / 版本 / 计划
`execution_list` `execution_get` `execution_create` `execution_delete`（两步确认）· `build_list` `build_get` `build_create` `build_delete`（两步）· `productplan_list` `productplan_get` `productplan_create` `productplan_delete`（两步）`productplan_link_story` `productplan_unlink_story` `productplan_link_bug` `productplan_unlink_bug`

### 产品 / 模块
`product_list` `product_get` `product_create` `product_update` `product_delete`（⚠️ 级联删除，两步）· `module_list` `module_tree` `module_create` `module_rename` `module_delete`（⚠️ 级联，两步）

### 用例（testcase，软锁）
`testcase_list` `testcase_get` `testcase_create` `testcase_update` `testcase_run` + `testtask_list` `testsuite_list` `testreport_list`。用例功能点未开通的部署会自动探测并返回 `feature_not_enabled`（已开通的部署正常使用）。

### 条件搜索（story_search / bug_search 的 conditions 参数）

> 跨实体全文检索（"哪些需求或 Bug 提到了 X"）用 `zentao_global_search`（全文检索模块）：按关键词返回所有实体类型的排序结果（`objectType`+`objectID`+标题/摘要/相关度/可点击 url）；服务端不按类型过滤，`type` 参数为客户端过滤，`total` 为全类型总数。与单实体条件搜索互补。

服务端条件搜索，三种模式（响应带 mode 字段标注）：

| 模式 | 触发 | 说明 |
|---|---|---|
| server-adhoc | conditions: [{field, operator?, value}] | 走禅道 search-buildQuery 临时查询，完整翻页取回所有匹配行 |
| server | queryID（数字） | 执行账号已保存的命名查询（先调 *_saved_queries 拿 ID） |
| client-scan | keyword | 客户端全量扫描兜底（任何部署可用，较慢） |

- **两种服务端行为都支持**：部分部署 buildQuery 会创建临时查询行（响应含数字 queryID，MCP 自动清理）；另一类部署**不建行、把条件存进服务端会话**，随后由 bySearch-myQueryID 视图执行——MCP 自动识别该模式（返回 queryMode: session），无需调用方关心
- **运算符**：= != > >= < <= include(包含) notinclude between(介于, value="起,止") belong(从属于)；省略时按字段类型取部署默认值（title→include、module→belong、status/stage/pri→=）
- **多条件**：默认 AND；某条加 andOr: or 即 OR。字段错报 unknown_field（附可用字段清单）、select 字段值越界报 invalid_value（附可选值），均基于部署画像探测
- 0 行是合法结果（不是错误）；feature_not_enabled 仅当 buildQuery 响应未指向任何 bySearch 页时出现（此时改用 zentao_filter 客户端条件全量或 saved queryID）

### 易用性工具（纯本地或跨实体）
| 工具 | 用途 |
|---|---|
| `zentao_my_workbench` | 我名下所有未关闭的需求/Bug/任务 |
| `zentao_my_dashboard` | 我的地盘(/my/)汇总：跨产品指派给我的需求/未关闭Bug/我的任务/未完项目/未关闭产品/动态流（外部看板对接；配套 `npm run pull:my` 导出 JSON+CSV） |
| `zentao_filter` | 高级过滤（多值指派/优先级范围/日期/关键词） |
| `zentao_global_search` | 跨实体全文检索（全文检索模块：需求/Bug/任务/用例/文档…按关键词的排序结果，10 页/约 1000 行上限） |
| `zentao_stats` | 按状态/严重度/指派人/优先级分组统计 |
| `zentao_export` | 导出 CSV/JSON（带可点击 url） |
| `zentao_relations` | 实体关联图（需求↔Bug↔任务↔计划） |
| `zentao_dry_run` / `zentao_batch_dry_run` | 写操作预演（diff + 风险等级 + 可逆性） |
| `zentao_validate_args` | 参数本地预检（省一次云端往返） |
| `zentao_tool_guide` | 6 大场景分步指引（纯本地） |
| `zentao_field_guide` | 字段语义参考（纯本地） |
| `zentao_status_enum` | 状态枚举 + 流转路径（纯本地） |
| `zentao_template` | 建单模板（纯本地） |
| `zentao_html_help` | 富文本 15 种标签参考（纯本地） |
| `zentao_bulk_assign` / `zentao_bulk_close` | 批量指派/关闭 |
| `zentao_multi_op` | 跨实体类型复合操作（按序执行） |
| `zentao_cleanup_mcp` | 清理开发环境的 MCP 标记测试实体（只删带标记的） |

## 富文本与图片

需求/Bug 的 steps/spec/verify 支持 KindEditor 子集（`<b> <i> <u> <ol> <ul> <p> <br> <code> <a> <img> <table> <blockquote> <hr> <font>`，细节调 `zentao_html_help`）。

`<img>` 的 src 三种情况：
1. **远程 URL**（http/https）→ 原样保留
2. **禅道相对路径**（`/file-read-<id>.png`）→ 原样保留
3. **本地路径**（`/Users/...`、`~/`、`./`、`file://`、Windows 盘符）或 **data: URI** → **自动上传禅道文件存储**，替换为公开可访问 URL；其余 HTML 逐字节保留；缺文件 fail-fast 拒写；返回 `images: [{fileID, url, absUrl, bytes}]`

**附件**（`attachments: [本地路径...]`，≤50M/个）= 禅道「附件」列表通道（XLS/PDF/日志/整包截图），服务端自动关联对象；返回 `attachments: [{name, bytes}]`；`*_get` 返回 `files` 字段可自查。

## 返回值规范

- 成功：`{ "data": ... }`，列表带 `total`/`returnedCount`，实体带可点击 `url`
- 失败：`{ "error": { message, code, fix?, retryable?, needs_user? } }`
- 常见 code：`locked`→已改为 `feature_not_enabled`（用例功能点）、`denied`（权限）、`not_found`、`validation`

## 认证机制（内部）

GET 登录页拿 `zentaosid` cookie → 密码哈希 POST 登录 → 会话仅存内存（不落盘）；每次请求前探测会话有效性，失效自动重登（`ZENTAO_KEEP_LOGIN=1` 时跨进程复用 sid）。所有请求带超时防挂起。

## 开发模式与机器标记

**交付模式（默认，`ZENTAO_MARKERS=0`）**：MCP 创建的实体是真实数据——无 [MCP] 标题前缀、无 MCP-AUTO 关键词、无颜色、无 via 尾注。`zentao_cleanup_mcp` 在这种模式下不会匹配到任何实体。

**开发模式（`ZENTAO_MARKERS=1`）**：create 自动写四重机器标记（[MCP] 标题前缀 + MCP-AUTO-<时间戳>-<操作者> 关键词 + 红色 + 评论 via 尾注），用于 agent 自测时识别和批量清理自己创建的测试实体。标记设计见 `MARKER_DESIGN.md`。**不要在交付环境开启。**

## Agent 操作纪律（摘要）

完整规则见 `AGENT_RULES.md`。核心：
1. 交付模式下操作的是**真实数据**，非必要不写云端
2. `zentao_context` 的推荐值**必须用户确认**后才能用于写操作
3. 所有删除两步走：`dry_run` 预览 → 用户确认 → `confirmPhrase` 执行（agent 不得自行执行）
4. 批量写操作先列清单给用户确认
5. 拿不准先 `zentao_dry_run` 预演

## 项目结构

```
src/            服务端源码（client 会话客户端 / handlers 88 工具 / tools schema / profile 发现 / marker 标记）
kb/             禅道 API 知识库（官方开发文档抓取，工具实现的依据）
docs/           官方文档原文（RESTful API 手册 / 扩展开发）
test/           测试（直连冒烟 / stdio 协议 / 工具用例 / agent 场景）
config/         客户端接入模板（占位路径，无凭据）
examples/       env 与客户端配置示例
```

## 测试

测试脚本从 env 文件读凭据，默认**只读**（`--apply` 才含写操作）：

```bash
npm test                 # 直连客户端冒烟（登录+读取）
node test/stdio_test.mjs # 完整 MCP stdio 协议
npm run test:tool        # 工具级用例（只读）
npm run test:read        # agent 场景用例（自然语言 prompt 驱动）
```

## 安全说明

- 凭据只存在于本机 env 文件（建议 0600）；客户端配置、仓库、日志、返回值中均无密码
- 部署画像 `profile.json` 只含结构信息（产品/模块/版本），不含凭据
- 服务端仅访问你配置的 `ZENTAO_BASE_URL`，无其他外发
- 删除/级联删除默认 dry_run；高危操作需二次确认短语

## 已知限制 / 部署差异（通用）

禅道各部署的模块开关与路由可用性不同，本 MCP 的策略是**探测 + 降级 + 明确报错**：

- **0 字节响应**：该路由在此部署被禁用（模块浏览等）→ 自动 fallback 到替代路由（如 product-browse 视图），返回带 `source` 字段标注
- **功能点未开通**（如测试用例）→ 工具自动探测并返回 `feature_not_enabled`，附开通指引
- **分页差异**：列表工具用 view JSON 双参数分页（`{recTotal}-{perPage}-{page}`），实测兼容 biz 4.x 各小版本
- 字段取值以云端表单配置为准：创建表单的 option 值由服务端动态解析（如 build 传名称/代号/id 均可），不写死
- 个别路由（如某些版本的 execution browse）可能整体不可用 → 记入画像 warnings，相关工具报明确错误
- **ad-hoc 搜索的服务端行为因部署而异**：有的部署创建临时查询 DB 行（数字 queryID），有的只把条件存进会话（myQueryID 占位符原样保留）。两者都是正常成功路径，MCP 均已处理（会话模式下禁用路由缓存——URL 不携带条件，缓存会串上一次搜索的结果）

## 开源合规

本仓库不含任何特定部署的域名/账号/产品与模块 ID；部署画像与操作备忘属于**使用者本地文件**（`~/.local/share/zentao-legacy-mcp/`），不随仓库分发。`kb/` 为禅道官方公开文档的节选缓存（约 2M，实现参考），版权归原作者；完整官方文档请访问 [禅道官网](https://www.zentao.net/book/)（RESTful API v1/v2 手册、SDK 手册、定制开发指南）。

## License

MIT（见 `LICENSE`）
