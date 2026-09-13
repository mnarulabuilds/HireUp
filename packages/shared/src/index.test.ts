import { describe, expect, it } from 'vitest';
import {
  CreateResumeSchema,
  ENTITLEMENTS,
  MatchRequestSchema,
  ResumeContentSchema,
  emptyResumeContent,
} from './index';

describe('ResumeContentSchema', () => {
  it('parses empty object into defaults', () => {
    const content = emptyResumeContent();
    expect(content.basics.fullName).toBe('');
    expect(content.experience).toEqual([]);
    expect(content.skills).toEqual([]);
  });

  it('accepts a populated resume', () => {
    const parsed = ResumeContentSchema.parse({
      basics: { fullName: 'Ada Lovelace', email: 'ada@example.com' },
      skills: ['Mathematics', 'Programming'],
      experience: [
        {
          company: 'Analytical Engines',
          title: 'Mathematician',
          bullets: ['Wrote the first algorithm'],
        },
      ],
    });
    expect(parsed.basics.fullName).toBe('Ada Lovelace');
    expect(parsed.experience[0]?.bullets).toHaveLength(1);
  });
});

describe('CreateResumeSchema', () => {
  it('defaults source to FORM', () => {
    const result = CreateResumeSchema.parse({ title: 'My Resume' });
    expect(result.source).toBe('FORM');
  });
});

describe('MatchRequestSchema', () => {
  it('rejects short job descriptions', () => {
    expect(() =>
      MatchRequestSchema.parse({ jobDescription: 'too short' }),
    ).toThrow();
  });

  it('accepts a valid match payload', () => {
    const result = MatchRequestSchema.parse({
      jobDescription:
        'We need a senior engineer with TypeScript, NestJS, and product sense.',
    });
    expect(result.jobDescription.length).toBeGreaterThan(40);
  });
});

describe('ENTITLEMENTS', () => {
  it('limits free tier matches', () => {
    expect(ENTITLEMENTS.FREE.maxMatchesPerMonth).toBe(2);
    expect(ENTITLEMENTS.PRO.maxMatchesPerMonth).toBeGreaterThan(
      ENTITLEMENTS.FREE.maxMatchesPerMonth,
    );
  });
});
