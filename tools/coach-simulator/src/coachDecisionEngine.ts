import type { CoachDecisionResult, CoachSimulatorTestData } from './coachSimulator.types';

const MEANINGFUL_DELTA = 0.5;

const LABELS = {
  waist: 'Midjemått',
  neck: 'Halsmått',
  weight: 'Vikt',
  activity: 'Aktivitet',
  healthScore: 'Health Score',
  stableBase: 'Stabil bas',
  sleep: 'Sömn',
  measurements: 'Mätningar',
} as const;

function normalizeSleepScore(sleep: string): number {
  const value = sleep.trim().toLowerCase();

  if (!value) {
    return 0;
  }

  if (value.includes('dålig') || value.includes('lag') || value.includes('låg')) {
    return 1;
  }

  if (value.includes('medel') || value.includes('ok')) {
    return 2;
  }

  return 3;
}

function normalizeActivityScore(activity: string): number {
  const value = activity.trim().toLowerCase();

  if (!value) {
    return 0;
  }

  if (value.includes('låg') || value.includes('lag') || value.includes('still')) {
    return 1;
  }

  if (value.includes('medel') || value.includes('måttlig')) {
    return 2;
  }

  return 3;
}

function hasInsufficientData(data: CoachSimulatorTestData): boolean {
  return data.dataCompleteness === 'insufficient';
}

function isStableDevelopment(data: CoachSimulatorTestData): boolean {
  return (
    data.trend === 'stable' &&
    Math.abs(data.healthScoreDelta) < MEANINGFUL_DELTA &&
    Math.abs(data.weightDeltaKg) < MEANINGFUL_DELTA &&
    Math.abs(data.waistDeltaCm) < MEANINGFUL_DELTA &&
    data.activityTrend === 'stable' &&
    normalizeSleepScore(data.sleep) > 1
  );
}

function hasConflictingSignals(data: CoachSimulatorTestData): boolean {
  const waistImproved = data.waistDeltaCm <= -MEANINGFUL_DELTA;
  const weightRegression = data.weightDeltaKg > MEANINGFUL_DELTA && !waistImproved;

  const positiveSignals = [
    data.healthScoreDelta > MEANINGFUL_DELTA,
    waistImproved,
    data.activityTrend === 'up',
  ].filter(Boolean).length;

  const negativeSignals = [
    data.healthScoreDelta < -MEANINGFUL_DELTA,
    weightRegression,
    data.waistDeltaCm > MEANINGFUL_DELTA,
    data.activityTrend === 'down',
  ].filter(Boolean).length;

  if (positiveSignals > 0 && negativeSignals > 0) {
    return true;
  }

  return data.healthScoreDelta > MEANINGFUL_DELTA && data.activityTrend === 'down';
}

function deriveTopStrength(data: CoachSimulatorTestData): string {
  if (hasInsufficientData(data)) {
    return '—';
  }

  if (data.waistDeltaCm <= -MEANINGFUL_DELTA) {
    return LABELS.waist;
  }

  if (data.trend === 'declining') {
    return LABELS.healthScore;
  }

  if (data.healthScoreDelta <= -MEANINGFUL_DELTA && data.activityTrend !== 'down') {
    return LABELS.healthScore;
  }

  if (data.activityTrend === 'up' || normalizeActivityScore(data.activity) >= 3) {
    return LABELS.activity;
  }

  if (data.trend === 'improving') {
    return LABELS.waist;
  }

  return LABELS.stableBase;
}

function deriveTopOpportunity(data: CoachSimulatorTestData): string {
  if (hasInsufficientData(data)) {
    return '—';
  }

  if (data.daysSinceLastMeasurement >= 14) {
    return LABELS.measurements;
  }

  if (hasConflictingSignals(data)) {
    return LABELS.activity;
  }

  if (normalizeSleepScore(data.sleep) <= 1) {
    return LABELS.sleep;
  }

  if (isStableDevelopment(data) && normalizeSleepScore(data.sleep) <= 2) {
    return LABELS.sleep;
  }

  if (data.activityTrend === 'down' || normalizeActivityScore(data.activity) <= 1) {
    return LABELS.activity;
  }

  if (data.trend === 'declining') {
    return normalizeSleepScore(data.sleep) <= 2 ? LABELS.sleep : LABELS.activity;
  }

  return LABELS.sleep;
}

function deriveCoachGoal(data: CoachSimulatorTestData): string {
  if (hasInsufficientData(data)) {
    return 'Tiga';
  }

  if (hasConflictingSignals(data) || isStableDevelopment(data)) {
    return 'Guida';
  }

  if (data.trend === 'declining' || data.healthScoreDelta <= -3) {
    return 'Stöd';
  }

  if (data.trend === 'improving') {
    return 'Motivate';
  }

  return 'Guida';
}

function deriveRecommendedAction(
  data: CoachSimulatorTestData,
  topStrength: string,
  topOpportunity: string,
  coachGoal: string,
): string {
  if (hasInsufficientData(data)) {
    return 'Ingen rekommendation';
  }

  if (topOpportunity === LABELS.measurements) {
    return 'Påminn om ny mätning';
  }

  if (hasConflictingSignals(data)) {
    return 'Balansera motstridiga signaler';
  }

  if (coachGoal === 'Stöd') {
    return 'Stöd återhämtning';
  }

  if (coachGoal === 'Motivate') {
    return 'Förstärk positiv trend';
  }

  if (
    coachGoal === 'Guida' &&
    topStrength === LABELS.waist &&
    data.waistDeltaCm <= -MEANINGFUL_DELTA &&
    data.trend !== 'improving'
  ) {
    return 'Bekräfta stabil trend';
  }

  if (topOpportunity === LABELS.sleep && normalizeSleepScore(data.sleep) <= 1) {
    return 'Adressera sömn';
  }

  if (isStableDevelopment(data)) {
    return 'Bekräfta stabil trend';
  }

  if (topOpportunity === LABELS.sleep) {
    return 'Adressera sömn';
  }

  if (topOpportunity === LABELS.activity) {
    return 'Öka daglig rörelse';
  }

  return 'Bekräfta stabil trend';
}

function buildSupportingFacts(
  data: CoachSimulatorTestData,
  topStrength: string,
  topOpportunity: string,
): string[] {
  if (hasInsufficientData(data)) {
    return ['Otillräcklig data för personlig rekommendation.'];
  }

  const facts: string[] = [];

  if (data.healthScoreDelta !== 0) {
    facts.push(
      `Health Score ${data.healthScoreDelta > 0 ? 'ökade' : 'minskade'} med ${Math.abs(data.healthScoreDelta)} poäng.`,
    );
  }

  if (Math.abs(data.waistDeltaCm) >= MEANINGFUL_DELTA) {
    facts.push(
      `Midjemått ${data.waistDeltaCm < 0 ? 'förbättrades' : 'ökade'} med ${Math.abs(data.waistDeltaCm).toFixed(1)} cm.`,
    );
  }

  if (Math.abs(data.weightDeltaKg) >= MEANINGFUL_DELTA) {
    facts.push(
      `Vikt ${data.weightDeltaKg > 0 ? 'ökade' : 'minskade'} med ${Math.abs(data.weightDeltaKg).toFixed(1)} kg.`,
    );
  }

  if (data.activityTrend !== 'stable') {
    facts.push(`Aktivitet ${data.activityTrend === 'up' ? 'ökade' : 'minskade'} jämfört med föregående period.`);
  }

  if (normalizeSleepScore(data.sleep) <= 2) {
    facts.push('Sömnen bedöms som otillräcklig.');
  }

  if (data.daysSinceLastMeasurement >= 14) {
    facts.push(`Senaste mätningen registrerades för ${data.daysSinceLastMeasurement} dagar sedan.`);
  }

  if (hasConflictingSignals(data)) {
    facts.push('Signalerna pekar åt olika håll och bör tolkas försiktigt.');
  }

  if (facts.length === 0) {
    facts.push('Ingen tydlig förändring jämfört med föregående period.');
  }

  facts.push(`Styrka att lyfta: ${topStrength}.`);
  facts.push(`Största möjlighet: ${topOpportunity}.`);

  return facts;
}

function deriveConfidence(data: CoachSimulatorTestData): number {
  if (hasInsufficientData(data)) {
    return 20;
  }

  const sleepScore = normalizeSleepScore(data.sleep);
  const activityScore = normalizeActivityScore(data.activity);
  const recencyPenalty = Math.min(30, data.daysSinceLastMeasurement * 1.2);
  const trendBonus =
    data.trend === 'improving' ? 8 : data.trend === 'stable' ? 2 : -8;
  const conflictPenalty = hasConflictingSignals(data) ? 8 : 0;
  const stableCap = isStableDevelopment(data) ? -6 : 0;

  const raw =
    54 +
    data.healthScore * 0.32 +
    sleepScore * 4 +
    activityScore * 4 +
    trendBonus -
    recencyPenalty -
    conflictPenalty +
    stableCap;

  const maxConfidence = isStableDevelopment(data) ? 82 : 98;

  return Math.max(35, Math.min(maxConfidence, Math.round(raw)));
}

function deriveSilenceEligible(data: CoachSimulatorTestData, confidence: number): boolean {
  if (hasInsufficientData(data)) {
    return true;
  }

  if (isStableDevelopment(data) && confidence < 72) {
    return false;
  }

  return false;
}

/** Deterministic simulator decision engine — same input always yields same output. */
export function runCoachDecisionEngine(data: CoachSimulatorTestData): CoachDecisionResult {
  if (hasInsufficientData(data)) {
    return {
      topStrength: '—',
      topOpportunity: '—',
      coachGoal: 'Tiga',
      recommendedAction: 'Ingen rekommendation',
      confidence: 20,
      supportingFacts: ['Otillräcklig data för personlig rekommendation.'],
      insufficientData: true,
      silenceEligible: true,
    };
  }

  const topStrength = deriveTopStrength(data);
  const topOpportunity = deriveTopOpportunity(data);
  const coachGoal = deriveCoachGoal(data);
  const recommendedAction = deriveRecommendedAction(data, topStrength, topOpportunity, coachGoal);
  const confidence = deriveConfidence(data);
  const supportingFacts = buildSupportingFacts(data, topStrength, topOpportunity);

  return {
    topStrength,
    topOpportunity,
    coachGoal,
    recommendedAction,
    confidence,
    supportingFacts,
    insufficientData: false,
    silenceEligible: deriveSilenceEligible(data, confidence),
  };
}
