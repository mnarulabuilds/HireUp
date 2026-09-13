import { ResumeScoringService } from './resume-scoring.service';
import { emptyResumeContent } from '@hireup/shared';

describe('ResumeScoringService', () => {
  const service = new ResumeScoringService();

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
});
