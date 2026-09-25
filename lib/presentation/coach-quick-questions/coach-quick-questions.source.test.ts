import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function source(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

describe('Coach Quick Questions v1 source contracts', () => {
  it('taps the existing Coach Ask submission path with the localized question only', () => {
    const suggestions = source('components/coach/CoachAskSuggestions.tsx');
    const view = source('components/coach/CoachHomeView.tsx');
    const hook = source('lib/hooks/coach/useCoachQuestion.ts');
    const client = source('lib/services/coach-ask/client.ts');

    const hookQuick = source('lib/hooks/coach/useCoachQuickQuestions.ts');
    assert.match(hookQuick, /readCoachQuickQuestionRotation/);
    assert.match(hookQuick, /recordCoachQuickQuestionTrioShown/);
    assert.doesNotMatch(hookQuick, /from\('user_/);
    assert.match(suggestions, /onSubmit\(trimmed\)/);
    assert.match(suggestions, /slot\.question/);
    assert.doesNotMatch(suggestions, /quickQuestionId|questionId/);
    assert.match(view, /onSubmit=\{handleSubmitQuestion\}/);
    assert.match(view, /useCoachQuickQuestions/);
    assert.doesNotMatch(view, /CoachFocusCard|CoachPlanCard/);
    assert.doesNotMatch(view, /useCoachHomeBodyFatDiscovery/);
    assert.doesNotMatch(view, /insteadToday|prioritizeToday|whyFocus/);
    assert.match(hook, /submitQuestion: \(question: string\)/);
    assert.match(hook, /requestCoachAsk/);
    assert.match(hook, /composeAskRequest\(userId, question, locale\)/);
    assert.doesNotMatch(hook, /quickQuestion/);
    assert.match(client, /\/ask/);
    assert.doesNotMatch(client, /quick-question|quickQuestion/);
  });

  it('does not change Daily Focus, Weekly Focus, Coach backend, or Ask contracts', () => {
    const domainSelector = source('lib/domain/coach-quick-questions/coach-quick-question-selector.ts');
    const load = source('lib/presentation/coach-quick-questions/coach-quick-questions.load.ts');
    const view = source('components/coach/CoachHomeView.tsx');

    assert.doesNotMatch(view, /selectDailyFocus|DAILY_FOCUS_ACTION_BANK/);
    assert.doesNotMatch(domainSelector, /from\('user_daily_focus'\)|from\('user_weekly_focus'\)/);
    assert.doesNotMatch(load, /services\/coach-language/);
    assert.doesNotMatch(load, /COACH_ASK_PAYLOAD_VERSION/);
    assert.match(load, /mapWeeklyCheckInForCoachAsk/);
    assert.match(load, /mapBodyFatReferenceForCoachAsk/);
  });

  it('keeps the typed composer on the existing Ask path', () => {
    const composer = source('components/coach/CoachAskComposer.tsx');
    const screen = source('app/(tabs)/coach.tsx');
    assert.match(composer, /onSubmit\(trimmed\)/);
    assert.match(screen, /submitQuestion\(question\)/);
    assert.match(screen, /CoachHomeView/);
  });

  it('uses the localized questions-for-you heading, not Snabbfrågor', () => {
    const presentation = source('lib/presentation/coach-home/coach-home.presentation.ts');
    const sv = source('lib/i18n/resources/sv.ts');
    const nb = source('lib/i18n/resources/nb.ts');
    assert.match(presentation, /t\('coach\.ask\.quickQuestions'\)/);
    assert.match(sv, /'coach\.ask\.quickQuestions': 'Frågor för dig'/);
    assert.match(nb, /'coach\.ask\.quickQuestions': 'Spørsmål for deg'/);
    assert.doesNotMatch(sv, /Snabbfrågor/);
    assert.doesNotMatch(nb, /Hurtigspørsmål/);
    assert.doesNotMatch(sv, /'coach\.focus\.section'/);
    assert.doesNotMatch(nb, /'coach\.plan\.section'/);
  });
});

describe('Coach Home focus bridge source contracts', () => {
  it('places a compact Home bridge after the header and navigates without focus payload', () => {
    const view = source('components/coach/CoachHomeView.tsx');
    const card = source('components/coach/CoachFocusBridgeCard.tsx');
    const presentation = source('lib/presentation/coach-home/coach-home.presentation.ts');

    assert.match(view, /CoachFocusBridgeCard/);
    assert.match(view, /homeHrefWithScrollToTop\(\)/);
    assert.match(view, /router\.push\(homeHrefWithScrollToTop\(\)\)/);
    assert.doesNotMatch(view, /CoachFocusCard|CoachPlanCard/);
    assert.doesNotMatch(view, /dailyFocus|weeklyFocus|needScore/);
    assert.doesNotMatch(card, /complete|swap|undo/);
    assert.doesNotMatch(card, /daily-focus|weekly-focus/);
    assert.doesNotMatch(card, /summary\.focus\.title|summary\.plan\.title/);
    assert.match(presentation, /t\('coach\.bridge\.title'\)/);
    assert.match(presentation, /t\('coach\.bridge\.body'\)/);
    assert.match(presentation, /t\('coach\.bridge\.cta'\)/);
    assert.doesNotMatch(presentation, /daily-focus\.service|weekly-focus\.service/);
    assert.doesNotMatch(presentation, /selectDailyFocus|selectWeeklyFocus/);
  });

  it('does not resurrect removed Focus/Plan cards or Daily/Weekly Focus services on Coach', () => {
    const view = source('components/coach/CoachHomeView.tsx');
    const hook = source('lib/hooks/coach/useCoachHome.ts');
    const screen = source('app/(tabs)/coach.tsx');
    const card = source('components/coach/CoachFocusBridgeCard.tsx');

    assert.equal(existsSync(path.join(root, 'components/coach/CoachFocusCard.tsx')), false);
    assert.equal(existsSync(path.join(root, 'components/coach/CoachPlanCard.tsx')), false);
    assert.doesNotMatch(view, /services\/daily-focus|services\/weekly-focus/);
    assert.doesNotMatch(hook, /services\/daily-focus|services\/weekly-focus/);
    assert.doesNotMatch(screen, /services\/daily-focus|services\/weekly-focus/);
    assert.doesNotMatch(card, /services\/daily-focus|services\/weekly-focus/);
    assert.doesNotMatch(card, /CoachFocusCard|CoachPlanCard/);
  });
});
