import { describe, expect, it } from 'vitest';
import { keywordOverlapRatio, missingJobKeywords, tokenizeJobText } from './job-match';

describe('job-match keywords', () => {
  it('tokenizes and filters stop words', () => {
    const tokens = tokenizeJobText(
      'Senior TypeScript engineer for the team with NestJS and PostgreSQL',
    );
    expect(tokens).toContain('typescript');
    expect(tokens).toContain('nestjs');
    expect(tokens).not.toContain('the');
  });

  it('finds missing keywords against resume text', () => {
    const gaps = missingJobKeywords(
      'Requires Kubernetes, Terraform, and GraphQL experience',
      'built apis with typescript and nestjs',
      5,
    );
    expect(gaps.some((g) => g.includes('kubernetes') || g === 'kubernetes')).toBe(true);
  });

  it('computes overlap ratio', () => {
    const ratio = keywordOverlapRatio(['typescript', 'kubernetes'], 'typescript nestjs');
    expect(ratio).toBeCloseTo(0.5);
  });
});
