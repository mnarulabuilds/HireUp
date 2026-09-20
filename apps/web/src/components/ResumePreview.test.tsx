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

  it('renders headline, links, and contact line', () => {
    const content = emptyResumeContent();
    content.basics.headline = 'Platform engineer';
    content.basics.email = 'alex@example.com';
    content.basics.phone = '555-0100';
    content.basics.location = 'NYC';
    content.basics.links = [{ label: 'GitHub', url: 'https://github.com/alex' }];
    render(<ResumePreview title="Fallback title" content={content} />);
    expect(screen.getByText('Platform engineer')).toBeInTheDocument();
    expect(screen.getByText(/alex@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/GitHub:/)).toBeInTheDocument();
  });

  it('uses title when name is missing and shows Present for current roles', () => {
    const content = emptyResumeContent();
    content.basics.fullName = '';
    content.experience = [
      {
        company: 'Co',
        title: 'Lead',
        startDate: '2022',
        current: true,
        bullets: ['Delivered platform'],
      },
    ];
    render(<ResumePreview title="Draft resume" content={content} />);
    expect(screen.getByText('Draft resume')).toBeInTheDocument();
    expect(screen.getByText(/Present/)).toBeInTheDocument();
  });

  it('renders custom sections when enabled', () => {
    const content = emptyResumeContent();
    content.sectionConfig = content.sectionConfig!.map((s) =>
      s.type === 'custom' ? { ...s, enabled: true } : s,
    );
    content.customSections = [{ title: 'Awards', content: 'Best hackathon 2024' }];
    render(<ResumePreview title="T" content={content} />);
    expect(screen.getByText('Awards')).toBeInTheDocument();
    expect(screen.getByText('Best hackathon 2024')).toBeInTheDocument();
  });

  it('renders education details, project bullets, and role location', () => {
    const content = emptyResumeContent();
    content.sectionConfig = content.sectionConfig!.map((s) => ({
      ...s,
      enabled: ['education', 'projects', 'experience'].includes(s.type),
    }));
    content.experience = [
      {
        company: 'Northwind',
        title: 'Engineer',
        startDate: '2021',
        endDate: '2024',
        location: 'Remote',
        bullets: ['Improved reliability'],
      },
    ];
    content.education = [
      {
        school: 'State U',
        degree: 'B.S.',
        field: 'CS',
        startDate: '2016',
        endDate: '2020',
        details: 'Graduated with honors',
      },
    ];
    content.projects = [
      {
        name: 'CLI Tool',
        url: 'https://example.com/cli',
        description: 'Developer utility',
        bullets: ['1k weekly users'],
      },
    ];
    render(<ResumePreview title="T" content={content} />);
    expect(screen.getByText(/Remote/)).toBeInTheDocument();
    expect(screen.getByText(/Graduated with honors/)).toBeInTheDocument();
    expect(screen.getByText(/1k weekly users/)).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/example.com\/cli/)).toBeInTheDocument();
  });

  it('renders bullet-only roles and untitled custom blocks', () => {
    const content = emptyResumeContent();
    content.sectionConfig = content.sectionConfig!.map((s) => ({
      ...s,
      enabled: s.type === 'experience' || s.type === 'custom',
    }));
    content.experience = [{ company: '', title: '', bullets: ['Solo delivery'] }];
    content.customSections = [{ title: '', content: 'Volunteer mentor' }];
    render(<ResumePreview title="T" content={content} />);
    expect(screen.getByText('Solo delivery')).toBeInTheDocument();
    expect(screen.getByText('Volunteer mentor')).toBeInTheDocument();
    expect(screen.getByText('Additional')).toBeInTheDocument();
  });

  it('shows live preview label and document shell', () => {
    const content = emptyResumeContent();
    content.basics.fullName = 'Preview User';
    render(<ResumePreview title="T" content={content} />);
    expect(screen.getByText('Live preview')).toBeInTheDocument();
    expect(screen.getByLabelText('Resume preview')).toHaveClass('resume-document');
  });
});
