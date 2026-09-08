import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveLessHealthyFoodRelevant } from './less-healthy-food-relevance';

describe('lessHealthyFoodRelevant', () => {
  it('15. baseline two_three/four_six/daily is relevant without excellent eating', () => {
    assert.equal(
      resolveLessHealthyFoodRelevant({ lessHealthyFoodFrequency: 'two_three', eatingQuality: 2 }),
      true,
    );
    assert.equal(
      resolveLessHealthyFoodRelevant({ lessHealthyFoodFrequency: 'four_six', eatingQuality: null }),
      true,
    );
    assert.equal(
      resolveLessHealthyFoodRelevant({ lessHealthyFoodFrequency: 'daily', eatingQuality: 3 }),
      true,
    );
  });

  it('16. eatingQuality >= 4 suppresses stale baseline relevance', () => {
    assert.equal(
      resolveLessHealthyFoodRelevant({ lessHealthyFoodFrequency: 'daily', eatingQuality: 4 }),
      false,
    );
    assert.equal(
      resolveLessHealthyFoodRelevant({ lessHealthyFoodFrequency: 'daily', eatingQuality: 5 }),
      false,
    );
  });

  it('17. missing or weak evidence is false', () => {
    assert.equal(
      resolveLessHealthyFoodRelevant({ lessHealthyFoodFrequency: null, eatingQuality: 2 }),
      false,
    );
    assert.equal(
      resolveLessHealthyFoodRelevant({ lessHealthyFoodFrequency: 'once', eatingQuality: 2 }),
      false,
    );
    assert.equal(
      resolveLessHealthyFoodRelevant({ lessHealthyFoodFrequency: 'never', eatingQuality: 1 }),
      false,
    );
  });
});
