import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

describe('auth callback temporary runtime trace', () => {
  it('keeps the diagnostic helper DEV-only and free of secrets', () => {
    const trace = fs.readFileSync(
      path.join(process.cwd(), 'lib/presentation/auth-verification/auth-callback-trace.ts'),
      'utf8',
    );
    assert.match(trace, /\[nordyan-auth-trace\]/);
    assert.match(trace, /__DEV__/);
    assert.match(trace, /console\.warn/);
    assert.doesNotMatch(trace, /access_token|refresh_token|emailRedirectTo/);
  });

  it('wires callback traces without embedding console calls or secrets in the screen', () => {
    const callback = fs.readFileSync(path.join(process.cwd(), 'app/auth/callback.tsx'), 'utf8');
    assert.match(callback, /logNordyanAuthTrace\('callback\.mount'\)/);
    assert.match(callback, /logNordyanAuthTrace\('callback\.params'/);
    assert.match(callback, /logNordyanAuthTrace\('callback\.start-decision'/);
    assert.match(callback, /logNordyanAuthTrace\('callback\.completion\.start'\)/);
    assert.match(callback, /logNordyanAuthTrace\('callback\.replace\.root'\)/);
    assert.match(callback, /toAuthCallbackFailureTraceDetails/);
    assert.match(callback, /logNordyanAuthTrace\('callback\.unmount'\)/);
    assert.doesNotMatch(callback, /console\.(log|info|debug|warn|error)/);
    assert.doesNotMatch(callback, /access_token|refresh_token/);
  });
});
