import type { NordyanCoachPromptVersion } from '../shared/coachPromptVersions';
import type { ManualReviewRecord } from './coachManualReviewStorage';
import type { BatchEvaluationResult } from './runBatchLanguageEvaluation';
import { findManualReview } from './coachManualReviewStorage';

const FORBIDDEN_EXPORT_PATTERNS = [
  /OPENAI_API_KEY/i,
  /sk-[a-zA-Z0-9]{10,}/,
  /"email"\s*:/i,
  /"userId"\s*:/i,
  /"measurementHistory"\s*:/i,
];

export type EvaluationExportReport = {
  exportedAt: string;
  batchRunId: string;
  coachPromptVersion: NordyanCoachPromptVersion;
  provider: string;
  scenarios: Array<{
    scenarioId: string;
    scenarioLabel: string;
    decision: BatchEvaluationResult['scenarios'][number]['decision'];
    promptVersion: NordyanCoachPromptVersion;
    provider: string;
    isQuiet: boolean;
    variants: Array<{
      variantIndex: number;
      message: BatchEvaluationResult['scenarios'][number]['variants'][number]['response']['message'];
      meta: BatchEvaluationResult['scenarios'][number]['variants'][number]['response']['meta'];
      validationResults: BatchEvaluationResult['scenarios'][number]['variants'][number]['automatedScores'];
      automatedPass: boolean;
      manualReview?: ManualReviewRecord;
    }>;
    repetitionFlags: BatchEvaluationResult['scenarios'][number]['repetitionFlags'];
    tonesCompatible: boolean;
    factsPreserved: boolean;
  }>;
};

export function buildEvaluationExportReport(
  batch: BatchEvaluationResult,
): EvaluationExportReport {
  return {
    exportedAt: new Date().toISOString(),
    batchRunId: batch.batchRunId,
    coachPromptVersion: batch.coachPromptVersion,
    provider: batch.provider,
    scenarios: batch.scenarios.map((scenario) => ({
      scenarioId: scenario.scenarioId,
      scenarioLabel: scenario.scenarioLabel,
      decision: scenario.decision,
      promptVersion: batch.coachPromptVersion,
      provider: batch.provider,
      isQuiet: scenario.isQuiet,
      variants: scenario.variants.map((variant) => ({
        variantIndex: variant.variantIndex,
        message: variant.response.message,
        meta: variant.response.meta,
        validationResults: variant.automatedScores,
        automatedPass: variant.automatedPass,
        manualReview: findManualReview(
          scenario.scenarioId,
          variant.variantIndex,
          batch.coachPromptVersion,
          batch.batchRunId,
        ),
      })),
      repetitionFlags: scenario.repetitionFlags,
      tonesCompatible: scenario.tonesCompatible,
      factsPreserved: scenario.factsPreserved,
    })),
  };
}

export function assertExportReportIsSafe(report: EvaluationExportReport): void {
  const serialized = JSON.stringify(report);

  for (const pattern of FORBIDDEN_EXPORT_PATTERNS) {
    if (pattern.test(serialized)) {
      throw new Error(`Export report contains forbidden content: ${pattern}`);
    }
  }
}

export function downloadEvaluationReport(report: EvaluationExportReport): void {
  assertExportReportIsSafe(report);

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `nordyan-coach-qa-${report.batchRunId}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
