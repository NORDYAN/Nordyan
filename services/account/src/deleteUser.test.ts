import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isUserNotFoundError } from './deleteUser';

describe('isUserNotFoundError', () => {
  it('treats 404 and user-not-found codes as already deleted', () => {
    assert.equal(isUserNotFoundError({ status: 404 }), true);
    assert.equal(isUserNotFoundError({ code: 'user_not_found' }), true);
    assert.equal(isUserNotFoundError({ message: 'User not found' }), true);
    assert.equal(isUserNotFoundError({ status: 500, message: 'internal' }), false);
    assert.equal(isUserNotFoundError(null), false);
  });
});
