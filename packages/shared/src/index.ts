import { z } from 'zod';

export const PlanTier = z.enum(['FREE', 'PRO', 'COACH']);
export type PlanTier = z.infer<typeof PlanTier>;

export const ResumeSource = z.enum(['UPLOAD', 'FORM', 'CHAT']);
export type ResumeSource = z.infer<typeof ResumeSource>;

export const ResumeStatus = z.enum(['DRAFT', 'READY']);
export type ResumeStatus = z.infer<typeof ResumeStatus>;

export const SectionType = z.enum([
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'custom',
]);
export type SectionType = z.infer<typeof SectionType>;

export const ExperienceItemSchema = z.object({
  company: z.string().default(''),
  title: z.string().default(''),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  bullets: z.array(z.string()).default([]),
});

export const EducationItemSchema = z.object({
  school: z.string().default(''),
  degree: z.string().default(''),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  details: z.string().optional(),
});

export const ProjectItemSchema = z.object({
  name: z.string().default(''),
  url: z.string().optional(),
  description: z.string().optional(),
  bullets: z.array(z.string()).default([]),
});

export const ResumeBasicsSchema = z.object({
  fullName: z.string().default(''),
  email: z.string().default(''),
  phone: z.string().optional(),
  location: z.string().optional(),
  headline: z.string().optional(),
  links: z
    .array(z.object({ label: z.string(), url: z.string() }))
    .default([]),
});

export const ResumeContentSchema = z.object({
  basics: ResumeBasicsSchema.default({}),
  summary: z.string().default(''),
  experience: z.array(ExperienceItemSchema).default([]),
  education: z.array(EducationItemSchema).default([]),
  skills: z.array(z.string()).default([]),
  projects: z.array(ProjectItemSchema).default([]),
  customSections: z
    .array(
      z.object({
        title: z.string(),
        content: z.string(),
      }),
    )
    .default([]),
});

export type ResumeContent = z.infer<typeof ResumeContentSchema>;

export const emptyResumeContent = (): ResumeContent =>
  ResumeContentSchema.parse({});

export const CreateResumeSchema = z.object({
  title: z.string().min(1).max(120).default('Untitled Resume'),
  source: ResumeSource.default('FORM'),
  content: ResumeContentSchema.optional(),
});

export const UpdateResumeSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  status: ResumeStatus.optional(),
  content: ResumeContentSchema.optional(),
});

export const MatchRequestSchema = z.object({
  jobTitle: z.string().optional(),
  jobDescription: z.string().min(40, 'Job description is too short'),
  jobUrl: z.string().url().optional().or(z.literal('')),
});

export const MatchScoresSchema = z.object({
  overall: z.number().min(0).max(100),
  ats: z.number().min(0).max(100),
  skills: z.number().min(0).max(100),
  experience: z.number().min(0).max(100),
  interviewClearance: z.number().min(0).max(100),
});

export type MatchScores = z.infer<typeof MatchScoresSchema>;

export const MatchFeedbackSchema = z.object({
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  actions: z.array(z.string()),
  interviewStages: z.array(
    z.object({
      stage: z.string(),
      likelihood: z.number().min(0).max(100),
      tip: z.string(),
    }),
  ),
});

export type MatchFeedback = z.infer<typeof MatchFeedbackSchema>;

export const ChatAnswerSchema = z.object({
  answer: z.string().min(1),
});

export const ENTITLEMENTS = {
  FREE: {
    maxResumes: 1,
    maxMatchesPerMonth: 2,
    richFeedback: false,
    exportEnabled: false,
    coachingIncluded: false,
  },
  PRO: {
    maxResumes: 50,
    maxMatchesPerMonth: 200,
    richFeedback: true,
    exportEnabled: true,
    coachingIncluded: false,
  },
  COACH: {
    maxResumes: 50,
    maxMatchesPerMonth: 200,
    richFeedback: true,
    exportEnabled: true,
    coachingIncluded: true,
  },
} as const;

export type FeatureKey =
  | 'createResume'
  | 'runMatch'
  | 'richFeedback'
  | 'export'
  | 'coaching';

export const PLANS = [
  {
    id: 'FREE' as const,
    name: 'Free',
    priceLabel: '$0',
    description: 'Build one resume and try matching.',
    features: ['1 resume', '2 matches / month', 'Basic score'],
  },
  {
    id: 'PRO' as const,
    name: 'Pro',
    priceLabel: '$11/mo',
    description: 'Unlimited matching and richer AI feedback.',
    features: [
      'Unlimited resumes',
      'Unlimited matches',
      'Rich AI feedback',
      'Export-ready resume',
    ],
  },
  {
    id: 'COACH' as const,
    name: 'Coach',
    priceLabel: '$19',
    description: 'Interview prep session and practice plan.',
    features: [
      'Everything in Pro for the session window',
      'AI interview coaching plan',
      'Stage-by-stage prep tips',
    ],
  },
] as const;
