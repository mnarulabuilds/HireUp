import { describe, expect, it } from 'vitest';
import type { ResumeContent } from './index';
import {
  computeAtsReadinessScore,
  defaultSectionConfig,
  getResumeSuggestions,
  isValidSectionType,
  normalizeSectionConfig,
  renderResumePlainText,
  sectionHeading,
} from './resume-ats';

const sampleContent = (): ResumeContent => ({
  basics: {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-0100',
    location: 'Remote',
    headline: 'Senior Engineer',
    links: [{ label: 'LinkedIn', url: 'https://linkedin.com/in/jane' }],
  },
  summary:
    'Senior engineer with 8+ years building scalable web platforms and leading cross-functional delivery.',
  experience: [
    {
      company: 'Acme',
      title: 'Staff Engineer',
      startDate: '2020',
      endDate: 'Present',
      current: true,
      bullets: [
        'Led migration serving 2M users, reducing latency 30%',
        'Built hiring pipeline and mentored 4 engineers',
      ],
    },
  ],
  education: [
    {
      school: 'State University',
      degree: 'B.S.',
      field: 'Computer Science',
      startDate: '2012',
      endDate: '2016',
    },
  ],
  skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS', 'System design'],
  projects: [],
  customSections: [],
  sectionConfig: defaultSectionConfig(),
});

describe('normalizeSectionConfig', () => {
  it('fills missing section types in default order', () => {
    const config = normalizeSectionConfig([
      { type: 'skills', enabled: false },
    ]);
    expect(config.map((c) => c.type)).toEqual([
      'summary',
      'experience',
      'education',
      'skills',
      'projects',
      'custom',
    ]);
    expect(config.find((c) => c.type === 'skills')?.enabled).toBe(false);
  });
});

describe('renderResumePlainText', () => {
  it('renders ATS-friendly plain text with section headings', () => {
    const text = renderResumePlainText(sampleContent());
    expect(text).toContain('Jane Doe');
    expect(text).toContain('PROFESSIONAL SUMMARY');
    expect(text).toContain('PROFESSIONAL EXPERIENCE');
    expect(text).toContain('SKILLS');
    expect(text).not.toContain('PROJECTS');
  });

  it('omits disabled sections', () => {
    const content = sampleContent();
    content.sectionConfig = normalizeSectionConfig([
      { type: 'summary', enabled: true },
      { type: 'experience', enabled: true },
      { type: 'education', enabled: false },
      { type: 'skills', enabled: true },
      { type: 'projects', enabled: false },
      { type: 'custom', enabled: false },
    ]);
    const text = renderResumePlainText(content);
    expect(text).not.toContain('EDUCATION');
  });
});

describe('getResumeSuggestions', () => {
  it('flags missing critical basics', () => {
    const suggestions = getResumeSuggestions({
      ...sampleContent(),
      basics: { ...sampleContent().basics, fullName: '', email: '' },
    });
    expect(suggestions.some((s) => s.id === 'basics-name')).toBe(true);
    expect(suggestions.some((s) => s.id === 'basics-email')).toBe(true);
  });

  it('suggests metrics when bullets lack numbers', () => {
    const content = sampleContent();
    content.experience[0]!.bullets = ['Worked on backend services', 'Helped team deliver'];
    const suggestions = getResumeSuggestions(content);
    expect(suggestions.some((s) => s.id.startsWith('exp-metrics'))).toBe(true);
  });
});

describe('computeAtsReadinessScore', () => {
  it('returns higher score for complete resumes', () => {
    const good = computeAtsReadinessScore(sampleContent());
    const weak = computeAtsReadinessScore({
      basics: { fullName: '', email: '', links: [] },
      summary: '',
      experience: [],
      education: [],
      skills: [],
      projects: [],
      customSections: [],
    });
    expect(good).toBeGreaterThan(weak);
    expect(good).toBeGreaterThanOrEqual(70);
  });
});

describe('projects and custom sections', () => {
  it('renders optional sections when enabled', () => {
    const content = sampleContent();
    content.sectionConfig = normalizeSectionConfig([
      { type: 'summary', enabled: true },
      { type: 'experience', enabled: true },
      { type: 'education', enabled: true },
      { type: 'skills', enabled: true },
      { type: 'projects', enabled: true },
      { type: 'custom', enabled: true },
    ]);
    content.projects = [
      {
        name: 'Open Source CLI',
        description: 'Developer tooling',
        bullets: ['500+ stars'],
      },
    ];
    content.customSections = [{ title: 'Certifications', content: 'AWS SA' }];
    const text = renderResumePlainText(content);
    expect(text).toContain('PROJECTS');
    expect(text).toContain('Open Source CLI');
    expect(text).toContain('CERTIFICATIONS');
  });
});

describe('edge suggestions', () => {
  it('warns when skills are disabled but populated', () => {
    const content = sampleContent();
    content.sectionConfig = normalizeSectionConfig([
      { type: 'summary', enabled: true },
      { type: 'experience', enabled: true },
      { type: 'education', enabled: false },
      { type: 'skills', enabled: false },
      { type: 'projects', enabled: false },
      { type: 'custom', enabled: false },
    ]);
    const suggestions = getResumeSuggestions(content);
    expect(suggestions.some((s) => s.id === 'skills-disabled')).toBe(true);
  });

  it('uses custom section headings', () => {
    const config = normalizeSectionConfig([
      { type: 'skills', enabled: true, heading: 'Core competencies' },
    ]);
    expect(sectionHeading('skills', config)).toBe('Core competencies');
    expect(isValidSectionType('skills')).toBe(true);
    expect(isValidSectionType('invalid')).toBe(false);
  });

  it('covers summary-hidden and education hints', () => {
    const content = sampleContent();
    content.sectionConfig = normalizeSectionConfig([
      { type: 'summary', enabled: false },
      { type: 'experience', enabled: true },
      { type: 'education', enabled: true },
      { type: 'skills', enabled: true },
      { type: 'projects', enabled: false },
      { type: 'custom', enabled: false },
    ]);
    content.education = [];
    content.experience = content.experience.slice(0, 1);
    const suggestions = getResumeSuggestions(content);
    expect(suggestions.some((s) => s.id === 'summary-disabled')).toBe(true);
    expect(suggestions.some((s) => s.id === 'education-suggest')).toBe(true);
  });

  it('suggests phone, short summary, and skill list sizing', () => {
    const content = sampleContent();
    content.basics.phone = '';
    content.summary = 'Short summary.';
    content.skills = ['Go', 'Rust'];
    const suggestions = getResumeSuggestions(content);
    expect(suggestions.some((s) => s.id === 'basics-phone')).toBe(true);
    expect(suggestions.some((s) => s.id === 'summary-short')).toBe(true);
    expect(suggestions.some((s) => s.id === 'skills-few')).toBe(true);

    content.skills = Array.from({ length: 30 }, (_, i) => `Skill${i}`);
    const many = getResumeSuggestions(content);
    expect(many.some((s) => s.id === 'skills-many')).toBe(true);
  });

  it('flags missing summary and incomplete experience metadata', () => {
    const content = sampleContent();
    content.summary = '';
    content.experience = [
      {
        company: '',
        title: '',
        startDate: '',
        endDate: '',
        current: false,
        bullets: ['Led migration by 30% and built APIs'],
      },
    ];
    const suggestions = getResumeSuggestions(content);
    expect(suggestions.some((s) => s.id === 'summary-missing')).toBe(true);
    expect(suggestions.some((s) => s.id.startsWith('exp-title'))).toBe(true);
    expect(suggestions.some((s) => s.id.startsWith('exp-dates'))).toBe(true);
  });

  it('flags long summary and weak experience bullets', () => {
    const content = sampleContent();
    content.summary = 'x'.repeat(650);
    content.experience = [
      {
        company: '',
        title: '',
        startDate: '',
        endDate: '',
        current: false,
        bullets: [],
      },
    ];
    const suggestions = getResumeSuggestions(content);
    expect(suggestions.some((s) => s.id === 'summary-long')).toBe(true);
    expect(suggestions.some((s) => s.id === 'exp-bullets-0')).toBe(true);
  });
});
