import {
  COACH_PROMPT_PAYLOAD_VERSION,
  type CoachPromptPayload,
  FORBIDDEN_REQUEST_FIELDS,
  isNordyanCoachPromptVersion,
  resolveCoachPromptVersion,
  type NordyanCoachPromptVersion,
} from '../../../../shared/coach-language';

const ALLOWED_TOP_LEVEL = new Set([
  'version',
  'locale',
  'generatedAt',
  'decision',
  'supportingFacts',
  'instructions',
  'coachPromptVersion',
]);

const ALLOWED_DECISION = new Set([
  'topStrength',
  'topOpportunity',
  'coachGoal',
  'recommendedAction',
  'confidence',
  'insufficientData',
  'silenceEligible',
]);

const ALLOWED_INSTRUCTIONS = new Set(['role', 'tone', 'maxWords']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasUnexpectedKeys(object: Record<string, unknown>, allowed: Set<string>): string[] {
  return Object.keys(object).filter((key) => !allowed.has(key));
}

export class CoachRequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CoachRequestValidationError';
  }
}

export function validateCoachPromptPayload(body: unknown): CoachPromptPayload {
  if (!isPlainObject(body)) {
    throw new CoachRequestValidationError('Request body must be a JSON object.');
  }

  for (const forbidden of FORBIDDEN_REQUEST_FIELDS) {
    if (forbidden in body) {
      throw new CoachRequestValidationError(`Unexpected field: ${forbidden}`);
    }
  }

  const unexpectedTopLevel = hasUnexpectedKeys(body, ALLOWED_TOP_LEVEL);
  if (unexpectedTopLevel.length > 0) {
    throw new CoachRequestValidationError(`Unexpected fields: ${unexpectedTopLevel.join(', ')}`);
  }

  if (body.version !== COACH_PROMPT_PAYLOAD_VERSION) {
    throw new CoachRequestValidationError(`Unsupported payload version: ${String(body.version)}`);
  }

  if (body.locale !== 'sv-SE') {
    throw new CoachRequestValidationError('Unsupported locale.');
  }

  if (typeof body.generatedAt !== 'string' || body.generatedAt.length === 0) {
    throw new CoachRequestValidationError('generatedAt must be a non-empty string.');
  }

  if (!isPlainObject(body.decision)) {
    throw new CoachRequestValidationError('decision must be an object.');
  }

  const unexpectedDecision = hasUnexpectedKeys(body.decision, ALLOWED_DECISION);
  if (unexpectedDecision.length > 0) {
    throw new CoachRequestValidationError(`Unexpected decision fields: ${unexpectedDecision.join(', ')}`);
  }

  if (!Array.isArray(body.supportingFacts) || !body.supportingFacts.every((item) => typeof item === 'string')) {
    throw new CoachRequestValidationError('supportingFacts must be an array of strings.');
  }

  if (!isPlainObject(body.instructions)) {
    throw new CoachRequestValidationError('instructions must be an object.');
  }

  const unexpectedInstructions = hasUnexpectedKeys(body.instructions, ALLOWED_INSTRUCTIONS);
  if (unexpectedInstructions.length > 0) {
    throw new CoachRequestValidationError(
      `Unexpected instructions fields: ${unexpectedInstructions.join(', ')}`,
    );
  }

  const decision = body.decision;

  for (const field of ['topStrength', 'topOpportunity', 'coachGoal', 'recommendedAction'] as const) {
    if (typeof decision[field] !== 'string') {
      throw new CoachRequestValidationError(`decision.${field} must be a string.`);
    }
  }

  if (typeof decision.confidence !== 'number' || !Number.isFinite(decision.confidence)) {
    throw new CoachRequestValidationError('decision.confidence must be a number.');
  }

  if (typeof decision.insufficientData !== 'boolean' || typeof decision.silenceEligible !== 'boolean') {
    throw new CoachRequestValidationError('decision boolean flags must be boolean.');
  }

  if (typeof body.instructions.role !== 'string' || typeof body.instructions.tone !== 'string') {
    throw new CoachRequestValidationError('instructions.role and instructions.tone must be strings.');
  }

  if (typeof body.instructions.maxWords !== 'number' || !Number.isFinite(body.instructions.maxWords)) {
    throw new CoachRequestValidationError('instructions.maxWords must be a number.');
  }

  return body as CoachPromptPayload;
}

export function validateCoachGenerateRequest(body: unknown): {
  payload: CoachPromptPayload;
  coachPromptVersion: NordyanCoachPromptVersion;
} {
  if (!isPlainObject(body)) {
    throw new CoachRequestValidationError('Request body must be a JSON object.');
  }

  if ('coachPromptVersion' in body && body.coachPromptVersion !== undefined) {
    if (!isNordyanCoachPromptVersion(body.coachPromptVersion)) {
      throw new CoachRequestValidationError('Unsupported coachPromptVersion.');
    }
  }

  const coachPromptVersion = resolveCoachPromptVersion(body.coachPromptVersion);
  const payload = validateCoachPromptPayload(body);

  return {
    payload,
    coachPromptVersion,
  };
}
