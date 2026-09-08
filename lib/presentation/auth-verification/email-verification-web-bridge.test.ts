import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';

import { EMAIL_VERIFICATION_NATIVE_CALLBACK } from '../../services/auth/auth-redirect';

const websiteDir = path.join(process.cwd(), 'website/auth/callback');
const htmlPath = path.join(websiteDir, 'index.html');
const bridgePath = path.join(websiteDir, 'bridge.js');

type BridgeModule = {
  FORWARDED_PARAMS: string[];
  NATIVE_CALLBACK: string;
  resolveEmailVerificationBridgeView: (
    searchParams: URLSearchParams,
  ) => { kind: 'error' } | { kind: 'ready'; code: string; sbFlowId: string | null };
  buildNativeEmailVerificationCallbackUrl: (
    view: { kind: 'error' } | { kind: 'ready'; code: string; sbFlowId: string | null },
  ) => string | null;
  bindEmailVerificationBridge: (
    doc: {
      getElementById: (id: string) => {
        textContent: string;
        hidden: boolean;
        disabled: boolean;
        addEventListener: (type: string, handler: (event: { preventDefault: () => void }) => void) => void;
      } | null;
    },
    search: string,
    openUrl: (url: string) => void,
  ) => { kind: 'error' } | { kind: 'ready'; code: string; sbFlowId: string | null };
};

async function loadBridge(): Promise<BridgeModule> {
  return (await import(pathToFileURL(bridgePath).href)) as BridgeModule;
}

function createDoc() {
  const nodes = {
    'bridge-title': { textContent: '', hidden: false, disabled: false, listeners: [] as Array<(event: { preventDefault: () => void }) => void>, addEventListener(_type: string, handler: (event: { preventDefault: () => void }) => void) { this.listeners.push(handler); } },
    'bridge-body': { textContent: '', hidden: false, disabled: false, listeners: [] as Array<(event: { preventDefault: () => void }) => void>, addEventListener() {} },
    'bridge-help': { textContent: '', hidden: false, disabled: false, listeners: [] as Array<(event: { preventDefault: () => void }) => void>, addEventListener() {} },
    'open-nordyan': { textContent: 'Öppna NORDYAN', hidden: true, disabled: false, listeners: [] as Array<(event: { preventDefault: () => void }) => void>, addEventListener(_type: string, handler: (event: { preventDefault: () => void }) => void) { this.listeners.push(handler); } },
  };

  return {
    nodes,
    getElementById(id: string) {
      return nodes[id as keyof typeof nodes] ?? null;
    },
  };
}

describe('email verification website bridge', () => {
  it('forwards only the allowlisted native callback params', async () => {
    const bridge = await loadBridge();
    assert.deepEqual(bridge.FORWARDED_PARAMS, ['code', 'sb_flow_id']);
    assert.equal(bridge.NATIVE_CALLBACK, EMAIL_VERIFICATION_NATIVE_CALLBACK);

    const ready = bridge.resolveEmailVerificationBridgeView(
      new URLSearchParams({
        code: 'pkce-code',
        sb_flow_id: 'flow-1',
        access_token: 'must-not-forward',
        extra: 'drop',
      }),
    );
    assert.deepEqual(ready, { kind: 'ready', code: 'pkce-code', sbFlowId: 'flow-1' });
    assert.equal(
      bridge.buildNativeEmailVerificationCallbackUrl(ready),
      'nordyan://auth/callback?code=pkce-code&sb_flow_id=flow-1',
    );
  });

  it('renders the error state when the code is missing', async () => {
    const bridge = await loadBridge();
    const doc = createDoc();
    const opened: string[] = [];

    const view = bridge.bindEmailVerificationBridge(doc, '', (url) => {
      opened.push(url);
    });

    assert.deepEqual(view, { kind: 'error' });
    assert.equal(doc.nodes['bridge-title'].textContent, 'Länken kunde inte användas');
    assert.match(doc.nodes['bridge-body'].textContent, /ogiltig eller har gått ut/);
    assert.equal(doc.nodes['open-nordyan'].hidden, true);
    assert.deepEqual(opened, []);
    assert.equal(doc.nodes['open-nordyan'].listeners.length, 0);
  });

  it('renders the error state for Supabase error params', async () => {
    const bridge = await loadBridge();
    assert.deepEqual(
      bridge.resolveEmailVerificationBridgeView(new URLSearchParams({ error: 'access_denied' })),
      { kind: 'error' },
    );
    assert.deepEqual(
      bridge.resolveEmailVerificationBridgeView(
        new URLSearchParams({ error_code: 'otp_expired', code: 'ignored-when-error' }),
      ),
      { kind: 'error' },
    );
    assert.deepEqual(
      bridge.resolveEmailVerificationBridgeView(
        new URLSearchParams({ error_description: 'expired', code: 'ignored-when-error' }),
      ),
      { kind: 'error' },
    );
  });

  it('opens the native callback only after an explicit button click', async () => {
    const bridge = await loadBridge();
    const doc = createDoc();
    const opened: string[] = [];

    bridge.bindEmailVerificationBridge(doc, '?code=pkce%2Bcode', (url) => {
      opened.push(url);
    });

    assert.equal(doc.nodes['bridge-title'].textContent, 'Bekräfta din e-postadress');
    assert.match(doc.nodes['bridge-body'].textContent, /Öppna NORDYAN/);
    assert.equal(doc.nodes['open-nordyan'].hidden, false);
    assert.deepEqual(opened, []);

    doc.nodes['open-nordyan'].listeners[0]({ preventDefault() {} });
    assert.equal(opened.length, 1);
    assert.equal(opened[0], 'nordyan://auth/callback?code=pkce%2Bcode');
  });

  it('never renders the auth code in visible copy', async () => {
    const bridge = await loadBridge();
    const doc = createDoc();
    const secret = 'visible-code-must-not-appear';

    bridge.bindEmailVerificationBridge(doc, `?code=${secret}`, () => {});

    const visible = [
      doc.nodes['bridge-title'].textContent,
      doc.nodes['bridge-body'].textContent,
      doc.nodes['bridge-help'].textContent,
      doc.nodes['open-nordyan'].textContent,
    ].join('\n');
    assert.equal(visible.includes(secret), false);
  });

  it('keeps the static page free of auto-navigation and Supabase session APIs', () => {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const script = fs.readFileSync(bridgePath, 'utf8');

    assert.doesNotMatch(html, /window\.location\s*=/);
    assert.doesNotMatch(html, /location\.href\s*=/);
    assert.doesNotMatch(html, /location\.replace/);
    assert.match(html, /bindEmailVerificationBridge\(document, window\.location\.search/);
    assert.match(html, /window\.location\.assign\(url\)/);
    assert.doesNotMatch(script, /window\.location/);
    assert.doesNotMatch(script, /addEventListener\('DOMContentLoaded'/);
    assert.doesNotMatch(html, /supabase/i);
    assert.doesNotMatch(script, /supabase/i);
    assert.doesNotMatch(script, /verifyOtp|exchangeCodeForSession|createClient/);
    assert.doesNotMatch(html, /gtag|analytics|plausible/i);
    assert.doesNotMatch(script, /console\.(log|info|debug)/);
    assert.doesNotMatch(html, /access_token|refresh_token/);
    assert.doesNotMatch(html, /\$\{view\.code\}|textContent\s*=\s*.*code/);
  });
});
