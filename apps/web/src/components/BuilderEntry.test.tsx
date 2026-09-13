import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  api: vi.fn(),
}));

import NewResumePage from '@/app/resumes/new/page';

describe('Builder entry', () => {
  it('offers forms, upload, and chat paths', () => {
    render(<NewResumePage />);
    expect(screen.getByTestId('builder-entry')).toBeInTheDocument();
    expect(screen.getByText('Forms')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Chat questionnaire')).toBeInTheDocument();
  });
});
