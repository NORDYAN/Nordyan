import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { selectVisiblePendingValue } from './pending-onboarding-visible';

describe('selectVisiblePendingValue', () => {
  it('shows the unowned bundle to an unauthenticated viewer', () => {
    assert.equal(
      selectVisiblePendingValue({
        viewerUserId: null,
        ownedByViewer: 'owned',
        unowned: 'unowned',
      }),
      'unowned',
    );
  });

  it('shows the current user bound bundle when authenticated', () => {
    assert.equal(
      selectVisiblePendingValue({
        viewerUserId: 'user-a',
        ownedByViewer: 'owned-a',
        unowned: null,
      }),
      'owned-a',
    );
  });

  it('shows the current-session unowned bundle when the authenticated user has no owned record', () => {
    assert.equal(
      selectVisiblePendingValue({
        viewerUserId: 'user-a',
        ownedByViewer: null,
        unowned: 'unowned',
      }),
      'unowned',
    );
  });

  it('never shows another user bound bundle to the viewer', () => {
    assert.equal(
      selectVisiblePendingValue({
        viewerUserId: 'user-b',
        ownedByViewer: null,
        unowned: null,
      }),
      null,
    );
  });
});
