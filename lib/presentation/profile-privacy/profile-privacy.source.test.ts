import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('profile privacy deletion UX source contracts', () => {
  it('opens a native Alert from the screen CTA and only deletes from the destructive confirm', () => {
    const screen = source('app/(tabs)/profile/privacy.tsx');
    const handleDelete = screen.slice(
      screen.indexOf('const handleDeletePress'),
      screen.indexOf('return ('),
    );
    const runDelete = screen.slice(
      screen.indexOf('const runDelete'),
      screen.indexOf('const handleDeletePress'),
    );
    const cancelButton = handleDelete.slice(
      handleDelete.indexOf('{ text: copy.cancel'),
      handleDelete.indexOf("style: 'destructive'"),
    );
    const confirmButton = handleDelete.slice(handleDelete.indexOf("style: 'destructive'"));

    assert.match(handleDelete, /Alert\.alert\(copy\.alertTitle, copy\.alertMessage/);
    assert.match(cancelButton, /style: 'cancel'/);
    assert.doesNotMatch(cancelButton, /runDelete|deleteAccount|onPress/);
    assert.match(confirmButton, /style: 'destructive'/);
    assert.match(confirmButton, /void runDelete\(\)/);
    assert.doesNotMatch(handleDelete, /deleteAccount\(/);
    assert.match(runDelete, /await deleteAccount\(\)/);
    assert.match(screen, /<OnboardingBackButton/);
    assert.match(screen, /disabled=\{isDeleting\}/);
    assert.match(screen, /onPress=\{\(\) => router\.back\(\)\}/);
    assert.match(screen, /import \{ Ionicons \} from '@expo\/vector-icons'/);
    assert.match(screen, /<Ionicons/);
    assert.doesNotMatch(screen, /from 'react-native-webview'/);
    assert.doesNotMatch(screen, /<Modal/);
  });

  it('does not let the checkbox or unguarded CTA call deleteAccount', () => {
    const screen = source('app/(tabs)/profile/privacy.tsx');
    const checkbox = screen.slice(
      screen.indexOf('accessibilityRole="checkbox"'),
      screen.indexOf('styles.deleteButton'),
    );
    const cta = screen.slice(screen.indexOf('isDeleting ? copy.processing : copy.action'));

    assert.match(checkbox, /setUnderstood/);
    assert.doesNotMatch(checkbox, /runDelete|deleteAccount|Alert\.alert/);
    assert.match(cta, /onPress=\{handleDeletePress\}/);
    assert.match(cta, /disabled=\{!understood \|\| isDeleting\}/);
    assert.equal((screen.match(/await deleteAccount\(\)/g) ?? []).length, 1);
    assert.equal((screen.match(/void runDelete\(\)/g) ?? []).length, 1);
  });

  it('does not change account deletion services in this UX pass', () => {
    const screen = source('app/(tabs)/profile/privacy.tsx');
    const service = source('lib/services/account-delete/delete-current-account.ts');
    const runtime = source('lib/services/account-delete/delete-current-account.runtime.ts');
    const provider = source('providers/auth-provider.tsx');

    assert.match(screen, /const \{ deleteAccount \} = useAuth\(\)/);
    assert.match(service, /requestDelete\(\{ accessToken \}\)/);
    assert.match(runtime, /clearLocalData: clearDeletedUserLocalData/);
    assert.match(provider, /deleteCurrentAccountForApp/);
  });
});
