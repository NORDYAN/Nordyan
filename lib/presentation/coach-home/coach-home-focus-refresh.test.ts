import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { COACH_HOME_FOCUS_REFRESH } from './coach-home-focus-refresh';

describe('Coach Home focus refresh', () => {
  it('refetches persisted Focus and Plan on focus without a loading flash', () => {
    assert.equal(COACH_HOME_FOCUS_REFRESH.refetchOnFocus, true);
    assert.equal(COACH_HOME_FOCUS_REFRESH.showLoading, false);
  });

  it('wires the silent policy to the Coach Home focus lifecycle', () => {
    const hook = fs.readFileSync(
      path.join(process.cwd(), 'lib/hooks/coach/useCoachHome.ts'),
      'utf8',
    );

    assert.match(hook, /useFocusEffect\(/);
    assert.match(hook, /fetchHomeRef\.current\(\{/);
    assert.match(hook, /showLoading:\s*COACH_HOME_FOCUS_REFRESH\.showLoading/);
    assert.match(hook, /requestId !== requestIdRef\.current/);
    assert.match(hook, /!showLoading && current\.status === 'ready'/);
  });
});
