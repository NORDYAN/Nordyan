import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { splitCoachAskAnswerParagraphs } from './coach-ask-answer-paragraphs';

describe('splitCoachAskAnswerParagraphs', () => {
  it('splits blank-line separated answers into separate paragraphs without rewriting text', () => {
    const first = 'Första stycket med ett\nvanligt radbryt.';
    const second = 'Andra stycket.';
    const answer = `${first}\n\n${second}`;

    assert.deepEqual(splitCoachAskAnswerParagraphs(answer), [first, second]);
    assert.equal(splitCoachAskAnswerParagraphs(answer).join('\n\n'), answer);
  });

  it('keeps a single paragraph when there is no blank line', () => {
    const answer = 'En mening.\nNästa rad i samma stycke.';
    assert.deepEqual(splitCoachAskAnswerParagraphs(answer), [answer]);
  });

  it('treats extra blank lines as paragraph boundaries only', () => {
    assert.deepEqual(splitCoachAskAnswerParagraphs('A\n\n\nB'), ['A', 'B']);
    assert.deepEqual(splitCoachAskAnswerParagraphs('A\n \nB'), ['A', 'B']);
  });
});
