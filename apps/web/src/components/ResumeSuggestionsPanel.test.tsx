import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResumeSuggestionsPanel } from './ResumeSuggestionsPanel';

vi.mock('@/lib/api', () => ({
  api: vi.fn(),
}));

import { api } from '@/lib/api';

describe('ResumeSuggestionsPanel', () => {
  beforeEach(() => {
    vi.mocked(api).mockReset();
  });

  it('shows a loading state while fetching', () => {
    vi.mocked(api).mockReturnValue(new Promise(() => undefined));
    render(<ResumeSuggestionsPanel resumeId="r1" />);
    expect(screen.getByLabelText(/Loading suggestions/i)).toHaveAttribute('aria-busy', 'true');
  });

  it('renders ATS score and grouped suggestions', async () => {
    vi.mocked(api).mockResolvedValue({
      atsReadiness: 82,
      suggestions: [
        {
          id: 'basics-email',
          severity: 'critical',
          section: 'basics',
          title: 'Add email',
          detail: 'Required for ATS.',
        },
        {
          id: 'summary-short',
          severity: 'info',
          section: 'summary',
          title: 'Expand summary',
          detail: 'Add more detail.',
        },
      ],
    });

    render(<ResumeSuggestionsPanel resumeId="r1" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/ATS readiness 82 out of 100/i)).toBeInTheDocument();
    });
    expect(screen.getByText('Add email')).toBeInTheDocument();
    expect(screen.getByText('Expand summary')).toBeInTheDocument();
  });

  it('surfaces fetch errors accessibly', async () => {
    vi.mocked(api).mockRejectedValue(new Error('Network down'));
    render(<ResumeSuggestionsPanel resumeId="r1" />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network down');
    });
  });
});
