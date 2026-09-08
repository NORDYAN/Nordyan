import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('Beta 1 email actions source contracts', () => {
  it('opens feedback and integration mail without APIs, connect, or injected health data', () => {
    const profile = source('app/(tabs)/profile/index.tsx');
    const sources = source('app/(tabs)/profile/health-data-sources.tsx');
    const runtime = source('lib/presentation/support-mail/open-support-mail.runtime.ts');
    const mail = source('lib/presentation/support-mail/support-mail.ts');

    assert.match(profile, /mailto-feedback/);
    assert.match(profile, /mailto-help/);
    assert.match(profile, /buildFeedbackMailto\(\)/);
    assert.match(profile, /buildHelpAndSupportMailto\(\)/);
    assert.match(profile, /openMailtoUrl/);
    const mailPress = profile.slice(
      profile.indexOf('function handleProfileRowPress'),
      profile.indexOf('export default function ProfileMainScreen'),
    );
    assert.match(mailPress, /openMailtoUrl\(buildFeedbackMailto\(\)\)/);
    assert.match(mailPress, /openMailtoUrl\(buildHelpAndSupportMailto\(\)\)/);
    assert.doesNotMatch(mailPress, /session|profile\?|healthScore|user\.id/);

    assert.match(sources, /buildIntegrationSuggestionMailto/);
    assert.match(sources, /health\.sources\.suggest\.action/);
    assert.match(sources, /status="comingSoon"/);
    assert.doesNotMatch(sources, /handleConnectPress|health\.sources\.connect|status="disconnected"/);
    assert.doesNotMatch(sources, /fetch\(|supabase|from\('/);

    assert.match(runtime, /Linking\.canOpenURL/);
    assert.match(runtime, /Linking\.openURL/);
    assert.match(runtime, /Alert\.alert\(t\('common\.mailUnavailable'\)\)/);
    assert.match(mail, /buildFeedbackMailto|buildHelpAndSupportMailto|buildIntegrationSuggestionMailto/);
    assert.doesNotMatch(mail, /userId|healthScore|measurement|session/);
  });
});
