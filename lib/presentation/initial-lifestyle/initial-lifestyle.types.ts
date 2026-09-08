import type {
  InitialLifestyleAlcoholConsumption,
  InitialLifestyleAnswerField,
  InitialLifestyleAnswers,
  InitialLifestyleLessHealthyFoodFrequency,
  InitialLifestyleScale,
} from '@/lib/domain/initial-lifestyle';

export type InitialLifestyleFormAnswers = Partial<InitialLifestyleAnswers>;

export type InitialLifestyleQuestionNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type InitialLifestyleScaleOption = {
  label: string;
  value: InitialLifestyleScale;
};

export type InitialLifestyleLessHealthyFoodOption = {
  label: string;
  value: InitialLifestyleLessHealthyFoodFrequency;
};

export type InitialLifestyleAlcoholOption = {
  label: string;
  value: InitialLifestyleAlcoholConsumption;
};

export type InitialLifestyleQuestion =
  | {
      number: 1;
      field: 'sleepQuality';
      title: string;
      support: string;
      cta: string;
      isFinal: false;
      options: readonly InitialLifestyleScaleOption[];
    }
  | {
      number: 2;
      field: 'energy';
      title: string;
      support: string;
      cta: string;
      isFinal: false;
      options: readonly InitialLifestyleScaleOption[];
    }
  | {
      number: 3;
      field: 'stress';
      title: string;
      support: string;
      cta: string;
      isFinal: false;
      options: readonly InitialLifestyleScaleOption[];
    }
  | {
      number: 4;
      field: 'lessHealthyFoodFrequency';
      title: string;
      support: string;
      cta: string;
      isFinal: false;
      options: readonly InitialLifestyleLessHealthyFoodOption[];
    }
  | {
      number: 5;
      field: 'everydayActivity';
      title: string;
      support: string;
      cta: string;
      isFinal: false;
      options: readonly InitialLifestyleScaleOption[];
    }
  | {
      number: 6;
      field: 'eatingQuality';
      title: string;
      support: string;
      cta: string;
      isFinal: false;
      options: readonly InitialLifestyleScaleOption[];
    }
  | {
      number: 7;
      field: 'alcoholConsumption';
      title: string;
      support: string;
      cta: string;
      isFinal: true;
      options: readonly InitialLifestyleAlcoholOption[];
    };

export type InitialLifestyleStep =
  | { kind: 'intro' }
  | { kind: 'question'; index: number };

export type InitialLifestyleCopy = {
  introOverline: string;
  introTitle: string;
  introBody: string;
  introTimeHint: string;
  introStartCta: string;
};

export type InitialLifestyleAnswerValue = InitialLifestyleAnswers[InitialLifestyleAnswerField];
