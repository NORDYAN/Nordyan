import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, it } from 'node:test';

import { routes } from '../../../constants/routes';
import {
  HOME_SCROLL_TO_TOP_PARAM,
  consumeHomeScrollToTopIntent,
  homeHrefWithScrollToTop,
} from './home-scroll-to-top';

afterEach(() => {
  while (consumeHomeScrollToTopIntent()) {
    // Drain any leftover one-shot intent between tests.
  }
});

describe('homeHrefWithScrollToTop', () => {
  it('targets Home with an explicit scroll-to-top param and no focus payload', () => {
    const href = homeHrefWithScrollToTop('visit-1');
    assert.equal(href.pathname, routes.home);
    assert.equal(href.params[HOME_SCROLL_TO_TOP_PARAM], 'visit-1');
    assert.equal('dailyFocus' in href.params, false);
    assert.equal('weeklyFocus' in href.params, false);
  });
});

describe('consumeHomeScrollToTopIntent', () => {
  it('does nothing until Coach explicitly requests scroll-to-top', () => {
    assert.equal(consumeHomeScrollToTopIntent(), false);
  });

  it('is one-shot so later Home focus or refetches do not keep forcing the top', () => {
    homeHrefWithScrollToTop('visit-2');
    assert.equal(consumeHomeScrollToTopIntent(), true);
    assert.equal(consumeHomeScrollToTopIntent(), false);
    assert.equal(consumeHomeScrollToTopIntent(), false);
  });

  it('works again for a repeated Coach CTA', () => {
    homeHrefWithScrollToTop('first');
    assert.equal(consumeHomeScrollToTopIntent(), true);
    homeHrefWithScrollToTop('second');
    assert.equal(consumeHomeScrollToTopIntent(), true);
    assert.equal(consumeHomeScrollToTopIntent(), false);
  });
});

describe('Home scroll-to-top source contracts', () => {
  function source(relativePath: string): string {
    return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
  }

  it('applies scroll-to-top only for the Coach CTA, not for normal Home tab opens', () => {
    const home = source('app/(tabs)/home.tsx');
    const coach = source('components/coach/CoachHomeView.tsx');
    const tabs = source('app/(tabs)/_layout.tsx');

    assert.match(coach, /router\.push\(homeHrefWithScrollToTop\(\)\)/);
    assert.match(home, /consumeHomeScrollToTopIntent\(\)/);
    assert.match(home, /scrollRef\.current\?\.scrollTo\(\{ y: 0, animated: false \}\)/);
    assert.match(home, /useFocusEffect/);
    assert.match(home, /router\.setParams\(\{ scrollToTop: undefined \}\)/);
    assert.doesNotMatch(home, /useScrollToTop/);
    assert.doesNotMatch(home, /setTimeout|setInterval/);
    assert.doesNotMatch(tabs, /useScrollToTop|consumeHomeScrollToTopIntent|scrollToTop/);
    assert.doesNotMatch(home, /selectDailyFocus|selectWeeklyFocus/);
    assert.doesNotMatch(coach, /DailyFocusCard|WeeklyFocusCard/);
  });
});
