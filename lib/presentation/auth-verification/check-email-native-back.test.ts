import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { shouldPreventCheckEmailNativeBack } from './check-email-native-back';

describe('shouldPreventCheckEmailNativeBack', () => {
  it('blocks native back and pop without blocking explicit replace or navigate', () => {
    assert.equal(shouldPreventCheckEmailNativeBack('GO_BACK'), true);
    assert.equal(shouldPreventCheckEmailNativeBack('POP'), true);
    assert.equal(shouldPreventCheckEmailNativeBack('REPLACE'), false);
    assert.equal(shouldPreventCheckEmailNativeBack('NAVIGATE'), false);
    assert.equal(shouldPreventCheckEmailNativeBack('PUSH'), false);
  });
});
