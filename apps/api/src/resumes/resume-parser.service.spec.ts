import { ResumeParserService } from './resume-parser.service';

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
});
