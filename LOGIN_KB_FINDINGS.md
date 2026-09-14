# 登录机制 — KB 权威 vs 需实证（行为规范产物）

> 本文件是"登录调试行为规范"（LoopX goal: zentao-legacy-mcp-goal）的 P0 产物：
> 每次诊断/修复都必须先查 KB，标注权威出处；KB 查不到的才做实证并标注。

## 一、KB 权威可确认的（有文档出处）

### 1. 官方登录三步流程
**出处**：`kb/定制开发/extension-dev_1341.md`（"需要登录验证的API调用"）
- 一、获得 session：`GET ?m=api&f=getSessionID&t=json`（PATHINFO: `api-getsessionid.json`）
  → 返回 `{sessionName: "zentaosid", sessionID: "xxx"}`
- 二、验证身份：POST `user-login`，变量名 `account`、`password`
- 三、调用 API：后续访问以 cookie 或 GET 追加 `zentaosid=xxx` 传递 session

### 2. 用户对象维护登录失败状态
**出处**：`kb/禅道RESTfulAPIv2.0开发手册/api_get-users-userid-2146.md`（用户详情字段）
- `visits`（访问次数）、`fails`（**失败次数**）、`locked`（**锁住日期**）
- → 服务端为每个用户维护失败计数与锁定状态，"您还有N次尝试机会"即源于此

### 3. RESTful 登录（此部署不可用）
**出处**：`kb/禅道RESTfulAPIv2.0开发手册/api_post-users-login-2142.md`
- `POST /api.php/v2/users/login`，body `{account, password}`（明文），返回 `token`
- 实测此部署 `/api.php/v1|v2/*` 返回 `{"errcode":401,"errmsg":"缺少code参数"}`（自定义网关拦截，非标准 token 流程）

## 二、KB 查不到、需实证/外部确认的（盲猜区，禁止当权威）

| 项 | 现状 | 来源 |
|----|------|------|
| 登录保护阈值（5次）+ 锁定时长（10分钟） | KB 未公开 | 专家从禅道官方论坛确认 |
| verifyRand 是否一次性（成功后失效） | KB 未公开 | 大模型推测 + 间歇失败现象 |
| 成功登录是否重置 fails | KB 未公开 | 专家推测 |
| 跨进程/并发登录的精确互斥机制 | KB 未公开 | 大模型推测 |
| 限流时返回"用户名或密码错误"是否刻意模糊化 | KB 未公开 | 专家分析（安全策略常见做法） |
| **登录失败响应格式** | KB 未公开 | 文档只描述成功路径（返回 token），未说明失败返回什么 |
| **失败/成功的区别机制** | KB 未公开 | 文档未说明如何区分"密码错"vs"限流"vs"锁定" |
| **重置/解锁方法** | KB 未公开 | 文档无"重置登录失败计数"或"解锁"的说明 |

> **KB 登录失败机制总结**：KB 只有登录**成功**路径（v1 `/api.php/v1/tokens`、v2 `/api.php/v2/users/login` 返回 token；传统 session 三步）+ 用户 `fails`/`locked` 字段定义。**登录失败的具体机制（阈值/锁定时长/模糊化/重置方法）KB 全部未公开**。因此任何关于失败机制的判断都属"推测/专家"，不可当权威。
>
> **关键实证（用户确认）**：云端登录（成功）**解锁 `locked` 状态，但不重置 `fails` 计数器**。因此 `fails` 像"累积疲劳"——不主动清零就永远在高位徘徊，解锁后很快又锁定。**`fails` 的清零机制 KB 未公开，可能需管理员介入或极长时间**。

## 三、实证已确认的（代码/实测，非 KB）

- getSessionID 接口在本部署可用（返回 sessionID）
- 服务端接受**明文密码**登录（`{result:"success"}`）
- 服务端接受**单 md5** 密码（`{result:"success"}`）
- 登录页 JS 用 `md5(md5(password)+verifyRand)`（浏览器端混淆，非服务端硬要求）
- 登录表单字段：`account`、`password`、`keepLogin[]`（数组）、`referer`、`verifyRand`

## 四、行为规范（本 goal 的核心约束）

1. **KB 优先**：任何登录诊断/修复，先查 KB 标注出处；KB 查不到的，明确标注"需实证/外部确认"，不当权威。
2. **禁止盲猜/反复试错**：每次假设须有文档出处或实证数据支撑；不凭感觉改参数。
3. **实证要隔离**：真实账号登录测试须避免与其它登录撞车（唯一登录源 + 账号空闲窗口），避免污染 fails 计数。
4. **区分权威 vs 推测**：README/代码注释中标注每项机制的来源（KB / 实测 / 专家 / 推测）。
