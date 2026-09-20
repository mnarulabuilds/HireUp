import OpenAI from 'openai';
import { ResumeScoringService } from './resume-scoring.service';
import { emptyResumeContent } from '@hireup/shared';

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('ResumeScoringService', () => {
  const service = new ResumeScoringService();
  const createMock = jest.fn();
  const MockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
  const originalApiKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    createMock.mockReset();
    MockOpenAI.mockImplementation(
      () =>
        ({
          chat: { completions: { create: createMock } },
        }) as unknown as OpenAI,
    );
  });

  afterAll(() => {
    if (originalApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalApiKey;
    }
  });

  it('scores higher when skills overlap the JD', () => {
    const resume = emptyResumeContent();
    resume.basics.fullName = 'Alex Example';
    resume.basics.email = 'alex@example.com';
    resume.skills = ['TypeScript', 'NestJS', 'PostgreSQL'];
    resume.experience = [
      {
        company: 'Acme',
        title: 'Engineer',
        bullets: ['Built APIs with NestJS and TypeScript'],
      },
    ];
    resume.summary = 'Backend engineer focused on NestJS platforms.';

    const strong = service.scoreHeuristic(
      resume,
      'Looking for NestJS TypeScript PostgreSQL backend engineer with API experience.',
      true,
    );
    const weak = service.scoreHeuristic(
      resume,
      'Hiring a landscape photographer with drone certification and Lightroom skills.',
      true,
    );

    expect(strong.scores.overall).toBeGreaterThan(weak.scores.overall);
    expect(strong.feedback.actions.length).toBeGreaterThan(0);
    expect(strong.feedback.interviewStages).toHaveLength(4);
  });

  it('produces stable content hashes', () => {
    const resume = emptyResumeContent();
    resume.skills = ['Go'];
    const a = service.contentHash(resume, 'job');
    const b = service.contentHash(resume, 'job');
    const c = service.contentHash(resume, 'other');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('uses heuristic scoring when OpenAI is unavailable', async () => {
    delete process.env.OPENAI_API_KEY;
    const resume = emptyResumeContent();
    resume.skills = ['Python'];

    const result = await service.score(resume, 'Python developer', false);

    expect(result.provider).toBe('heuristic');
    expect(result.scores.overall).toBeGreaterThan(0);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('uses OpenAI when configured and returns parsed scores', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    createMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              scores: {
                overall: 88,
                ats: 90,
                skills: 85,
                experience: 80,
                interviewClearance: 75,
              },
              feedback: {
                strengths: ['Strong overlap'],
                gaps: ['Add metrics'],
                actions: ['Tailor summary'],
                interviewStages: [
                  { stage: 'Screen', likelihood: 80, tip: 'Practice pitch' },
                ],
              },
            }),
          },
        },
      ],
    });

    const resume = emptyResumeContent();
    resume.skills = ['TypeScript'];
    const result = await service.score(resume, 'TypeScript engineer', true);

    expect(result.provider).toBe('openai');
    expect(result.scores.overall).toBe(88);
    expect(createMock).toHaveBeenCalled();
  });

  it('falls back to heuristic when OpenAI fails', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    createMock.mockRejectedValue(new Error('rate limited'));

    const resume = emptyResumeContent();
    resume.skills = ['Go'];
    const result = await service.score(resume, 'Go backend role', true);

    expect(result.provider).toBe('heuristic');
    expect(result.feedback.actions.length).toBeGreaterThan(0);
  });

  it('covers non-rich feedback branches in heuristic scoring', () => {
    const resume = emptyResumeContent();
    resume.skills = [];
    resume.experience = [];
    resume.summary = '';

    const result = service.scoreHeuristic(
      resume,
      'kubernetes terraform devops',
      false,
    );

    expect(result.feedback.gaps.length).toBeLessThanOrEqual(3);
    expect(result.feedback.actions.some((a) => /Pro/i.test(a))).toBe(true);
  });
});
