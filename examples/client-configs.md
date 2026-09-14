# 客户端接入配置示例

所有客户端都只需要指向**独立单文件**（`dist/standalone/zentao-legacy-mcp.cjs`，Node 直接运行，无需安装依赖）。凭据一律走服务端 env 文件（`~/.local/share/zentao-legacy-mcp/env`，chmod 600）或客户端环境，**配置里不写账号密码**。

## Claude Desktop / Claude Code

`claude_desktop_config.json`（或 `~/.claude/claude.json` 的 mcpServers）:

```json
{ "mcpServers": { "zentao-legacy": { "command": "node", "args": ["/ABS/PATH/dist/standalone/zentao-legacy-mcp.cjs"] } } }
```

## Codex

`~/.codex/config.toml`:

```toml
[mcp_servers.zentao-legacy]
command = "node"
args = ["/ABS/PATH/dist/standalone/zentao-legacy-mcp.cjs"]
```

## DeepSeek IDE / DSH

DSH 使用 bundle 目录（`~/.dsh/bundles/<name>/` 放 `package.json` 指向独立包）；
其他 IDE 的 MCP 配置格式同 Claude Desktop（mcpServers JSON）。

## npm 全局安装（可选）

```bash
npm install -g zentao-legacy-mcp
# 配置里直接:
# { "command": "zentao-legacy-mcp" }
```
