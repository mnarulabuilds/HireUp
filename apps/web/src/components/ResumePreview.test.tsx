import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ResumePreview } from './ResumePreview';
import { emptyResumeContent } from '@hireup/shared';

describe('ResumePreview', () => {
  it('renders enabled sections only', () => {
    const content = emptyResumeContent();
    content.basics.fullName = 'Alex Kim';
    content.summary = 'Product-minded engineer.';
    content.skills = ['TypeScript'];
    content.education = [{ school: 'MIT', degree: 'B.S.' }];
    render(<ResumePreview title="T" content={content} />);
    expect(screen.getByText('Alex Kim')).toBeInTheDocument();
    expect(screen.getByText(/Product-minded engineer/)).toBeInTheDocument();
    expect(screen.queryByText(/MIT/)).not.toBeInTheDocument();
  });

  it('renders experience dates and education when enabled', () => {
    const content = emptyResumeContent();
    content.sectionConfig = content.sectionConfig!.map((s) =>
      s.type === 'education' ? { ...s, enabled: true } : s,
    );
    content.basics.fullName = 'Sam';
    content.experience = [
      {
        company: 'Co',
        title: 'Dev',
        startDate: '2021',
        endDate: '2023',
        bullets: ['Shipped feature'],
      },
    ];
    content.education = [{ school: 'MIT', degree: 'B.S.' }];
    render(<ResumePreview title="T" content={content} />);
    expect(screen.getByText(/2021/)).toBeInTheDocument();
    expect(screen.getByText(/MIT/)).toBeInTheDocument();
  });

  it('renders projects when section enabled', () => {
    const content = emptyResumeContent();
    content.sectionConfig = content.sectionConfig!.map((s) =>
      s.type === 'projects' ? { ...s, enabled: true } : s,
    );
    content.projects = [{ name: 'Side app', description: 'Weekend project', bullets: [] }];
    render(<ResumePreview title="T" content={content} />);
    expect(screen.getByText('Side app')).toBeInTheDocument();
  });
});
