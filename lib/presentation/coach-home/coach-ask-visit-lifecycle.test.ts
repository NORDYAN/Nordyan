import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function source(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

describe('Coach Ask visit lifecycle', () => {
  it('keeps the current answer while Coach remains focused', () => {
    const screen = source('app/(tabs)/coach.tsx');
    const cleanupStart = screen.indexOf('return () => {');
    const resetCall = screen.indexOf('resetAsk();');

    assert.notEqual(cleanupStart, -1);
    assert.ok(resetCall > cleanupStart, 'Ask reset must run only in the focus-effect cleanup');
  });

  it('clears transient Ask state and composer draft when Coach loses focus', () => {
    const screen = source('app/(tabs)/coach.tsx');
    const view = source('components/coach/CoachHomeView.tsx');

    assert.match(screen, /useFocusEffect/);
    assert.match(screen, /return \(\) => \{\s*resetAsk\(\);/);
    assert.match(screen, /setAskVisitKey\(\(current\) => current \+ 1\)/);
    assert.match(screen, /askVisitKey=\{askVisitKey\}/);
    assert.match(view, /<CoachAskComposer\s+key=\{askVisitKey\}/);
  });

  it('prevents a blurred in-flight request from restoring an old answer', () => {
    const hook = source('lib/hooks/coach/useCoachQuestion.ts');

    assert.match(hook, /requestGenerationRef\.current \+= 1/);
    assert.match(
      hook,
      /if \(requestGenerationRef\.current !== requestGeneration\) \{\s*return;/,
    );
    assert.match(
      hook,
      /if \(requestGenerationRef\.current === requestGeneration\) \{\s*pendingRef\.current = false;/,
    );
  });

  it('does not reset persisted discovery, Focus, or Plan state on blur', () => {
    const screen = source('app/(tabs)/coach.tsx');

    assert.doesNotMatch(screen, /markCoachHomeBodyFatComparisonUsed|AsyncStorage/);
    assert.doesNotMatch(screen, /setState\(|refresh\(/);
    assert.match(screen, /const \{ state \} = useCoachHome\(\)/);
  });
});
