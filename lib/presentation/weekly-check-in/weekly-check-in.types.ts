import type {
  WeeklyCheckInAlcoholConsumption,
  WeeklyCheckInAnswerField,
  WeeklyCheckInAnswers,
  WeeklyCheckInScale,
  WeeklyCheckInTrainingFrequency,
} from '@/lib/domain/weekly-check-in';

export type WeeklyCheckInFormAnswers = Partial<WeeklyCheckInAnswers>;

export type WeeklyCheckInQuestionNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type WeeklyCheckInScaleOption = {
  label: string;
  value: WeeklyCheckInScale;
};

export type WeeklyCheckInTrainingOption = {
  label: string;
  value: WeeklyCheckInTrainingFrequency;
};

export type WeeklyCheckInAlcoholOption = {
  label: string;
  value: WeeklyCheckInAlcoholConsumption;
};

export type WeeklyCheckInQuestion =
  | {
      number: 1;
      field: 'sleepQuality';
      title: string;
      support: string;
      cta: string;
      isFinal: false;
      options: readonly WeeklyCheckInScaleOption[];
    }
  | {
      number: 2;
      field: 'energy';
      title: string;
      support: string;
      cta: string;
      isFinal: false;
      options: readonly WeeklyCheckInScaleOption[];
    }
  | {
      number: 3;
      field: 'stress';
      title: string;
      support: string;
      cta: string;
      isFinal: false;
      options: readonly WeeklyCheckInScaleOption[];
    }
  | {
      number: 4;
      field: 'trainingFrequency';
      title: string;
      support: string;
      cta: string;
      isFinal: false;
      options: readonly WeeklyCheckInTrainingOption[];
    }
  | {
      number: 5;
      field: 'everydayActivity';
      title: string;
      support: string;
      cta: string;
      isFinal: false;
      options: readonly WeeklyCheckInScaleOption[];
    }
  | {
      number: 6;
      field: 'eatingQuality';
      title: string;
      support: string;
      cta: string;
      isFinal: false;
      options: readonly WeeklyCheckInScaleOption[];
    }
  | {
      number: 7;
      field: 'alcoholConsumption';
      title: string;
      support: string;
      cta: string;
      isFinal: false;
      options: readonly WeeklyCheckInAlcoholOption[];
    }
  | {
      number: 8;
      field: 'planAdherence';
      title: string;
      support: string;
      cta: string;
      isFinal: true;
      options: readonly WeeklyCheckInScaleOption[];
    };

export type WeeklyCheckInStep =
  | { kind: 'intro' }
  | { kind: 'question'; index: number }
  | { kind: 'success' };

export type WeeklyCheckInCopy = {
  introEyebrow: string;
  introTitle: string;
  introSupporting: string;
  introExplanation: string;
  introTimeHint: string;
  introStartCta: string;
  introDismissCta: string;
  progressLabel: string;
  successTitle: string;
  successSupporting: string;
  successExplanation: string;
  successHomeCta: string;
};

export type WeeklyCheckInAnswerValue = WeeklyCheckInAnswers[WeeklyCheckInAnswerField];
