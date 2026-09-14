// ZenTao Legacy MCP - configuration loaded from environment variables.
// All values come from process.env, optionally pre-filled from an env file
// (see loadEnvFile below). Logs go to stderr (never stdout, which is
// reserved for the MCP stdio protocol).

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

// Default env file location for standalone deployments (created by the
// installer; override with ZENTAO_ENV_FILE). Format: KEY=VALUE per line,
// '#' comments and optional 'export ' prefix / surrounding quotes allowed.
export const DEFAULT_ENV_FILE = path.join(os.homedir(), '.local', 'share', 'zentao-legacy-mcp', 'env');

/**
 * Load KEY=VALUE pairs from an env file into process.env WITHOUT overriding
 * values that are already set (real environment always wins).
 * Returns the path actually loaded, or null if no env file was found.
 * Never throws: a broken env file degrades to "not loaded" + a stderr warning.
 */
export function loadEnvFile(explicitPath?: string): string | null {
  const file = explicitPath || process.env.ZENTAO_ENV_FILE || DEFAULT_ENV_FILE;
  if (explicitPath && (!fs.existsSync(explicitPath) || !fs.statSync(explicitPath).isFile())) {
    logErr('ZENTAO_ENV_FILE points to a missing file: ' + explicitPath);
    return null;
  }
  if (!fs.existsSync(file)) return null;
  let text: string;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (e: any) {
    logErr('env file not readable (' + file + '): ' + e.message);
    return null;
  }
  let applied = 0;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const noExport = line.replace(/^export\s+/, '');
    const eq = noExport.indexOf('=');
    if (eq <= 0) continue;
    const key = noExport.slice(0, eq).trim();
    let val = noExport.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!key) continue;
    if (process.env[key] === undefined || process.env[key] === '') {
      process.env[key] = val;
      applied++;
    }
  }
  logErr('env file loaded: ' + file + ' (' + applied + ' vars applied, existing env vars take precedence)');
  return file;
}

export interface ZentaoConfig {
  baseUrl: string;
  account: string;
  password: string;
  requestType: 'PATH_INFO' | 'GET';
  debug: boolean;
  keepLogin: boolean;
  // --- Content marking (development-environment only; default OFF) ---
  // Master switch for ALL machine markers ([MCP] title prefix, MCP-AUTO keywords,
  // color, "via" comment notes). OFF in the delivered MCP (real data); set
  // ZENTAO_MARKERS=1 only in development environments.
  markersEnabled: boolean;
  markerPrefix: string;
  markerColor: string;
  markTitles: boolean;
  operator: string;
  // Per-request network timeout in ms (prevents hangs). Defaults to 30000.
  requestTimeoutMs: number;
  // Deployment profile: auto-discovered on first run (products/projects/modules/
  // builds/features), cached locally.
  profilePath: string;
  profileTtlMs: number;
  // Pre-injected session id (test framework optimization): when set, the client
  // uses this sid directly WITHOUT issuing a login POST. The test parent process
  // logs in once and passes the sid to the child, avoiding repeated logins that
  // trip the server's short-window login-rate protection.
  injectedSid: string;
}

export function logErr(...args: unknown[]): void {
  // stderr only - stdout is the MCP protocol channel
  process.stderr.write('[zentao-mcp] ' + args.join(' ') + '\n');
}

function required(name: string, hint?: string): string {
  const v = process.env[name];
  if (!v || v.trim() === '') {
    logErr('Missing required environment variable: ' + name);
    logErr('  ' + (hint || 'Set it via env var or in the env file ' + DEFAULT_ENV_FILE + ' before starting this server.'));
    throw new Error('Missing required env var: ' + name);
  }
  return v.trim();
}

function optional(name: string, def: string): string {
  const v = process.env[name];
  return (v && v.trim() !== '') ? v.trim() : def;
}

export function loadConfig(): ZentaoConfig {
  loadEnvFile();
  const base = required('ZENTAO_BASE_URL', 'The URL of your ZenTao deployment, e.g. https://zentao.example.com (set it via env var or the env file ' + DEFAULT_ENV_FILE + ')').replace(/\/+$/, '');
  const requestType = optional('ZENTAO_REQUEST_TYPE', 'PATH_INFO');
  return {
    baseUrl: base,
    account: required('ZENTAO_ACCOUNT', 'Your ZenTao login account (username).'),
    password: required('ZENTAO_PASSWORD', 'Your ZenTao login password.'),
    // Optional overrides
    requestType: (requestType === 'GET' ? 'GET' : 'PATH_INFO'),
    debug: optional('ZENTAO_DEBUG', '0') === '1',
    keepLogin: optional('ZENTAO_KEEP_LOGIN', '1') === '1',
    // --- Content marking (development-environment only) ---
    // Master switch, DEFAULT OFF: the delivered MCP operates REAL data and must
    // not carry machine markers ([MCP] title prefix / MCP-AUTO keywords / color /
    // "via" notes). Set ZENTAO_MARKERS=1 ONLY in development environments where
    // agent-created test entities need to be filterable / batch-cleanable.
    markersEnabled: optional('ZENTAO_MARKERS', '0') === '1',
    markerPrefix: optional('ZENTAO_MARKER_PREFIX', 'MCP-AUTO'),
    markerColor: optional('ZENTAO_MARKER_COLOR', '#e74c3c'),
    // Sub-switch for the [MCP] title prefix, meaningful only when markersEnabled.
    // (Default '1' is historical; markers off ⇒ no title prefix regardless.)
    markTitles: optional('ZENTAO_MARK_TITLES', '1') === '1',
    operator: optional('ZENTAO_OPERATOR', ''),
    // Per-request network timeout in ms (prevents hangs). Defaults to 30000.
    requestTimeoutMs: parseInt(optional('ZENTAO_REQUEST_TIMEOUT_MS', '30000'), 10) || 30000,
    // Pre-injected session id (test framework optimization).
    injectedSid: optional('ZENTAO_SID', ''),
    // Deployment profile cache (first-run discovery). Default lives next to the env file.
    profilePath: optional('ZENTAO_PROFILE_FILE', path.join(path.dirname(DEFAULT_ENV_FILE), 'profile.json')),
    profileTtlMs: (parseInt(optional('ZENTAO_PROFILE_TTL_HOURS', '24'), 10) || 24) * 3600 * 1000,
  };
}
