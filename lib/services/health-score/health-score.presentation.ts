/** UX interpretation bands from the approved Health Score design spec. */
export function getHealthScoreBandLabel(score: number): string {
  if (score >= 85) {
    return 'Utmärkt hälsonivå';
  }

  if (score >= 70) {
    return 'Bra hälsonivå';
  }

  if (score >= 55) {
    return 'Måttlig hälsonivå';
  }

  if (score >= 40) {
    return 'Förbättringspotential';
  }

  return 'Börjar här';
}

export function formatBodyFatPercent(bodyFatPct: number): string {
  const rounded = Math.round(bodyFatPct * 10) / 10;
  const display = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${display}%`;
}
