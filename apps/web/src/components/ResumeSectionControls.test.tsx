import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResumeSectionControls } from './ResumeSectionControls';
import { emptyResumeContent } from '@hireup/shared';

describe('ResumeSectionControls', () => {
  it('toggles section enabled state', () => {
    const content = emptyResumeContent();
    const onChange = vi.fn();
    render(<ResumeSectionControls content={content} onChange={onChange} />);
    const skillsToggle = screen.getByRole('checkbox', {
      name: /Include Skills section/i,
    });
    fireEvent.click(skillsToggle);
    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls[0]![0] as typeof content;
    expect(next.sectionConfig?.find((s) => s.type === 'skills')?.enabled).toBe(
      false,
    );
  });

  it('reorders sections and updates custom headings', () => {
    const content = emptyResumeContent();
    const onChange = vi.fn();
    render(<ResumeSectionControls content={content} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Move Skills down/i }));
    expect(onChange).toHaveBeenCalled();
    const moved = onChange.mock.calls[0]![0] as typeof content;
    const order = moved.sectionConfig?.map((s) => s.type) ?? [];
    expect(order.indexOf('skills')).toBeGreaterThan(order.indexOf('education'));

    const headingInput = screen.getByRole('textbox', { name: /Skills ATS heading/i });
    fireEvent.change(headingInput, { target: { value: 'Core skills' } });
    const withHeading = onChange.mock.calls.at(-1)![0] as typeof content;
    expect(
      withHeading.sectionConfig?.find((s) => s.type === 'skills')?.heading,
    ).toBe('Core skills');
  });

  it('does not move first section up or last section down', () => {
    const content = emptyResumeContent();
    const onChange = vi.fn();
    render(<ResumeSectionControls content={content} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Move Summary up/i }));
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Move Custom blocks down/i }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
