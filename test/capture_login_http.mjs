#!/usr/bin/env node
// capture_login_http.mjs — Save the FULL login HTTP exchange (GET page + POST body +
// Set-Cookie responses) to files, for diffing a SUCCESS vs FAILURE.
//
// Usage:
//   node test/capture_login_http.mjs <outfile-prefix>     # does ONE login, saves artifacts
//
// Then:  diff <prefix>_success/* <prefix>_fail/*
//
// This is a DIAGNOSTIC tool. Run it ALONE (no other login activity) to avoid
// cross-process collisions that pollute the account's attempt counter.
import { ZentaoClient } from '../src/client.js';
import { writeFileSync, mkdirSync } from 'node:fs';

const prefix = process.argv[2] || '/tmp/zentao-capture';
mkdirSync(prefix, { recursive: true });

let n = 0;
const realFetch = globalThis.fetch.bind(globalThis);
const spyFetch = async (url, init = {}) => {
  const u = String(url);
  const res = await realFetch(url, init);
  if (u.includes('/user-login.html')) {
    const tag = (init.method === 'POST') ? 'post' : 'get';
    const idx = ++n;
    writeFileSync(prefix + '/req_' + idx + '_' + tag + '.txt',
      'URL: ' + u + '\nMETHOD: ' + (init.method || 'GET') + '\n\nHEADERS:\n' +
      JSON.stringify(init.headers || {}, null, 2) + '\n\nBODY:\n' +
      (init.body ? (typeof init.body === 'string' ? init.body : init.body.toString()) : '(none)') + '\n');
    // Capture the response Set-Cookie + status
    const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    const bodyText = await res.clone().text();
    writeFileSync(prefix + '/res_' + idx + '_' + tag + '.txt',
      'STATUS: ' + res.status + '\n\nSET-COOKIE:\n' + setCookies.join('\n') + '\n\nRESPONSE BODY:\n' +
      bodyText.slice(0, 2000) + '\n');
    // Reconstruct a response with the body re-readable
    return new Response(bodyText, { status: res.status, headers: res.headers });
  }
  return res;
};

const c = new ZentaoClient(
  {
    baseUrl: process.env.ZENTAO_BASE_URL,
    account: process.env.ZENTAO_ACCOUNT,
    password: process.env.ZENTAO_PASSWORD,
    keepLogin: true,
  },
  spyFetch
);
c.config.debug = true;
try {
  await c.ensureLogin(true);
  writeFileSync(prefix + '/_result.txt', 'SUCCESS sid=' + (c.zentaosid || '') + '\n');
  console.log('SUCCESS, artifacts in ' + prefix);
} catch (e) {
  writeFileSync(prefix + '/_result.txt', 'FAILED ' + e.message + '\n');
  console.log('FAILED: ' + e.message + ' (artifacts in ' + prefix + ')');
}
