import { WEEKLY_FOCUS_AREAS, type WeeklyFocusArea } from '../weekly-focus';

import { DAILY_FOCUS_ACTION_COPY } from './daily-focus-action-copy';
import type { DailyFocusActionId } from './daily-focus-action-definitions';
import {
  DAILY_FOCUS_INTENSITIES,
  DAILY_FOCUS_MODES,
  type DailyFocusActionDefinition,
  type DailyFocusIntensity,
  type DailyFocusMode,
} from './daily-focus.types';

const ACTION_ID_PATTERN = /^[a-z][a-z0-9_]*$/;
const UNSUPPORTED_METADATA_KEYS = [
  'ageMin',
  'ageMax',
  'minAge',
  'excludeAge65',
  'bmiMin',
  'bmiMax',
  'medical',
  'diagnosis',
  'calorieDeficit',
  'fasting',
] as const;

const FORBIDDEN_COPY_PATTERNS: readonly { id: string; pattern: RegExp }[] = [
  { id: 'exact_sleep_hours', pattern: /\b8\s*(timmar|timer|hours)\b/i },
  { id: 'water_volume', pattern: /\b2\s*liter\b/i },
  { id: 'generic_20_min_walk', pattern: /\b(20|tjugo|tjue)\s*minut(er|ter).*(promenad|gåtur|walk)/i },
  { id: 'calorie_deficit', pattern: /kalori(underskott|underskudd|underskud)|calorie\s*deficit|kaloriräkning|kaloriregistrering/i },
  { id: 'fasting', pattern: /\b(intermittent\s*fast(a|ing)|periodisk\s*fasta|periodisk\s*faste)\b/i },
  { id: 'addiction', pattern: /\b(beroende|avhengighet|addiction|alkoholism|alkoholisme)\b/i },
  { id: 'detox', pattern: /\b(detox|avgiftning|avrusning)\b/i },
  { id: 'cortisol', pattern: /\b(kortisol|cortisol)\b/i },
  { id: 'burnout', pattern: /\b(utbrändhet|utbrenthet|burnout)\b/i },
  { id: 'overtraining', pattern: /\b(överträning|overtrening|overtraining)\b/i },
  { id: 'hiit_prescription', pattern: /\bHIIT\b/ },
  { id: 'max_lifts', pattern: /\b(maxlyft|maksimal(t)?\s*løft|1RM)\b/i },
  { id: 'age_65_exclusion', pattern: /\b(65\s*år|över\s*65|over\s*65)\b/i },
  { id: 'weight_loss_challenge', pattern: /\b(viktnedgång|vektnedgang|gå\s*ner\s*i\s*vikt|gå\s*ned\s*i\s*vekt)\b/i },
  { id: 'cheat_meal', pattern: /\b(cheat\s*meal|fuskmål|juksemåltid)\b/i },
  { id: 'you_failed', pattern: /\b(du\s*misslyckades|du\s*feilet|you\s*failed)\b/i },
];

export type DailyFocusBankIssue = {
  code: string;
  message: string;
};

function isWeeklyFocusArea(value: string): value is WeeklyFocusArea {
  return (WEEKLY_FOCUS_AREAS as readonly string[]).includes(value);
}

function isIntensity(value: string): value is DailyFocusIntensity {
  return (DAILY_FOCUS_INTENSITIES as readonly string[]).includes(value);
}

function isMode(value: string): value is DailyFocusMode {
  return (DAILY_FOCUS_MODES as readonly string[]).includes(value);
}

export function countByFocusArea(actions: readonly DailyFocusActionDefinition[]): Record<WeeklyFocusArea, number> {
  const counts = Object.fromEntries(WEEKLY_FOCUS_AREAS.map((area) => [area, 0])) as Record<WeeklyFocusArea, number>;
  for (const action of actions) {
    counts[action.focusArea] += 1;
  }
  return counts;
}

export function countByIntensity(
  actions: readonly DailyFocusActionDefinition[],
): Record<DailyFocusIntensity, number> {
  const counts = Object.fromEntries(DAILY_FOCUS_INTENSITIES.map((intensity) => [intensity, 0])) as Record<
    DailyFocusIntensity,
    number
  >;
  for (const action of actions) {
    counts[action.intensity] += 1;
  }
  return counts;
}

export function maintainCountByArea(
  actions: readonly DailyFocusActionDefinition[],
): Record<WeeklyFocusArea, number> {
  const counts = Object.fromEntries(WEEKLY_FOCUS_AREAS.map((area) => [area, 0])) as Record<WeeklyFocusArea, number>;
  for (const action of actions) {
    if (action.allowedModes.includes('maintain')) {
      counts[action.focusArea] += 1;
    }
  }
  return counts;
}

export function familiesByArea(
  actions: readonly DailyFocusActionDefinition[],
): Record<WeeklyFocusArea, Record<string, number>> {
  const result = Object.fromEntries(WEEKLY_FOCUS_AREAS.map((area) => [area, {}])) as Record<
    WeeklyFocusArea,
    Record<string, number>
  >;
  for (const action of actions) {
    const bucket = result[action.focusArea];
    bucket[action.behaviorFamily] = (bucket[action.behaviorFamily] ?? 0) + 1;
  }
  return result;
}

export function validateDailyFocusActionBank(
  actions: readonly DailyFocusActionDefinition[],
): DailyFocusBankIssue[] {
  const issues: DailyFocusBankIssue[] = [];
  const ids = new Set<string>();
  const titleKeys = new Set<string>();
  const bodyKeys = new Set<string>();

  if (actions.length < 90 || actions.length > 96) {
    issues.push({
      code: 'bank_size',
      message: `Expected about 92–94 actions, found ${actions.length}.`,
    });
  }

  const areaCounts = countByFocusArea(actions);
  const expectedRanges: Record<WeeklyFocusArea, readonly [number, number]> = {
    everyday_movement: [16, 20],
    training: [12, 16],
    sleep: [14, 18],
    nutrition: [16, 20],
    alcohol: [10, 12],
    recovery: [14, 18],
  };
  for (const area of WEEKLY_FOCUS_AREAS) {
    const count = areaCounts[area];
    const [min, max] = expectedRanges[area];
    if (count < min || count > max) {
      issues.push({
        code: 'area_count',
        message: `${area} has ${count} actions (expected ${min}–${max}).`,
      });
    }
  }

  const maintainCounts = maintainCountByArea(actions);
  for (const area of WEEKLY_FOCUS_AREAS) {
    if (area === 'alcohol') {
      if (maintainCounts.alcohol !== 0) {
        issues.push({
          code: 'alcohol_maintain',
          message: 'Alcohol must not allow maintain.',
        });
      }
      continue;
    }
    if (maintainCounts[area] < 3) {
      issues.push({
        code: 'maintain_coverage',
        message: `${area} has only ${maintainCounts[area]} maintain-compatible actions.`,
      });
    }
  }

  const familyMap = familiesByArea(actions);
  const minFamilies: Partial<Record<WeeklyFocusArea, number>> = {
    everyday_movement: 8,
    training: 7,
    sleep: 6,
    nutrition: 6,
    alcohol: 3,
    recovery: 6,
  };
  for (const area of WEEKLY_FOCUS_AREAS) {
    const families = Object.keys(familyMap[area]);
    const min = minFamilies[area] ?? 3;
    if (families.length < min) {
      issues.push({
        code: 'family_diversity',
        message: `${area} has ${families.length} families (expected at least ${min}).`,
      });
    }
    for (const [family, count] of Object.entries(familyMap[area])) {
      if (count > 5) {
        issues.push({
          code: 'family_concentration',
          message: `${area}/${family} has ${count} actions (max 5).`,
        });
      }
      if (family === area) {
        issues.push({
          code: 'family_equals_area',
          message: `${area} uses behaviorFamily equal to focusArea.`,
        });
      }
    }
  }

  let challengeCount = 0;
  let recoveryIntensityOutsideRecovery = 0;
  let fastFoodWithGate = 0;

  for (const action of actions) {
    if (!ACTION_ID_PATTERN.test(action.id) || /_v\d/.test(action.id)) {
      issues.push({
        code: 'action_id',
        message: `Invalid or versioned action id: ${action.id}`,
      });
    }
    if (ids.has(action.id)) {
      issues.push({ code: 'duplicate_id', message: `Duplicate action id: ${action.id}` });
    }
    ids.add(action.id);

    if (!isWeeklyFocusArea(action.focusArea)) {
      issues.push({
        code: 'focus_area',
        message: `${action.id} has unsupported focusArea ${action.focusArea}.`,
      });
    }
    if (!isIntensity(action.intensity)) {
      issues.push({
        code: 'intensity',
        message: `${action.id} has invalid intensity ${action.intensity}.`,
      });
    }
    if (!action.behaviorFamily.trim()) {
      issues.push({
        code: 'behavior_family',
        message: `${action.id} is missing behaviorFamily.`,
      });
    }
    if (action.allowedModes.length === 0) {
      issues.push({
        code: 'allowed_modes',
        message: `${action.id} has no allowedModes.`,
      });
    }
    for (const mode of action.allowedModes) {
      if (!isMode(mode)) {
        issues.push({
          code: 'allowed_modes',
          message: `${action.id} has invalid mode ${mode}.`,
        });
      }
    }
    if (action.focusArea === 'alcohol' && action.allowedModes.includes('maintain')) {
      issues.push({
        code: 'alcohol_maintain',
        message: `${action.id} allows maintain.`,
      });
    }
    if (action.intensity === 'challenge' && action.allowedModes.includes('maintain')) {
      issues.push({
        code: 'challenge_maintain',
        message: `${action.id} is challenge and maintain-compatible.`,
      });
    }
    if (action.intensity === 'challenge') {
      challengeCount += 1;
    }
    if (action.intensity === 'recovery' && action.focusArea !== 'recovery') {
      recoveryIntensityOutsideRecovery += 1;
    }

    if (!action.eligibility.weekdayOk && !action.eligibility.weekendOk) {
      issues.push({
        code: 'day_eligibility',
        message: `${action.id} is eligible on neither weekday nor weekend.`,
      });
    }

    const expectedTitle = `dailyFocus.action.${action.id}.title`;
    const expectedBody = `dailyFocus.action.${action.id}.body`;
    if (action.titleKey !== expectedTitle) {
      issues.push({
        code: 'title_key',
        message: `${action.id} titleKey must be ${expectedTitle}.`,
      });
    }
    if (action.bodyKey !== expectedBody) {
      issues.push({
        code: 'body_key',
        message: `${action.id} bodyKey must be ${expectedBody}.`,
      });
    }
    if (titleKeys.has(action.titleKey)) {
      issues.push({ code: 'duplicate_i18n_key', message: `Duplicate titleKey ${action.titleKey}` });
    }
    if (bodyKeys.has(action.bodyKey)) {
      issues.push({ code: 'duplicate_i18n_key', message: `Duplicate bodyKey ${action.bodyKey}` });
    }
    titleKeys.add(action.titleKey);
    bodyKeys.add(action.bodyKey);

    const copy = DAILY_FOCUS_ACTION_COPY[action.id as DailyFocusActionId];
    if (!copy) {
      issues.push({ code: 'missing_copy', message: `${action.id} has no curated copy.` });
    } else {
      for (const locale of ['sv', 'nb'] as const) {
        if (!copy.title[locale]?.trim() || !copy.body[locale]?.trim()) {
          issues.push({
            code: 'empty_copy',
            message: `${action.id} has empty ${locale} copy.`,
          });
        }
        const blob = `${copy.title[locale]} ${copy.body[locale]}`;
        for (const rule of FORBIDDEN_COPY_PATTERNS) {
          if (rule.pattern.test(blob)) {
            issues.push({
              code: rule.id,
              message: `${action.id} ${locale} copy matches forbidden pattern ${rule.id}.`,
            });
          }
        }
      }
    }

    if (action.behaviorFamily === 'fast_food') {
      if (action.eligibility.requiresLessHealthyFoodRelevance !== true) {
        issues.push({
          code: 'fast_food_gate',
          message: `${action.id} must require less-healthy-food relevance.`,
        });
      } else {
        fastFoodWithGate += 1;
      }
    } else if (action.eligibility.requiresLessHealthyFoodRelevance) {
      issues.push({
        code: 'fast_food_gate',
        message: `${action.id} should not require less-healthy-food relevance.`,
      });
    }

    const extraKeys = Object.keys(action).filter(
      (key) =>
        ![
          'id',
          'focusArea',
          'behaviorFamily',
          'intensity',
          'allowedModes',
          'titleKey',
          'bodyKey',
          'eligibility',
        ].includes(key),
    );
    if (extraKeys.length > 0) {
      issues.push({
        code: 'unsupported_metadata',
        message: `${action.id} has extra fields: ${extraKeys.join(', ')}.`,
      });
    }
    for (const banned of UNSUPPORTED_METADATA_KEYS) {
      if (banned in action || banned in action.eligibility) {
        issues.push({
          code: 'unsupported_metadata',
          message: `${action.id} uses unsupported metadata ${banned}.`,
        });
      }
    }
  }

  if (challengeCount === 0) {
    issues.push({ code: 'challenge_identifiable', message: 'No challenge actions found.' });
  }
  if (recoveryIntensityOutsideRecovery < 2) {
    issues.push({
      code: 'recovery_intensity_spread',
      message: 'Need recovery-intensity actions outside the recovery area.',
    });
  }
  if (fastFoodWithGate < 1) {
    issues.push({
      code: 'fast_food_gate',
      message: 'Need at least one fast-food action with relevance metadata.',
    });
  }

  const copyIds = Object.keys(DAILY_FOCUS_ACTION_COPY);
  for (const copyId of copyIds) {
    if (!ids.has(copyId)) {
      issues.push({
        code: 'orphan_copy',
        message: `Copy exists for unknown action ${copyId}.`,
      });
    }
  }

  return issues;
}
