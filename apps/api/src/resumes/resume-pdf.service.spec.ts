import {
  defaultSectionConfig,
  emptyResumeContent,
} from '@hireup/shared';
import { ResumePdfService } from './resume-pdf.service';

describe('ResumePdfService', () => {
  const service = new ResumePdfService();

  function sampleContent() {
    const content = emptyResumeContent();
    content.basics.fullName = 'Jane Doe';
    content.basics.email = 'jane@example.com';
    content.basics.phone = '555-0100';
    content.basics.location = 'Remote';
    content.basics.headline = 'Senior Software Engineer';
    content.summary =
      'Senior engineer with 8+ years building scalable web platforms and leading cross-functional delivery.';
    content.experience = [
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
    ];
    content.skills = ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'];
    content.sectionConfig = defaultSectionConfig();
    return content;
  }

  it('builds a non-empty pdf buffer', async () => {
    const buffer = await service.buildPdf(sampleContent(), 'Jane Resume');
    expect(buffer.length).toBeGreaterThan(100);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('uses a fallback author when the resume has no name', async () => {
    const content = emptyResumeContent();
    content.summary = 'Anonymous export.';
    const buffer = await service.buildPdf(content, 'Untitled');
    expect(buffer.length).toBeGreaterThan(100);
  });

  it('uses ATS-safe fonts and omits marketing footer text', async () => {
    const buffer = await service.buildPdf(sampleContent(), 'Jane Resume');
    const embedded = buffer.toString('latin1');

    expect(embedded).toContain('Jane Doe');
    expect(embedded).toContain('/Times-Roman');
    expect(embedded).toContain('HireUp');
    expect(embedded).not.toContain('Generated with HireUp');
  });

  it('renders all enabled sections for a complete resume', async () => {
    const content = sampleContent();
    content.sectionConfig = defaultSectionConfig().map((section) => ({
      ...section,
      enabled: true,
    }));
    content.education = [
      {
        school: 'State University',
        degree: 'B.S.',
        field: 'Computer Science',
        startDate: '2012',
        endDate: '2016',
        details: 'Dean’s list',
      },
    ];
    content.projects = [
      {
        name: 'Open Source CLI',
        url: 'https://github.com/example/cli',
        description: 'Developer tooling',
        bullets: ['500+ GitHub stars'],
      },
    ];
    content.customSections = [{ title: 'Certifications', content: 'AWS Solutions Architect' }];
    content.basics.links = [{ label: 'LinkedIn', url: 'https://linkedin.com/in/jane' }];

    const buffer = await service.buildPdf(content, 'Full Resume');
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(500);
  });

  it('covers bullet-only roles and multi-entry sections', async () => {
    const content = emptyResumeContent();
    content.basics.fullName = 'Casey Ng';
    content.basics.email = 'casey@example.com';
    content.sectionConfig = defaultSectionConfig().map((section) => ({
      ...section,
      enabled: ['experience', 'education', 'projects', 'custom'].includes(section.type),
    }));
    content.experience = [
      { company: '', title: '', bullets: ['Solo shipped product end-to-end'] },
      {
        company: 'Northwind',
        title: 'Lead Engineer',
        startDate: '2019',
        current: true,
        location: 'Boston',
        bullets: ['Mentored team of five engineers'],
      },
    ];
    content.education = [
      {
        school: 'State A',
        degree: 'B.S.',
        field: 'CS',
        startDate: '2010',
        endDate: '2014',
      },
      {
        school: 'State B',
        degree: 'M.S.',
        field: 'CS',
        startDate: '2014',
        endDate: '2016',
        details: 'Thesis on distributed systems',
      },
    ];
    content.projects = [
      { name: '', url: 'https://tools.dev', description: '', bullets: [] },
      { name: 'Portfolio App', url: '', description: 'Personal site', bullets: ['Built in Next.js'] },
    ];
    content.customSections = [
      { title: 'Awards', content: 'Hackathon winner' },
      { title: 'Talks', content: 'Conference speaker' },
    ];

    const buffer = await service.buildPdf(content, 'Casey Resume');
    expect(buffer.length).toBeGreaterThan(400);
  });

  it('handles sparse optional fields across sections', async () => {
    const content = emptyResumeContent();
    content.basics.fullName = 'Pat Lee';
    content.basics.email = 'pat@example.com';
    content.sectionConfig = defaultSectionConfig().map((section) => ({
      ...section,
      enabled: ['education', 'projects', 'custom'].includes(section.type),
    }));
    content.education = [
      {
        school: 'State U',
        degree: 'MBA',
        field: '',
        startDate: '2018',
        endDate: '2020',
        details: 'Focus on product strategy',
      },
    ];
    content.projects = [
      {
        name: 'Side tool',
        url: '',
        description: '',
        bullets: ['Automated weekly reporting'],
      },
    ];
    content.customSections = [{ title: '', content: 'Open-source maintainer' }];

    const buffer = await service.buildPdf(content, 'Sparse Resume');
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('paginates long resumes instead of clipping content', async () => {
    const content = sampleContent();
    content.experience = Array.from({ length: 12 }, (_, i) => ({
      company: `Company ${i + 1}`,
      title: `Engineer ${i + 1}`,
      startDate: '2018',
      endDate: '2024',
      bullets: [
        `Delivered platform initiative ${i + 1} with measurable impact`,
        `Reduced costs by ${10 + i}% through automation`,
        `Led team of ${3 + i} engineers across backend and frontend`,
      ],
    }));

    const buffer = await service.buildPdf(content, 'Long Resume');
    const embedded = buffer.toString('latin1');
    expect(embedded).toMatch(/\/Count\s+2/);
  });
});
