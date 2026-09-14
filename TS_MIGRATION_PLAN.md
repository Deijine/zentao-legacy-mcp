# TypeScript 迁移计划（待登录逻辑定稿后执行）

> 状态：**待命**。登录问题收尾 + 专家确认后再执行，避免引入变量。

## 迁移目标
JS → TS，用 zod 强化 inputSchema 校验 + 接口类型定义，保持**行为完全一致**（25 工具、写链路、登录复用架构不变）。

## 目录结构
```
zentao-legacy-mcp/
├── src/
│   ├── index.ts          # 入口：Server 注册、懒加载拦截、错误分类
│   ├── client.ts         # ZentaoClient：内存单例 + 懒加载 + in-flight去重 + 会话过期重试
│   ├── config.ts         # loadConfig（env 读取）
│   ├── marker.ts         # MCP-AUTO 标记
│   ├── types.ts          # 接口类型：Product/Story/Bug/TestCase + ApiResponse<T>
│   └── tools/
│       ├── schemas.ts    # zod schemas（每个工具的 inputSchema 源）
│       ├── product.ts    # 产品 handlers
│       ├── story.ts      # 需求 handlers
│       ├── bug.ts        # Bug handlers（create/resolve/close/delete）
│       ├── testcase.ts   # 用例 handlers
│       └── index.ts      # HANDLERS 聚合 + TOOLS 元数据（从 zod 生成 inputSchema）
├── test/                 # 测试迁移到 .ts（或用 .mts）
├── tsconfig.json
├── package.json          # 加 devDeps: typescript/tsx/zod/@types/node; build script
└── README.md
```

## 关键设计
1. **zod 单一数据源**：每个工具的入参先定义 zod schema，`zod-to-json-schema` 生成 inputSchema，
   运行时 `.parse()` 校验。杜绝 Agent 传参类型错误（productID 字符串/数字、severity 范围等）。
2. **ApiResponse<T> 泛型**：`type ApiResponse<T> = { data: T } | { error: { message, code } }`，
   各 handler 返回类型明确。
3. **登录逻辑 1:1 迁移**：ensureLogin 的内存单例/in-flight/懒加载/凭证错误不重试——全部保留，
   只加类型。迁移后用同样的隔离测试 + --apply 验证行为不变。
4. **构建分发**：`tsc → dist/`，bin 指向 `node dist/index.js`；开发用 `tsx` 直接跑。

## 验证清单（迁移后必须全绿）
- [ ] `npm run check` 全量语法/类型检查通过
- [ ] 隔离测试：单登录 + 3 调用复用（1 登录）
- [ ] 并发去重：5 并发 = 1 登录
- [ ] 凭证错误不重试（mock 注入错误响应）
- [ ] 写链路 create→resolve→close 真实生效
- [ ] `--apply` 20 场景全绿
- [ ] 无硬编码密码

## 风险
- zod 校验可能**拒绝**某些当前 JS 版本接受的宽松入参 → 需对齐 25 工具的实际入参约定
- 迁移体量大（~1700 行）→ 分模块迁，每模块迁完即验证，不一次性全迁
