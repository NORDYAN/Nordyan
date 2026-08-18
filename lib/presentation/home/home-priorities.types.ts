export type HomeAdviceCategory =
  | 'activity'
  | 'recovery'
  | 'food'
  | 'hydration'
  | 'outdoors';

export type HomeAdviceItem = {
  id: string;
  category: HomeAdviceCategory;
  title: string;
  subtitle: string;
};

export type HomePriorityKind = 'personal' | 'general';

export type HomePriorityItemModel = {
  id: string;
  kind: HomePriorityKind;
  title: string;
  subtitle: string;
  completed: boolean;
};

export type HomePersonalPriorityInput = {
  title: string;
  subtitle: string;
} | null;
