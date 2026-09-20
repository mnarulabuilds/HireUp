import { ResumePdfService } from './resume-pdf.service';
import { emptyResumeContent } from '@hireup/shared';

describe('ResumePdfService', () => {
  const service = new ResumePdfService();

  it('builds a non-empty pdf buffer', async () => {
    const content = emptyResumeContent();
    content.basics.fullName = 'Jane Doe';
    content.basics.email = 'jane@example.com';
    content.summary = 'Engineer with impact across web platforms.';
    const buffer = await service.buildPdf(content, 'Jane Resume');
    expect(buffer.length).toBeGreaterThan(100);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('uses a fallback author when the resume has no name', async () => {
    const content = emptyResumeContent();
    content.summary = 'Anonymous export.';
    const buffer = await service.buildPdf(content, 'Untitled');
    expect(buffer.length).toBeGreaterThan(100);
  });
});
