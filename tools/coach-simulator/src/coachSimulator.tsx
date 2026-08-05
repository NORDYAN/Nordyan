import { useEffect, useMemo, useState } from 'react';

import { COACH_SCENARIOS, DEFAULT_COACH_SCENARIO } from './coachScenarioLibrary';
import { runCoachDecisionEngine } from './coachDecisionEngine';
import { buildCoachPromptPayload, serializeCoachPrompt } from './coachPromptBuilder';
import { fetchCoachServerStatus } from './coachLanguageService';
import {
  DEFAULT_COACH_SIMULATOR_TEST_DATA,
  runCoachSimulatorPipeline,
} from './runCoachSimulatorPipeline';
import type {
  ActivityTrend,
  CoachLanguageProviderChoice,
  CoachSimulatorRunResult,
  CoachSimulatorTestData,
  CoachTrend,
  DataCompleteness,
} from './coachSimulator.types';
import { formatCoachMessageText } from '../shared/coachContracts';

import './coachSimulator.css';

type NumericField =
  | 'healthScore'
  | 'healthScoreDelta'
  | 'weightKg'
  | 'weightDeltaKg'
  | 'waistCm'
  | 'waistDeltaCm'
  | 'neckCm'
  | 'daysSinceLastMeasurement';
type TextField = 'activity' | 'sleep';

const TREND_OPTIONS: CoachTrend[] = ['improving', 'declining', 'stable'];
const ACTIVITY_TREND_OPTIONS: ActivityTrend[] = ['up', 'down', 'stable'];
const DATA_COMPLETENESS_OPTIONS: DataCompleteness[] = ['complete', 'insufficient'];

export function CoachSimulator() {
  const [testData, setTestData] = useState<CoachSimulatorTestData>(DEFAULT_COACH_SIMULATOR_TEST_DATA);
  const [selectedScenarioId, setSelectedScenarioId] = useState(DEFAULT_COACH_SCENARIO.id);
  const [result, setResult] = useState<CoachSimulatorRunResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [languageProvider, setLanguageProvider] = useState<CoachLanguageProviderChoice>('mock');
  const [openAiConfigured, setOpenAiConfigured] = useState(false);

  const previewDecision = useMemo(() => runCoachDecisionEngine(testData), [testData]);
  const previewPrompt = useMemo(
    () => serializeCoachPrompt(buildCoachPromptPayload(previewDecision)),
    [previewDecision],
  );

  useEffect(() => {
    void fetchCoachServerStatus().then((status) => {
      setOpenAiConfigured(status.openaiConfigured);
    });
  }, []);

  useEffect(() => {
    if (!openAiConfigured && languageProvider === 'openai') {
      setLanguageProvider('mock');
    }
  }, [languageProvider, openAiConfigured]);

  const updateNumber = (field: NumericField, value: string) => {
    const parsed = Number(value);
    setTestData((current) => ({
      ...current,
      [field]: Number.isFinite(parsed) ? parsed : 0,
    }));
  };

  const updateText = (field: TextField, value: string) => {
    setTestData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleScenarioSelect = (scenarioId: string) => {
    const scenario = COACH_SCENARIOS.find((item) => item.id === scenarioId);
    if (!scenario) {
      return;
    }

    setSelectedScenarioId(scenario.id);
    setTestData(scenario.data);
    setResult(null);
  };

  const handleGenerate = async (regenerate = false) => {
    setIsGenerating(true);

    try {
      const pipelineResult = await runCoachSimulatorPipeline(testData, {
        provider: languageProvider,
        existingDecision: regenerate && result ? result.decision : undefined,
        existingPrompt: regenerate && result ? result.prompt : undefined,
      });
      setResult(pipelineResult);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setSelectedScenarioId(DEFAULT_COACH_SCENARIO.id);
    setTestData(DEFAULT_COACH_SIMULATOR_TEST_DATA);
    setResult(null);
  };

  const activeResult = result ?? {
    decision: previewDecision,
    prompt: buildCoachPromptPayload(previewDecision),
    coachMessage: {
      headline: 'Förhandsvisning',
      body: 'Tryck Generate Coach för att rendera coach-output.',
      recommendedAction: null,
      tone: 'neutral' as const,
      promptVersion: 'nordyan-coach-v1',
    },
    meta: {
      provider: 'mock' as const,
      latencyMs: 0,
      promptVersion: 'nordyan-coach-v1',
      validationStatus: 'valid' as const,
      usedFallback: false,
      requestId: 'preview',
    },
  };

  const coachText = formatCoachMessageText(activeResult.coachMessage);

  return (
    <div className="simulator-page">
      <header className="simulator-header">
        <div>
          <p className="simulator-eyebrow">Internal tool — not for production</p>
          <h1>NORDYAN Coach Simulator</h1>
          <p className="simulator-subtitle">
            Test Data → Decision Engine → CoachPromptPayload → Server Language Service → Coach Output
          </p>
        </div>
      </header>

      <main className="simulator-grid">
        <section className="simulator-panel">
          <h2>Test Data</h2>

          <label className="field">
            <span>Language provider</span>
            <select
              value={languageProvider}
              onChange={(event) =>
                setLanguageProvider(event.target.value as CoachLanguageProviderChoice)
              }
            >
              <option value="mock">Mock</option>
              <option value="openai" disabled={!openAiConfigured}>
                OpenAI {openAiConfigured ? '' : '(server not configured)'}
              </option>
            </select>
          </label>

          <label className="field">
            <span>Scenario library</span>
            <select value={selectedScenarioId} onChange={(event) => handleScenarioSelect(event.target.value)}>
              {COACH_SCENARIOS.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.label}
                </option>
              ))}
            </select>
          </label>

          <p className="scenario-description">
            {COACH_SCENARIOS.find((scenario) => scenario.id === selectedScenarioId)?.description}
          </p>

          <div className="scenario-buttons">
            {COACH_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                className={
                  selectedScenarioId === scenario.id ? 'scenario-chip active' : 'scenario-chip'
                }
                onClick={() => handleScenarioSelect(scenario.id)}
              >
                {scenario.label}
              </button>
            ))}
          </div>

          <label className="field">
            <span>Health Score</span>
            <input
              type="number"
              value={testData.healthScore}
              onChange={(event) => updateNumber('healthScore', event.target.value)}
            />
          </label>

          <label className="field">
            <span>Health Score delta</span>
            <input
              type="number"
              value={testData.healthScoreDelta}
              onChange={(event) => updateNumber('healthScoreDelta', event.target.value)}
            />
          </label>

          <label className="field">
            <span>Trend</span>
            <select
              value={testData.trend}
              onChange={(event) =>
                setTestData((current) => ({
                  ...current,
                  trend: event.target.value as CoachTrend,
                }))
              }
            >
              {TREND_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Weight (kg)</span>
            <input
              type="number"
              value={testData.weightKg}
              onChange={(event) => updateNumber('weightKg', event.target.value)}
            />
          </label>

          <label className="field">
            <span>Weight delta (kg)</span>
            <input
              type="number"
              value={testData.weightDeltaKg}
              onChange={(event) => updateNumber('weightDeltaKg', event.target.value)}
            />
          </label>

          <label className="field">
            <span>Waist (cm)</span>
            <input
              type="number"
              value={testData.waistCm}
              onChange={(event) => updateNumber('waistCm', event.target.value)}
            />
          </label>

          <label className="field">
            <span>Waist delta (cm)</span>
            <input
              type="number"
              value={testData.waistDeltaCm}
              onChange={(event) => updateNumber('waistDeltaCm', event.target.value)}
            />
          </label>

          <label className="field">
            <span>Neck (cm)</span>
            <input
              type="number"
              value={testData.neckCm}
              onChange={(event) => updateNumber('neckCm', event.target.value)}
            />
          </label>

          <label className="field">
            <span>Activity</span>
            <input
              type="text"
              value={testData.activity}
              onChange={(event) => updateText('activity', event.target.value)}
            />
          </label>

          <label className="field">
            <span>Activity trend</span>
            <select
              value={testData.activityTrend}
              onChange={(event) =>
                setTestData((current) => ({
                  ...current,
                  activityTrend: event.target.value as ActivityTrend,
                }))
              }
            >
              {ACTIVITY_TREND_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Sleep</span>
            <input
              type="text"
              value={testData.sleep}
              onChange={(event) => updateText('sleep', event.target.value)}
            />
          </label>

          <label className="field">
            <span>Days since last measurement</span>
            <input
              type="number"
              value={testData.daysSinceLastMeasurement}
              onChange={(event) => updateNumber('daysSinceLastMeasurement', event.target.value)}
            />
          </label>

          <label className="field">
            <span>Data completeness</span>
            <select
              value={testData.dataCompleteness}
              onChange={(event) =>
                setTestData((current) => ({
                  ...current,
                  dataCompleteness: event.target.value as DataCompleteness,
                }))
              }
            >
              {DATA_COMPLETENESS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className="button-row">
            <button
              type="button"
              className="button-primary"
              onClick={() => void handleGenerate(false)}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating…' : 'Generate Coach'}
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => void handleGenerate(true)}
              disabled={isGenerating || !result}
            >
              Generate Again
            </button>
            <button type="button" className="button-secondary" onClick={handleReset}>
              Reset
            </button>
          </div>
        </section>

        <section className="simulator-panel">
          <h2>Decision Engine</h2>

          <dl className="metric-list">
            <div className="metric-row">
              <dt>topStrength</dt>
              <dd>{activeResult.decision.topStrength}</dd>
            </div>
            <div className="metric-row">
              <dt>topOpportunity</dt>
              <dd>{activeResult.decision.topOpportunity}</dd>
            </div>
            <div className="metric-row">
              <dt>coachGoal</dt>
              <dd>{activeResult.decision.coachGoal}</dd>
            </div>
            <div className="metric-row">
              <dt>recommendedAction</dt>
              <dd>{activeResult.decision.recommendedAction}</dd>
            </div>
            <div className="metric-row">
              <dt>confidence</dt>
              <dd>{activeResult.decision.confidence}%</dd>
            </div>
            <div className="metric-row">
              <dt>insufficientData</dt>
              <dd>{activeResult.decision.insufficientData ? 'true' : 'false'}</dd>
            </div>
            <div className="metric-row">
              <dt>silenceEligible</dt>
              <dd>{activeResult.decision.silenceEligible ? 'true' : 'false'}</dd>
            </div>
          </dl>

          <h3>supportingFacts</h3>
          <ul className="facts-list">
            {activeResult.decision.supportingFacts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>

          <h3>Prompt Preview</h3>
          <pre className="code-block">{result ? serializeCoachPrompt(activeResult.prompt) : previewPrompt}</pre>
        </section>

        <section className="simulator-panel">
          <h2>Coach Output</h2>

          <dl className="metric-list meta-list">
            <div className="metric-row">
              <dt>provider</dt>
              <dd>{activeResult.meta.provider}</dd>
            </div>
            <div className="metric-row">
              <dt>latency</dt>
              <dd>{activeResult.meta.latencyMs} ms</dd>
            </div>
            <div className="metric-row">
              <dt>prompt version</dt>
              <dd>{activeResult.meta.promptVersion}</dd>
            </div>
            <div className="metric-row">
              <dt>validation</dt>
              <dd>{activeResult.meta.validationStatus}</dd>
            </div>
            <div className="metric-row">
              <dt>fallback</dt>
              <dd>{activeResult.meta.usedFallback ? 'yes' : 'no'}</dd>
            </div>
          </dl>

          <article className="coach-output">
            <p className="coach-label">NORDYAN Coach</p>
            {!activeResult.coachMessage.isQuiet ? (
              <p className="coach-headline">{activeResult.coachMessage.headline}</p>
            ) : null}
            <p className="coach-message">{coachText}</p>
            {activeResult.coachMessage.recommendedAction ? (
              <p className="coach-action">Åtgärd: {activeResult.coachMessage.recommendedAction}</p>
            ) : null}
          </article>
        </section>
      </main>
    </div>
  );
}
