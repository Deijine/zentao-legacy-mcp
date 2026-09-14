#!/usr/bin/env node
// ZenTao Legacy MCP - entry point.
// stdio transport ONLY (no HTTP/SSE/ports). Credentials from env vars.
// All diagnostics go to stderr; stdout is reserved for the MCP JSON-RPC stream.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { loadConfig, logErr } from './config.js';
import { ZentaoClient } from './client.js';
import { TOOLS } from './tools.js';
import { HANDLERS } from './handlers.js';
type HandlerFn = (client: ZentaoClient, args: Record<string, unknown>) => Promise<Record<string, unknown>>;
const HANDLERS_T = HANDLERS as unknown as Record<string, HandlerFn>;

// Map an error to a machine-readable structure so MCP clients can branch on failure type
// (e.g. permission vs. auth vs. network vs. validation) rather than parsing the message.
// Each error now carries: code (machine), fix (human suggestion), retryable (auto-retry safe),
// needs_user (requires human action).
function classifyError(e: unknown): { code: string; fix: string; retryable: boolean; needs_user: boolean } {
  const msg = (e instanceof Error ? e.message : String(e)) || '';
  if (/locked|尝试次数|too many/i.test(msg)) return { code: 'account_locked', fix: '账号被锁定（5分钟3次登录限制）。等待 10 分钟后重试，或检查 ZENTAO_ACCOUNT/PASSWORD 是否正确。', retryable: false, needs_user: true };
  if (/rate limit/i.test(msg)) return { code: 'login_rate_limited', fix: '登录频率受限。等待后重试，MCP server 内部已有限流保护。', retryable: true, needs_user: false };
  if (/permission denied|user-deny/i.test(msg)) return { code: 'permission_denied', fix: '账号缺少该操作的功能点权限。请联系管理员在「权限设置」中开通对应功能点。', retryable: false, needs_user: true };
  if (/timed out|timeout/i.test(msg)) return { code: 'request_timeout', fix: '请求超时。网络抖动或禅道服务慢，可重试。', retryable: true, needs_user: false };
  if (/not found|404/i.test(msg)) return { code: 'not_found', fix: '实体不存在或已被删除（软删除后 URL+ID 仍可访问但列表不可见）。检查 ID 是否正确。', retryable: false, needs_user: false };
  if (/could not obtain.*token|kuid/i.test(msg)) return { code: 'csrf_token_missing', fix: '页面加载异常导致 CSRF token 获取失败。可重试；若持续失败检查页面是否被登录重定向。', retryable: true, needs_user: false };
  if (/must be|invalid|not in cloud config|not found for product/i.test(msg)) return { code: 'validation_error', fix: '参数不合法。检查必填字段和枚举值（见工具 schema 描述）。', retryable: false, needs_user: false };
  if (/login failed|session/i.test(msg)) return { code: 'auth_error', fix: '会话过期或登录失败。MCP server 会自动重登一次；若持续失败检查凭证。', retryable: true, needs_user: false };
  return { code: 'error', fix: '未知错误。查看详细 message 定位原因。', retryable: false, needs_user: false };
}
function classifyErrorCode(e: unknown): string { return classifyError(e).code; }

async function main(): Promise<void> {
  // Fail fast with a clear stderr message if config is missing,
  // so the client sees the reason instead of a silent hang.
  let config: import('./config.js').ZentaoConfig;
  try {
    config = loadConfig();
  } catch (e) {
    logErr('Startup aborted: ' + (e as Error).message);
    process.exit(1);
  }

  const client = new ZentaoClient(config);
  const toolNames = new Set(TOOLS.map(t => t.name));

  const server = new Server(
    { name: 'zentao-legacy-mcp', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  // NO login at startup (spec §3 "禁止启动预检"): the initialize handshake must not
  // hit the login endpoint. Login is lazy - the first actual business tool call triggers
  // it via ensureLogin(). This avoids a login POST for a server that's started but never
  // used, and removes the startup-prefetch double-login entirely.
  server.setRequestHandler(InitializeRequestSchema, async () => {
    return {
    protocolVersion: '2024-11-05',
    serverInfo: { name: 'zentao-legacy-mcp', version: '1.0.0' },
    capabilities: { tools: {} },
    instructions:
      'ZenTao (禅道) legacy biz4.1.3 session-based API. ' +
      'Use zentao_whoami first to verify the session. Product/Story/Bug CRUD tools are prefixed zentao_.',
    };
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const name = req.params.name;
    const args = req.params.arguments || {};
    if (!toolNames.has(name)) {
      return {
        content: [{ type: 'text', text: 'Unknown tool: ' + name }],
        isError: true,
      };
    }
    try {
      // Ensure a session exists before any network call. This is the LAZY login trigger
      // (spec §2/§3): the first business call logs in, subsequent calls reuse the
      // in-memory singleton. In-flight dedup in ensureLogin handles concurrent callers.
      if (process.env.ZENTAO_DEBUG === '1') process.stderr.write('[call] ' + name + ' loggedIn=' + client.loggedIn + '\n');
      await client.ensureLogin();
      if (process.env.ZENTAO_DEBUG === '1') process.stderr.write('[call] ' + name + ' after-ensure loggedIn=' + client.loggedIn + '\n');
      const handler = HANDLERS_T[name];
      const result = await handler(client, args);
      const text = JSON.stringify(result, null, 2);
      return { content: [{ type: 'text', text }] };
    } catch (e) {
      const _e = e as Error;
      // Distinguish error types for the retry decision (spec §3/§4):
      //   - CREDENTIAL error (wrong user/pass): NEVER re-login. Retrying burns the
      //     server's attempt-chances and accelerates lockout. Surface it immediately.
      //   - LOCKOUT / RATE-LIMIT: NEVER re-login (a new attempt resets the timer).
      //   - SESSION-EXPIRY (logged in, then session died mid-use): the view-JSON path
      //     already handles this internally (reset + re-login + retry once). This catch
      //     is a last-resort for expiry surfaced outside the view path. Retry ONCE.
      const msg = (e as Error).message || '';
      const isCredential = /用户名|密码|username|password|填写正确|incorrect/i.test(msg);
      const isLockout = /locked|尝试次数|too many|Auto-retry|rate limit|尝试机会/i.test(msg) || !!(client as unknown as { _lastLockoutMsg?: string })._lastLockoutMsg;
      if (process.env.ZENTAO_DEBUG === '1') process.stderr.write('[catch] ' + name + ' err=' + msg.slice(0,50) + ' loggedIn=' + client.loggedIn + ' cred=' + isCredential + ' lock=' + isLockout + '\n');

      if (!isCredential && !isLockout && /session|verifyRand|Non-JSON/i.test(msg) && !client.loggedIn) {
        // Genuine session-expiry (not a credential/lockout problem): one forced re-login + retry.
        try {
          if (process.env.ZENTAO_DEBUG === '1') process.stderr.write('[catch] ' + name + ' -> FORCED RELOGIN (session-expiry)\n');
          await client.ensureLogin(true);
          const result = await HANDLERS_T[name](client, args);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } catch (e2) {
          const cls = classifyError(e2);
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: { message: (e2 as Error).message, code: cls.code, fix: cls.fix, retryable: cls.retryable, needs_user: cls.needs_user } }, null, 2) }],
            isError: true,
          };
        }
      }
      logErr('Tool ' + name + ' failed: ' + (e as Error).message);
      const cls = classifyError(e);
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: { message: (e as Error).message, code: cls.code, fix: cls.fix, retryable: cls.retryable, needs_user: cls.needs_user } }, null, 2) }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logErr('zentao-legacy-mcp ready on stdio. base=' + config.baseUrl + ' account=' + config.account);
}

main().catch((e) => {
  logErr('Fatal: ' + (e && e.stack || e));
  process.exit(1);
});
