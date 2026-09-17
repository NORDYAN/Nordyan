/**
 * Splits a Coach Ask answer on blank-line paragraph boundaries only.
 * Single line breaks stay inside a paragraph. Content is not rewritten.
 */
export function splitCoachAskAnswerParagraphs(answer: string): string[] {
  const paragraphs = answer.split(/\n(?:[ \t]*\n)+/);
  return paragraphs.filter((paragraph) => paragraph.length > 0);
}
