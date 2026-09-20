import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResumeSectionControls } from './ResumeSectionControls';
import { emptyResumeContent } from '@hireup/shared';

describe('ResumeSectionControls', () => {
  it('toggles section enabled state', () => {
    const content = emptyResumeContent();
    const onChange = vi.fn();
    render(<ResumeSectionControls content={content} onChange={onChange} />);
    const skillsToggle = screen.getByRole('checkbox', { name: /Skills/i });
    fireEvent.click(skillsToggle);
    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls[0]![0] as typeof content;
    expect(next.sectionConfig?.find((s) => s.type === 'skills')?.enabled).toBe(
      false,
    );
  });

});
