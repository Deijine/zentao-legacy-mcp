# MCP 写操作内容标记方案（云端统一筛选 / 批量清理）

所有通过本 MCP 进行**新建 / 修改**的内容，都自动打上统一机器标记，
便于在禅道云端按标记**筛选、追溯、批量删除**。

---

## 标记设计

### 1. 关键词标记（主标记，机器可读，支持筛选）

| 实体 | 标记字段 | 写入值 |
|------|---------|--------|
| Bug | `keywords` | `MCP-AUTO-<时间戳>-<操作者>` |
| Story | `keywords` | `MCP-AUTO-<时间戳>-<操作者>` |

- **格式**：`MCP-AUTO-<YYYYMMDDHHmmss>-<account>`，例如 `MCP-AUTO-20260908153012-demo`
- **唯一性**：每次写操作生成新的时间戳前缀，可追溯到"哪一次 MCP 会话的哪一条"
- **可筛选**：禅道 keywords 支持搜索，云端用 `MCP-AUTO` 前缀即可捞出全部 MCP 产物
- **追加不覆盖**：若原内容已有 keywords，用空格追加（保留人工标记），不删除原值

### 2. 颜色标记（次标记，视觉区分）

| 实体 | 字段 | 写入值 |
|------|------|--------|
| Bug | `color` | `#e74c3c`（红色，MCP 默认标记色） |
| Story | `color` | `#e74c3c`（红色） |

- 在禅道列表里 MCP 产物一眼可辨（红色高亮）
- 可用 `ZENTAO_MARKER_COLOR` 环境变量自定义，设空则不打颜色

### 3. 标题标记（可选，人眼可读）

由 `ZENTAO_MARK_TITLES`（默认 `0`=关）控制。开启后：
- 新建：标题前加 `[MCP]` 前缀，如 `[MCP] 测试-列表页分页组件点击后白屏`
- 修改：**不动标题**（只改内容字段），避免破坏人读标题
- 产品新建：`code` 加 `mcpt_` 前缀，如 `mcpt_20260908153012`

### 4. 修改操作的特殊处理（幂等 + 可追溯）

- **追加式**：修改 spec/desc/steps 时，把原值保留，新值追加在末尾（或替换但留痕）
- **keywords 幂等**：重复修改同一实体，MCP-AUTO 标记只保留一个（不重复堆积）
- **lastEditedBy 天然留痕**：禅道自动记录 `lastEditedBy/lastEditedDate`，无需 MCP 额外处理

---

## 环境变量（控制标记行为）

| 变量 | 默认 | 说明 |
|------|------|------|
| `ZENTAO_MARKER_PREFIX` | `MCP-AUTO` | keywords 前缀 |
| `ZENTAO_MARKER_COLOR` | `#e74c3c` | 颜色标记，设空=不打颜色 |
| `ZENTAO_MARK_TITLES` | `0` | `1` 时新建标题加 `[MCP]` 前缀 |
| `ZENTAO_OPERATOR` | = `ZENTAO_ACCOUNT` | 标记中的操作者标识 |

---

## 各写操作标记落点

| 工具 | keywords | color | 标题/code | 备注字段 |
|------|----------|-------|-----------|----------|
| `zentao_bug_create` | ✅ MCP-AUTO-... | ✅ | [MCP] 前缀(可选) | steps 原样 |
| `zentao_story_create` | ✅ MCP-AUTO-... | ✅ | [MCP] 前缀(可选) | spec 原样 |
| `zentao_product_create` | — (产品无keywords) | — | code 加 `mcpt_` 前缀 | desc 原样 |
| `zentao_bug_resolve` | 已有则保留 | 保留 | — | comment 追加标记注 |
| `zentao_bug_close` | 已有则保留 | 保留 | — | comment 追加标记注 |
| `zentao_story_update` | ✅ 确保含标记 | ✅ | 不动标题 | spec 追加 |

> 产品没有 keywords 字段，只能靠 `code` 前缀 `mcpt_` + `createdBy`=操作账号 来筛选。

---

## 云端筛选 / 批量清理方法

### 按关键词筛选（推荐）
1. 禅道 Bug 列表 → 搜索/过滤 `keywords = MCP-AUTO`
2. 需求列表 → 同理
3. 按颜色红色一眼识别

### 按时间戳定位单次会话
- 标记里的 `YYYYMMDDHHmmss` 即该条创建时刻，可精确到某次 MCP 运行

### 批量删除
- 筛选出 `MCP-AUTO` 后，用禅道"批量删除"或逐条 `zentao_bug_close` / 删除
- 产品：按 `code` 前缀 `mcpt_` 筛选

### 安全约定
- 标记**只增不删**：MCP 修改已有内容时，不清除原 keywords/color（除非是 MCP 自己加的重复标记）
- 人工创建的内容（无 `MCP-AUTO` 标记）**绝不被 MCP 误改**——因为 MCP 只操作明确指定的 id

---

## 可追溯示例

一次 `bug_create` 后，该 bug 在云端呈现：
- 标题：`[MCP] 测试-列表页分页组件点击后白屏`（若开标题标记）
- 关键词：`MCP-AUTO-20260908153012-demo`
- 颜色：红色 `#e74c3c`
- 创建人：demo（登录账号）
- 创建时间：2026-09-08 15:30:12

云端搜 `MCP-AUTO` → 捞出全部 → 批量处理。
