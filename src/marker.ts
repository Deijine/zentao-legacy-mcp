// ZenTao Legacy MCP - content marking helpers.
// Every create/modify writes a machine marker so cloud-side operators can
// filter (by keyword prefix), trace (by timestamp) and batch-clean MCP output.
import type { ZentaoConfig } from './config.js';

// Compact timestamp: YYYYMMDDHHmmss (local)
function stamp(): string {
  const d = new Date();
  const p = (n: number, w = 2): string => String(n).padStart(w, '0');
  return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}

// The unique per-operation marker token, e.g. "MCP-AUTO-20260908153012-operator"
export function makeToken(config: ZentaoConfig): string {
  const prefix = config.markerPrefix || 'MCP-AUTO';
  const op = config.operator || config.account || 'anon';
  return prefix + '-' + stamp() + '-' + op;
}

function isMcpToken(t: string): boolean {
  // matches <prefix>-<digits>-<op>
  return /^[A-Za-z][\w]*-\d{14}-[\w-]+$/.test(t);
}

// Append a marker token into a keywords string without duplicating existing MCP tokens.
// Keeps any pre-existing (human) keywords; only one MCP token is retained (latest wins).
// When markers are disabled (delivered MCP / real data), returns the existing
// keywords unchanged — no MCP-AUTO token is written.
export function mergeKeywords(existing: string | undefined | null, token: string, config: ZentaoConfig): string {
  if (!config.markersEnabled) return String(existing || '').trim();
  const existingTokens = String(existing || '').split(/\s+/).filter(Boolean);
  const prefix = token.split('-').slice(0, 1).join('-') + '-';
  const human = existingTokens.filter(t => !t.startsWith(prefix) && !isMcpToken(t));
  // Keep the newest MCP token (the one we're writing now)
  return [...human, token].join(' ');
}

// For title marking (only on create, when markers are enabled): prepend "[MCP]".
export function markTitle(title: string, config: ZentaoConfig): string {
  if (!config.markersEnabled || !config.markTitles) return title;
  if (String(title).includes('[MCP]')) return title;
  return '[MCP] ' + title;
}

// For product code (products have no keywords field): prefix "mcpt_" to make filterable.
export function markProductCode(code: string, config: ZentaoConfig): string {
  if (!config.markersEnabled || !config.markTitles) return code;
  if (String(code).startsWith('mcpt_')) return code;
  return 'mcpt_' + stamp() + '_' + code;
}

// A short annotation appended to resolve/close comments for traceability.
// Returns '' when markers are disabled (delivered MCP / real data).
export function markerNote(config: ZentaoConfig, token: string): string {
  if (!config.markersEnabled) return '';
  return ' [via ' + token + ']';
}

export { stamp };
