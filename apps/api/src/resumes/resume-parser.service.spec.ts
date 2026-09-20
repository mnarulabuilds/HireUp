import { BadRequestException } from '@nestjs/common';
import { ResumeParserService } from './resume-parser.service';

jest.mock('pdf-parse', () =>
  jest.fn().mockResolvedValue({ text: 'PDF User\npdf@example.com\nSKILLS\nRust' }),
);

jest.mock('mammoth', () => ({
  extractRawText: jest.fn().mockResolvedValue({
    value: 'DOCX User\ndocx@example.com\nSKILLS\nGraphQL',
  }),
}));

describe('ResumeParserService', () => {
  const service = new ResumeParserService();

  it('extracts basics and skills from plain text', () => {
    const text = `
Jane Doe
jane@example.com
+1 555 0100

SUMMARY
Product-minded engineer.

SKILLS
TypeScript, React, Node.js

EXPERIENCE
Acme Corp
Senior Engineer
Built hiring tools used by 10k users
Improved resume parse accuracy
`;
    const content = service.heuristicExtract(text);
    expect(content.basics.fullName).toBe('Jane Doe');
    expect(content.basics.email).toBe('jane@example.com');
    expect(content.skills).toEqual(
      expect.arrayContaining(['TypeScript', 'React', 'Node.js']),
    );
    expect(content.experience.length).toBeGreaterThan(0);
  });

  it('rejects empty uploads', async () => {
    await expect(
      service.parse({ buffer: Buffer.from(''), mimetype: 'text/plain' } as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('parses plain text files', async () => {
    const file = {
      buffer: Buffer.from('Sam Plain\nsam@plain.com\nSKILLS\nSQL'),
      mimetype: 'text/plain',
      originalname: 'resume.txt',
    } as Express.Multer.File;

    const content = await service.parse(file);
    expect(content.basics.fullName).toBe('Sam Plain');
    expect(content.basics.email).toBe('sam@plain.com');
    expect(content.skills).toContain('SQL');
  });

  it('parses pdf and docx by extension or mime type', async () => {
    const pdf = await service.parse({
      buffer: Buffer.from('%PDF'),
      mimetype: 'application/pdf',
      originalname: 'cv.pdf',
    } as Express.Multer.File);
    expect(pdf.basics.email).toBe('pdf@example.com');

    const docx = await service.parse({
      buffer: Buffer.from('PK'),
      mimetype:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      originalname: 'cv.docx',
    } as Express.Multer.File);
    expect(docx.basics.email).toBe('docx@example.com');
  });

  it('extracts profile headings and filters short experience bullets', () => {
    const text = `
Pat Lee
pat@example.com

PROFILE
Platform engineer focused on reliability.

EXPERIENCE
Acme
Engineer
Short
This bullet is long enough to be kept on the resume
`;
    const content = service.heuristicExtract(text);
    expect(content.summary).toContain('Platform engineer');
    expect(content.experience[0]?.bullets).toHaveLength(1);
  });

  it('rejects unsupported formats', async () => {
    await expect(
      service.parse({
        buffer: Buffer.from('data'),
        mimetype: 'application/octet-stream',
        originalname: 'resume.pages',
      } as Express.Multer.File),
    ).rejects.toThrow(/Supported formats/i);
  });
});
