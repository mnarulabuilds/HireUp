import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { emptyResumeContent } from '@hireup/shared';
import { ResumeSuggestionsPanel } from './ResumeSuggestionsPanel';

describe('ResumeSuggestionsPanel', () => {
  it('shows a loading state while content is not ready', () => {
    render(<ResumeSuggestionsPanel content={null} />);
    expect(screen.getByLabelText(/Loading suggestions/i)).toHaveAttribute('aria-busy', 'true');
  });

  it('renders ATS score and suggestions from resume content', () => {
    const content = emptyResumeContent();
    content.basics.fullName = 'Alex Example';
    content.basics.email = 'alex@example.com';
    content.summary =
      'Product engineer with eight years building reliable platforms and leading cross-functional delivery.';
    content.experience = [
      {
        company: 'Acme',
        title: 'Senior Engineer',
        startDate: '2020-01',
        bullets: ['Led migration serving 2M users', 'Reduced latency 30%'],
      },
    ];
    content.skills = ['TypeScript', 'React', 'Node', 'PostgreSQL', 'AWS', 'Docker'];

    render(<ResumeSuggestionsPanel content={content} />);

    expect(screen.getByLabelText(/ATS readiness \d+ out of 100/i)).toBeInTheDocument();
    expect(screen.queryByText('Add your full name')).not.toBeInTheDocument();
  });

  it('updates the score when content changes', () => {
    const weak = emptyResumeContent();
    const { rerender } = render(<ResumeSuggestionsPanel content={weak} />);
    const weakLabel = screen.getByLabelText(/ATS readiness (\d+) out of 100/i);
    const weakScore = Number(weakLabel.getAttribute('aria-label')!.match(/\d+/)![0]);

    const strong = emptyResumeContent();
    strong.basics.fullName = 'Alex Example';
    strong.basics.email = 'alex@example.com';
    strong.summary =
      'Product engineer with eight years building reliable platforms and leading cross-functional delivery.';
    strong.experience = [
      {
        company: 'Acme',
        title: 'Senior Engineer',
        startDate: '2020-01',
        bullets: ['Led migration serving 2M users', 'Reduced latency 30%'],
      },
    ];
    strong.skills = ['TypeScript', 'React', 'Node', 'PostgreSQL', 'AWS', 'Docker'];

    rerender(<ResumeSuggestionsPanel content={strong} />);
    const strongLabel = screen.getByLabelText(/ATS readiness (\d+) out of 100/i);
    const strongScore = Number(strongLabel.getAttribute('aria-label')!.match(/\d+/)![0]);

    expect(strongScore).toBeGreaterThan(weakScore);
  });
});
