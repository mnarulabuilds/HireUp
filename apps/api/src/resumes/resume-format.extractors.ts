import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

export type ResumeFormatExtractor = {
  supports(file: Express.Multer.File): boolean;
  extractText(file: Express.Multer.File): Promise<string>;
};

export const RESUME_FORMAT_EXTRACTORS: ResumeFormatExtractor[] = [
  {
    supports: (file) =>
      file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf'),
    extractText: async (file) => {
      const parsed = await pdfParse(file.buffer);
      return parsed.text;
    },
  },
  {
    supports: (file) =>
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.originalname.endsWith('.docx'),
    extractText: async (file) => {
      const parsed = await mammoth.extractRawText({ buffer: file.buffer });
      return parsed.value;
    },
  },
  {
    supports: (file) =>
      file.mimetype.startsWith('text/') || file.originalname.endsWith('.txt'),
    extractText: async (file) => file.buffer.toString('utf8'),
  },
];
