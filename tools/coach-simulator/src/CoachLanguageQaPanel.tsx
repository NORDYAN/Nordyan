import { useEffect, useState } from 'react';

import {
  NORDYAN_COACH_PROMPT_VERSIONS,
  type NordyanCoachPromptVersion,
} from '../shared/coachPromptVersions';
import { formatCoachMessageText } from '../shared/coachContracts';
import { fetchCoachServerStatus } from './coachLanguageService';
import {
  createEmptyManualRatings,
  clearManualReviews,
  findManualReview,
  loadManualReviews,
  MANUAL_REVIEW_DIMENSIONS,
  saveManualReview,
  type ManualReviewRecord,
} from './coachManualReviewStorage';
import {
  buildEvaluationExportReport,
  downloadEvaluationReport,
} from './exportEvaluationReport';
import {
  runBatchLanguageEvaluation,
  type BatchEvaluationResult,
  type BatchScenarioEvaluation,
} from './runBatchLanguageEvaluation';
import type { CoachLanguageProviderChoice } from './coachSimulator.types';

import './coachLanguageQa.css';

export function CoachLanguageQaPanel() {
  const [provider, setProvider] = useState<CoachLanguageProviderChoice>('mock');
  const [coachPromptVersion, setCoachPromptVersion] =
    useState<NordyanCoachPromptVersion>('nordyan-coach-v2');
  const [openAiConfigured, setOpenAiConfigured] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchEvaluationResult | null>(null);
  const [reviewTick, setReviewTick] = useState(0);

  useEffect(() => {
    void fetchCoachServerStatus().then((status) => {
      setOpenAiConfigured(status.openaiConfigured);
    });
  }, []);

  const handleRunBatch = async () => {
    setIsRunning(true);

    try {
      const result = await runBatchLanguageEvaluation({
        provider,
        coachPromptVersion,
      });
      setBatchResult(result);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveReview = (
    scenario: BatchScenarioEvaluation,
    variantIndex: number,
    ratings: ManualReviewRecord['ratings'],
    note: string,
  ) => {
    if (!batchResult) {
      return;
    }

    saveManualReview({
      scenarioId: scenario.scenarioId,
      variantIndex,
      coachPromptVersion: batchResult.coachPromptVersion,
      batchRunId: batchResult.batchRunId,
      ratings,
      note: note.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    setReviewTick((value) => value + 1);
  };

  const handleExport = () => {
    if (!batchResult) {
      return;
    }

    downloadEvaluationReport(buildEvaluationExportReport(batchResult));
  };

  const handleClearReviews = () => {
    clearManualReviews();
    setReviewTick((value) => value + 1);
  };

  void reviewTick;

  return (
    <div className="qa-page">
      <header className="qa-header">
        <div>
          <p className="simulator-eyebrow">Internal QA — synthetic scenarios only</p>
          <h1>Swedish Language QA</h1>
          <p className="simulator-subtitle">
            Batch-evaluate all scenarios with automated scoring and manual product review.
          </p>
        </div>
      </header>

      <section className="qa-controls simulator-panel">
        <div className="qa-control-grid">
          <label className="field">
            <span>Language provider</span>
            <select
              value={provider}
              onChange={(event) => setProvider(event.target.value as CoachLanguageProviderChoice)}
            >
              <option value="mock">Mock</option>
              <option value="openai" disabled={!openAiConfigured}>
                OpenAI {openAiConfigured ? '' : '(server not configured)'}
              </option>
            </select>
          </label>

          <label className="field">
            <span>Prompt version</span>
            <select
              value={coachPromptVersion}
              onChange={(event) =>
                setCoachPromptVersion(event.target.value as NordyanCoachPromptVersion)
              }
            >
              {NORDYAN_COACH_PROMPT_VERSIONS.map((version) => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="button-row">
          <button type="button" className="button-primary" onClick={() => void handleRunBatch()} disabled={isRunning}>
            {isRunning ? 'Running batch…' : 'Run all scenarios'}
          </button>
          <button type="button" className="button-secondary" onClick={handleExport} disabled={!batchResult}>
            Export JSON report
          </button>
          <button type="button" className="button-secondary" onClick={handleClearReviews}>
            Clear manual reviews
          </button>
        </div>

        {batchResult ? (
          <p className="qa-summary">
            Batch {batchResult.batchRunId} · {batchResult.scenarios.length} scenarios · provider{' '}
            {batchResult.provider} · prompt {batchResult.coachPromptVersion}
          </p>
        ) : null}
      </section>

      {batchResult?.scenarios.map((scenario) => (
        <ScenarioQaCard
          key={`${batchResult.batchRunId}-${scenario.scenarioId}`}
          scenario={scenario}
          batchRunId={batchResult.batchRunId}
          coachPromptVersion={batchResult.coachPromptVersion}
          onSaveReview={handleSaveReview}
        />
      ))}
    </div>
  );
}

function ScenarioQaCard({
  scenario,
  batchRunId,
  coachPromptVersion,
  onSaveReview,
}: {
  scenario: BatchScenarioEvaluation;
  batchRunId: string;
  coachPromptVersion: NordyanCoachPromptVersion;
  onSaveReview: (
    scenario: BatchScenarioEvaluation,
    variantIndex: number,
    ratings: ManualReviewRecord['ratings'],
    note: string,
  ) => void;
}) {
  return (
    <section className="qa-scenario simulator-panel">
      <div className="qa-scenario-header">
        <div>
          <h2>{scenario.scenarioLabel}</h2>
          <p className="scenario-description">
            {scenario.scenarioId} · coachGoal {scenario.decision.coachGoal} · action{' '}
            {scenario.decision.recommendedAction}
            {scenario.isQuiet ? ' · quiet scenario' : ''}
          </p>
        </div>
        <div className="qa-scenario-badges">
          <span className={scenario.factsPreserved ? 'badge pass' : 'badge fail'}>
            facts preserved
          </span>
          <span className={scenario.tonesCompatible ? 'badge pass' : 'badge fail'}>
            tone compatible
          </span>
          {scenario.repetitionFlags.length > 0 ? (
            <span className="badge warn">near-duplicate variants</span>
          ) : null}
        </div>
      </div>

      <div className={`qa-variant-grid cols-${scenario.variants.length}`}>
        {scenario.variants.map((variant) => {
          const review = findManualReview(
            scenario.scenarioId,
            variant.variantIndex,
            coachPromptVersion,
            batchRunId,
          );

          return (
            <VariantQaCard
              key={variant.variantIndex}
              scenario={scenario}
              variant={variant}
              review={review}
              onSaveReview={(ratings, note) =>
                onSaveReview(scenario, variant.variantIndex, ratings, note)
              }
            />
          );
        })}
      </div>
    </section>
  );
}

function VariantQaCard({
  scenario,
  variant,
  review,
  onSaveReview,
}: {
  scenario: BatchScenarioEvaluation;
  variant: BatchScenarioEvaluation['variants'][number];
  review?: ManualReviewRecord;
  onSaveReview: (ratings: ManualReviewRecord['ratings'], note: string) => void;
}) {
  const [ratings, setRatings] = useState(review?.ratings ?? createEmptyManualRatings());
  const [note, setNote] = useState(review?.note ?? '');

  useEffect(() => {
    setRatings(review?.ratings ?? createEmptyManualRatings());
    setNote(review?.note ?? '');
  }, [review]);

  const messageText = formatCoachMessageText(variant.response.message);

  return (
    <article className="qa-variant-card">
      <header className="qa-variant-header">
        <strong>Variant {variant.variantIndex + 1}</strong>
        <span>{variant.response.meta.provider}</span>
      </header>

      <div className="coach-output compact">
        <p className="coach-headline">{variant.response.message.headline}</p>
        <p className="coach-message">{messageText}</p>
        {variant.response.message.recommendedAction ? (
          <p className="coach-action">Åtgärd: {variant.response.message.recommendedAction}</p>
        ) : null}
      </div>

      <div className="qa-score-block">
        <h3>Automated criteria</h3>
        <p className={variant.automatedPass ? 'qa-pass-label pass' : 'qa-pass-label fail'}>
          {variant.automatedPass ? 'PASS' : 'FAIL'}
        </p>
        <ul className="qa-criteria-list">
          {variant.automatedScores.map((criterion) => (
            <li key={criterion.id} className={criterion.pass ? 'pass' : 'fail'}>
              <span>{criterion.label}</span>
              <span>{criterion.pass ? 'pass' : 'fail'}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="qa-score-block">
        <h3>Manual review (1–5)</h3>
        {MANUAL_REVIEW_DIMENSIONS.map((dimension) => (
          <label key={dimension.id} className="field qa-rating-field">
            <span>{dimension.label}</span>
            <input
              type="number"
              min={1}
              max={5}
              value={ratings[dimension.id] || ''}
              onChange={(event) =>
                setRatings((current) => ({
                  ...current,
                  [dimension.id]: Number(event.target.value),
                }))
              }
            />
          </label>
        ))}

        <label className="field">
          <span>Reviewer note</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
        </label>

        <button
          type="button"
          className="button-secondary"
          onClick={() => onSaveReview(ratings, note)}
        >
          Save review
        </button>
        {review ? <p className="qa-saved-note">Saved locally · {review.updatedAt}</p> : null}
      </div>

      <p className="qa-decision-lock">
        Decision locked: {scenario.decision.topStrength} / {scenario.decision.topOpportunity}
      </p>
    </article>
  );
}

export function getStoredReviewCount(): number {
  return loadManualReviews().length;
}
