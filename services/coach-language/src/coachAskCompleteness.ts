export const COACH_ASK_COMPLETENESS_FAILURES = [
  'empty',
  'provider_incomplete',
  'mid_word',
  'missing_terminal_punctuation',
] as const;

export type CoachAskCompletenessFailure = (typeof COACH_ASK_COMPLETENESS_FAILURES)[number];

export type CoachAskCompletenessResult =
  | { ok: true }
  | { ok: false; reason: CoachAskCompletenessFailure };

const TERMINAL_PUNCTUATION = /[.!?…%\)\]»"'”']$/u;
const ENDS_WITH_LETTER = /\p{L}$/u;

export function collectCoachAskOutputText(response: {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
}): string {
  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const parts: string[] = [];
  for (const item of response.output ?? []) {
    if (item.type !== 'message') {
      continue;
    }
    for (const content of item.content ?? []) {
      if (content.type === 'output_text' && typeof content.text === 'string') {
        parts.push(content.text);
      }
    }
  }
  return parts.join('').trim();
}

export function assessCoachAskCompleteness(input: {
  text: string | null | undefined;
  providerStatus?: string;
}): CoachAskCompletenessResult {
  if (input.providerStatus === 'incomplete') {
    return { ok: false, reason: 'provider_incomplete' };
  }

  const text = input.text?.trim() ?? '';
  if (!text) {
    return { ok: false, reason: 'empty' };
  }

  if (ENDS_WITH_LETTER.test(text)) {
    return { ok: false, reason: 'mid_word' };
  }

  if (!TERMINAL_PUNCTUATION.test(text)) {
    return { ok: false, reason: 'missing_terminal_punctuation' };
  }

  return { ok: true };
}
