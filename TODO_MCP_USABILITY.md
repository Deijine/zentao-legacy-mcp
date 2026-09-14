# MCP 易用性优化待办（全部完成）

> 完成时间：2026-09-10。原则：非必要不操作云端。

## 完成清单

- [x] U-1 智能默认值（zentao_context）
- [x] U-2 错误结构标准化（code/fix/retryable/needs_user）
- [x] U-3 zentao_cleanup_mcp 批量清理
- [x] U-4 返回 suggested_next（11 个写操作）
- [x] U-5 批量操作（bulk_close + bulk_assign）
- [x] U-6 状态流转一键直达（story_advance）
- [x] U-7 富文本辅助（html_help，纯本地）
- [x] U-8 工具发现（tool_guide，纯本地）
- [x] U-9 中文别名/触发词
- [x] U-10 幂等提示（idempotent 标记）

## 新增工具（7 个）

| 工具 | 类型 | 云端 |
|------|------|------|
| zentao_context | 读 | 是（只读） |
| zentao_cleanup_mcp | 写 | 是（仅 MCP-AUTO） |
| zentao_bulk_close | 写 | 是 |
| zentao_bulk_assign | 写 | 是 |
| zentao_story_advance | 写 | 是 |
| zentao_html_help | 本地 | 否 |
| zentao_tool_guide | 本地 | 否 |

## 云端验证（2026-09-10 第二轮）

| 工具 | 结果 | 说明 |
|------|------|------|
| zentao_context | ✅ | 返回 10 产品 + 10 项目，推荐 BIM Lite(22) / 筑星云国际站点(42) |
| zentao_cleanup_mcp | ✅ | dry_run 发现 1 个 bug（20494），0 stories/tasks/cases |
| zentao_bulk_assign | ✅ | 9344/20494/2201 自指派成功（幂等） |
| zentao_story_advance | ✅ | 9344 draft→active（review pass）；already 路径验证通过 |
| zentao_build_get | ✅ | HTML fallback 正常（build 98） |
| zentao_build_delete | ✅ | dry_run 返回 confirmToken + cascade 说明 |
| zentao_html_help | — | 纯本地，无需云端 |
| zentao_tool_guide | — | 纯本地，无需云端 |
| zentao_bulk_close | ⏭️ | 跳过（复用已验证的 close 路由，逻辑相同） |

## 最终状态

- 72 工具 / 72 handlers / 0 tsc 错误
- 6 项云端验证通过（context/cleanup/assign/advance/build_get/build_delete）
- 修复 3 个 bug：browse JSON 解析（name-only map）/ my-story-browse 空响应 / story_advance 多步→单步
