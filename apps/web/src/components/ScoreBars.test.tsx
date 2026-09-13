import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScoreBars } from './ScoreBars';
import { SponsoredTip } from './SponsoredTip';

describe('ScoreBars', () => {
  it('renders score labels and values', () => {
    render(
      <ScoreBars
        scores={{
          overall: 70,
          ats: 80,
          skills: 60,
          experience: 75,
          interviewClearance: 65,
        }}
      />,
    );
    expect(screen.getByText('Overall')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
    expect(screen.getByTestId('score-bars')).toBeInTheDocument();
  });
});

describe('SponsoredTip', () => {
  it('can be dismissed', () => {
    render(<SponsoredTip />);
    expect(screen.getByLabelText('Sponsored tip')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Dismiss sponsored tip'));
    expect(screen.queryByLabelText('Sponsored tip')).not.toBeInTheDocument();
  });
});
