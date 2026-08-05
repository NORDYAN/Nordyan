export type CoachPriority = {
  id: string;
  title: string;
  subtitle: string;
  completed: boolean;
  sortOrder: number;
};

export type CoachRecommendation = {
  id: string;
  userId: string;
  message: string;
  planLabel: string | null;
  priorities: CoachPriority[];
  generatedAt: string;
};

export type CoachSession = {
  id: string;
  userId: string;
  recommendation: CoachRecommendation;
};
