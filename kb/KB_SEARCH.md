# KB 检索指南（面向大模型）

> 本目录是禅道开发的**通用大模型知识库**（288 篇文档）。本文件教你（大模型）**如何高效检索**，
> 配合 [AGENT_RULES.md](../AGENT_RULES.md) 的"知识库优先"行为规范使用。
>
> **文件名规则**：RESTful API v1.0 文档已重命名为语义化英文名（如 `api_create-story.md`、`api_resolve-bug.md`），
> 可直接按功能搜索（`grep -l 'create-story' kb/禅道RESTfulAPIv1.0开发手册/`）。RESTful v2.0 文档保持原名。

## 快速检索（3 步）

### 1. 选主题（topicIndex）
打开 `kb/LLM_SEARCH_INDEX.json` 的 `topicIndex`，按业务概念定位文档群：

| 主题 key | 含义 | 典型问题 |
|----------|------|----------|
| `login-auth-session` | 登录/认证/session/token | 怎么登录？verifyRand？zentaosid？ |
| `bug` | Bug/缺陷 | 创建/解决/关闭/确认 Bug |
| `story-requirement` | 需求 | 创建/关闭/激活需求 |
| `product` | 产品 | 产品列表/详情 |
| `project-execution` | 项目 | 项目列表/成员 |
| `execution-iteration` | 执行/迭代 | 迭代任务/状态 |
| `task` | 任务 | 创建/完成/关闭任务 |
| `testcase` | 测试用例 | 用例 CRUD |
| `testtask` | 测试任务 | 测试任务分配 |
| `testrun-plan` | 测试计划 | 测试计划/用例结果 |
| `user` / `dept` / `role` | 用户/部门/角色 | 用户 CRUD、权限 |
| `ticket` / `feedback` | 工单/反馈 | 工单流转 |
| `build` / `release` | 构建/发布 | 版本发布 |
| `api-mechanism` | API 机制（页面调用 vs 超级model） | 怎么调 API？ |
| `extension-control/model/view` | 二次开发扩展 | 扩展 control/model/view |
| `config-setting` | 配置 | 自定义配置 |
| `dashboard-chart` | 仪表板/图表 | 看板/统计 |

### 2. 或直接 grep 关键词
`kb/LLM_SEARCH_INDEX.json` 的 `keywordIndex` 是"关键词 -> 文档路径"映射。
或直接：`grep -rn -iE '关键词' kb/ --include='*.md'`

### 3. 读文档
读 `topicIndex`/`keywordIndex` 给出的 `.md` 路径（相对 kb/ 目录）。

## 核心文档速查（已验证权威）

| 主题 | 文档 | 关键内容 |
|------|------|----------|
| 登录三步 | `定制开发/extension-dev_1341.md` | getSessionID -> account/password -> 带 session 调用 |
| RESTful 登录(v2) | `禅道RESTfulAPIv2.0开发手册/api_post-users-login-2142.md` | POST /api.php/v2/users/login 明文密码 -> token |
| RESTful 登录(v1) | `禅道RESTfulAPIv1.0开发手册/api_664.md` | v1 token 流程 |
| 用户对象(含 fails/locked) | `禅道RESTfulAPIv2.0开发手册/api_get-users-userid-2146.md` | 用户字段：visits/fails/locked |
| API 机制简介 | `定制开发/extension-dev_1340.md` | 页面调用 vs 超级model 两种 API |
| API 端点清单 | `kb/API_ENDPOINTS.json` | 全部端点 |
| 文档目录 | `kb/INDEX.md` | 288 篇标题+路径 |

## 检索优先级（AGENT_RULES 落地）

1. **先查本 KB**（topicIndex / grep）—— 90% 的禅道问题这里有权威答案
2. **KB 查不到才实证**（隔离环境，不污染生产）
3. **每个结论标注来源**：`[KB: 路径]` / `[实测]` / `[专家]` / `[推测]`

## 常见陷阱

- **文件名无语义**（`api_1060.md`）→ 不要靠文件名猜，用 `LLM_SEARCH_INDEX.json` 的 title/path 映射
- **标题不含英文关键词** → 中英文都试（`bug`/`缺陷`，`需求`/`story`）
- **RESTful v1 vs v2** → 本项目用**传统 session API**（非 token RESTful），登录查 `extension-dev_1341.md`，不要只查 RESTful 登录
- **verb 不区分度** → "获取/创建/关闭"匹配几乎所有文档，用**主题**或**实体名词**检索
