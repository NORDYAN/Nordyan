import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('Coach Ask answer presentation', () => {
  it('renders blank-line paragraphs as separate Text blocks with spacing', () => {
    const helper = source('lib/presentation/coach-home/coach-ask-answer-paragraphs.ts');
    const composer = source('components/coach/CoachAskComposer.tsx');
    const theme = source('theme/coach.ts');

    assert.ok(helper.includes('split(/\\n(?:[ \\t]*\\n)+/)'));
    assert.match(composer, /splitCoachAskAnswerParagraphs\(askState\.answer\)/);
    assert.match(composer, /styles\.answerParagraphs/);
    assert.match(theme, /answerBodySize: 14/);
    assert.match(theme, /answerBodyLineHeight: 21/);
    assert.match(theme, /answerParagraphGap: 10/);
    assert.match(composer, /gap: coachTypography\.answerParagraphGap/);
    assert.doesNotMatch(composer, /markdown|Markdown|react-native-markdown/i);
    assert.doesNotMatch(helper, /replace\(|trim\(/);
  });

  it('does not change Coach server or prompt files', () => {
    const service = source('services/coach-language/src/openaiCoachAskService.ts');
    const v15 = source('services/coach-language/src/instructions/nordyan-coach-ask-v1.5.ts');
    const composer = source('components/coach/CoachAskComposer.tsx');

    assert.match(service, /buildNordyanCoachAskV16SystemInstructions|NORDYAN_COACH_ASK_V15/);
    assert.match(v15, /nordyan-coach-ask-v1\.5/);
    assert.doesNotMatch(composer, /openaiCoachAskService|nordyan-coach-ask/);
  });
});
