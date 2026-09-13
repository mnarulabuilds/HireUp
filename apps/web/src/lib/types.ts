export type PublicUser = {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  plan: 'FREE' | 'PRO' | 'COACH';
  limits: {
    maxResumes: number;
    maxMatchesPerMonth: number;
    richFeedback: boolean;
    exportEnabled: boolean;
    coachingIncluded: boolean;
  };
  usage: {
    matchesUsedMonth: number;
    matchMonthKey: string;
  };
};
