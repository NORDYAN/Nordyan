/**
 * Normalizes user-entered decimal text for display and parsing.
 * Accepts both "." and "," as decimal separators. Does not round.
 */
export function normalizeMeasurementDecimalInput(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.replace(',', '.');
}

export function parseMeasurementNumericInput(text: string): number | null {
  const normalized = normalizeMeasurementDecimalInput(text);
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export function isPositiveMeasurementInput(text: string): boolean {
  const parsed = parseMeasurementNumericInput(text);
  return parsed !== null && parsed > 0;
}

export function getTodayLocalDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
