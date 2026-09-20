export type AtsSectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'custom';

export type AtsResumeContent = {
  basics: {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    headline?: string;
    links: { label: string; url: string }[];
  };
  summary: string;
  experience: {
    company: string;
    title: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    bullets: string[];
  }[];
  education: {
    school: string;
    degree: string;
    field?: string;
    startDate?: string;
    endDate?: string;
    details?: string;
  }[];
  skills: string[];
  projects: {
    name: string;
    url?: string;
    description?: string;
    bullets: string[];
  }[];
  customSections: { title: string; content: string }[];
  sectionConfig?: ResumeSectionConfigItem[];
};

export type ResumeSectionConfigItem = {
  type: AtsSectionType;
  enabled: boolean;
  heading?: string;
};

export type SuggestionSeverity = 'info' | 'warn' | 'critical';

export type ResumeSuggestion = {
  id: string;
  severity: SuggestionSeverity;
  section: AtsSectionType | 'basics';
  title: string;
  detail: string;
};

export const DEFAULT_SECTION_ORDER: AtsSectionType[] = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'custom',
];

export const ATS_SECTION_HEADINGS: Record<AtsSectionType, string> = {
  summary: 'Professional Summary',
  experience: 'Professional Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  custom: 'Additional',
};

const ACTION_VERBS =
  /\b(achieved|built|created|delivered|designed|developed|drove|improved|increased|launched|led|managed|optimized|owned|reduced|scaled|shipped|spearheaded|streamlined)\b/i;

const METRIC_PATTERN = /\d+%?|\$\d|[\d,]+\+?/;

export function defaultSectionConfig(): ResumeSectionConfigItem[] {
  return DEFAULT_SECTION_ORDER.map((type) => ({
    type,
    enabled: type === 'summary' || type === 'experience' || type === 'skills',
  }));
}

export function normalizeSectionConfig(
  config: ResumeSectionConfigItem[] | undefined,
): ResumeSectionConfigItem[] {
  const byType = new Map<AtsSectionType, ResumeSectionConfigItem>();
  for (const item of config ?? []) {
    if (!isValidSectionType(item.type)) continue;
    byType.set(item.type, { ...item, type: item.type });
  }

  const orderedTypes: AtsSectionType[] = [];
  for (const item of config ?? []) {
    if (isValidSectionType(item.type) && !orderedTypes.includes(item.type)) {
      orderedTypes.push(item.type);
    }
  }
  for (const type of DEFAULT_SECTION_ORDER) {
    if (!orderedTypes.includes(type)) orderedTypes.push(type);
  }

  const defaults = defaultSectionConfig();
  return orderedTypes.map((type) => {
    const existing = byType.get(type);
    if (existing) return { ...existing, type };
    return defaults.find((d) => d.type === type)!;
  });
}

export function reorderSectionConfig(
  config: ResumeSectionConfigItem[],
  type: AtsSectionType,
  direction: -1 | 1,
): ResumeSectionConfigItem[] {
  const normalized = normalizeSectionConfig(config);
  const idx = normalized.findIndex((item) => item.type === type);
  if (idx < 0) return normalized;

  const target = idx + direction;
  if (target < 0 || target >= normalized.length) return normalized;

  const next = [...normalized];
  const current = next[idx]!;
  next[idx] = next[target]!;
  next[target] = current;
  return next;
}

export function sectionHeading(
  type: AtsSectionType,
  config: ResumeSectionConfigItem[],
): string {
  const item = config.find((s) => s.type === type);
  return item?.heading?.trim() || ATS_SECTION_HEADINGS[type];
}

export function enabledSections(
  config: ResumeSectionConfigItem[],
): AtsSectionType[] {
  return normalizeSectionConfig(config)
    .filter((s) => s.enabled)
    .map((s) => s.type);
}

export function normalizeResumeContent(content: AtsResumeContent): AtsResumeContent {
  return {
    ...content,
    sectionConfig: normalizeSectionConfig(content.sectionConfig),
  };
}

export function renderResumePlainText(content: AtsResumeContent): string {
  const normalized = normalizeResumeContent(content);
  const config = normalized.sectionConfig!;
  const lines: string[] = [];

  const name = normalized.basics.fullName.trim() || 'Candidate';
  lines.push(name);
  if (normalized.basics.headline?.trim()) {
    lines.push(normalized.basics.headline.trim());
  }
  const contact = [
    normalized.basics.email,
    normalized.basics.phone,
    normalized.basics.location,
  ]
    .filter(Boolean)
    .join(' | ');
  if (contact) lines.push(contact);
  if (normalized.basics.links?.length) {
    for (const link of normalized.basics.links) {
      if (link.url) lines.push(`${link.label}: ${link.url}`);
    }
  }

  for (const sectionType of enabledSections(config)) {
    switch (sectionType) {
      case 'summary': {
        const text = normalized.summary.trim();
        if (!text) break;
        lines.push('', sectionHeading('summary', config).toUpperCase(), text);
        break;
      }
      case 'experience': {
        if (!normalized.experience.length) break;
        lines.push('', sectionHeading('experience', config).toUpperCase());
        for (const exp of normalized.experience) {
          const titleLine = [exp.title, exp.company].filter(Boolean).join(' — ');
          if (titleLine) lines.push(titleLine);
          const dates = [exp.startDate, exp.endDate ?? (exp.current ? 'Present' : '')]
            .filter(Boolean)
            .join(' – ');
          if (dates) lines.push(dates);
          if (exp.location) lines.push(exp.location);
          for (const b of exp.bullets) {
            if (b.trim()) lines.push(`• ${b.trim()}`);
          }
          lines.push('');
        }
        break;
      }
      case 'education': {
        if (!normalized.education.length) break;
        lines.push('', sectionHeading('education', config).toUpperCase());
        for (const ed of normalized.education) {
          const line = [ed.degree, ed.field, ed.school].filter(Boolean).join(' — ');
          if (line) lines.push(line);
          const dates = [ed.startDate, ed.endDate].filter(Boolean).join(' – ');
          if (dates) lines.push(dates);
          if (ed.details) lines.push(ed.details);
        }
        break;
      }
      case 'skills': {
        if (!normalized.skills.length) break;
        lines.push(
          '',
          sectionHeading('skills', config).toUpperCase(),
          normalized.skills.join(', '),
        );
        break;
      }
      case 'projects': {
        if (!normalized.projects.length) break;
        lines.push('', sectionHeading('projects', config).toUpperCase());
        for (const p of normalized.projects) {
          if (p.name) lines.push(p.name);
          if (p.url) lines.push(p.url);
          if (p.description) lines.push(p.description);
          for (const b of p.bullets) {
            if (b.trim()) lines.push(`• ${b.trim()}`);
          }
        }
        break;
      }
      case 'custom': {
        if (!normalized.customSections.length) break;
        for (const block of normalized.customSections) {
          if (!block.title.trim() && !block.content.trim()) continue;
          lines.push('', block.title.toUpperCase(), block.content);
        }
        break;
      }
      default:
        break;
    }
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function computeAtsReadinessScore(content: AtsResumeContent): number {
  const suggestions = getResumeSuggestions(content);
  let score = 100;
  for (const s of suggestions) {
    if (s.severity === 'critical') score -= 12;
    else if (s.severity === 'warn') score -= 6;
    else score -= 2;
  }
  return Math.max(0, Math.min(100, score));
}

export function getResumeSuggestions(content: AtsResumeContent): ResumeSuggestion[] {
  const normalized = normalizeResumeContent(content);
  const enabled = new Set(enabledSections(normalized.sectionConfig!));
  const out: ResumeSuggestion[] = [];

  if (!normalized.basics.fullName.trim()) {
    out.push({
      id: 'basics-name',
      severity: 'critical',
      section: 'basics',
      title: 'Add your full name',
      detail: 'ATS parsers use the header to identify your application.',
    });
  }
  if (!normalized.basics.email.trim()) {
    out.push({
      id: 'basics-email',
      severity: 'critical',
      section: 'basics',
      title: 'Add a professional email',
      detail: 'Recruiters need a reliable way to reach you.',
    });
  }
  if (!normalized.basics.phone?.trim()) {
    out.push({
      id: 'basics-phone',
      severity: 'info',
      section: 'basics',
      title: 'Consider adding a phone number',
      detail: 'Some ATS forms still require a phone field.',
    });
  }

  if (enabled.has('summary')) {
    const len = normalized.summary.trim().length;
    if (len === 0) {
      out.push({
        id: 'summary-missing',
        severity: 'warn',
        section: 'summary',
        title: 'Write a professional summary',
        detail: 'A 2–4 sentence summary helps keyword matching and human reviewers.',
      });
    } else if (len < 80) {
      out.push({
        id: 'summary-short',
        severity: 'info',
        section: 'summary',
        title: 'Expand your summary',
        detail: 'Aim for 80–400 characters with role, strengths, and impact.',
      });
    } else if (len > 600) {
      out.push({
        id: 'summary-long',
        severity: 'warn',
        section: 'summary',
        title: 'Shorten your summary',
        detail: 'Long blocks reduce scan-ability for ATS and recruiters.',
      });
    }
  } else if (normalized.summary.trim()) {
    out.push({
      id: 'summary-disabled',
      severity: 'info',
      section: 'summary',
      title: 'Summary is hidden from export',
      detail: 'Enable the Summary section to include it in ATS exports.',
    });
  }

  if (enabled.has('experience')) {
    if (normalized.experience.length === 0) {
      out.push({
        id: 'exp-missing',
        severity: 'critical',
        section: 'experience',
        title: 'Add at least one role',
        detail: 'Experience is the strongest signal for most job postings.',
      });
    }
    normalized.experience.forEach((exp, i) => {
      if (!exp.title.trim() || !exp.company.trim()) {
        out.push({
          id: `exp-title-${i}`,
          severity: 'warn',
          section: 'experience',
          title: `Complete role ${i + 1} title and company`,
          detail: 'Use standard job titles employers search for.',
        });
      }
      if (!exp.startDate?.trim()) {
        out.push({
          id: `exp-dates-${i}`,
          severity: 'info',
          section: 'experience',
          title: `Add dates for role ${i + 1}`,
          detail: 'Chronological dates help ATS timeline parsing.',
        });
      }
      const bullets = exp.bullets.filter((b) => b.trim());
      if (bullets.length === 0) {
        out.push({
          id: `exp-bullets-${i}`,
          severity: 'warn',
          section: 'experience',
          title: `Add impact bullets for role ${i + 1}`,
          detail: 'Use 3–5 bullets with action verbs and measurable outcomes.',
        });
      } else {
        const withMetrics = bullets.filter((b) => METRIC_PATTERN.test(b));
        if (withMetrics.length === 0) {
          out.push({
            id: `exp-metrics-${i}`,
            severity: 'info',
            section: 'experience',
            title: `Quantify impact in role ${i + 1}`,
            detail: 'Numbers, percentages, and scale (e.g. “30% faster”) improve ATS ranking.',
          });
        }
        const withVerbs = bullets.filter((b) => ACTION_VERBS.test(b));
        if (withVerbs.length < Math.min(2, bullets.length)) {
          out.push({
            id: `exp-verbs-${i}`,
            severity: 'info',
            section: 'experience',
            title: `Strengthen action verbs in role ${i + 1}`,
            detail: 'Start bullets with verbs like led, built, delivered, improved.',
          });
        }
      }
    });
  }

  if (enabled.has('skills')) {
    const count = normalized.skills.length;
    if (count === 0) {
      out.push({
        id: 'skills-missing',
        severity: 'warn',
        section: 'skills',
        title: 'List core skills',
        detail: 'Include 8–20 skills that match your target roles (tools + domains).',
      });
    } else if (count < 5) {
      out.push({
        id: 'skills-few',
        severity: 'info',
        section: 'skills',
        title: 'Add more relevant skills',
        detail: 'ATS often matches on skill keywords from the job description.',
      });
    } else if (count > 25) {
      out.push({
        id: 'skills-many',
        severity: 'info',
        section: 'skills',
        title: 'Trim skill list',
        detail: 'Focus on skills you can defend in an interview.',
      });
    }
  }

  if (
    enabled.has('education') &&
    normalized.education.length === 0 &&
    normalized.experience.length < 2
  ) {
    out.push({
      id: 'education-suggest',
      severity: 'info',
      section: 'education',
      title: 'Consider adding education',
      detail: 'Early-career profiles benefit from a clear education section.',
    });
  }

  if (!enabled.has('skills') && normalized.skills.length > 0) {
    out.push({
      id: 'skills-disabled',
      severity: 'warn',
      section: 'skills',
      title: 'Skills section is disabled',
      detail: 'Enable Skills for better keyword matching in ATS.',
    });
  }

  return out;
}

export function isValidSectionType(value: string): value is AtsSectionType {
  return (DEFAULT_SECTION_ORDER as readonly string[]).includes(value);
}
