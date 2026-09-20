import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { ResumeContent } from '@hireup/shared';
import { renderResumePlainText } from '@hireup/shared';

@Injectable()
export class ResumePdfService {
  async buildPdf(content: ResumeContent, title: string): Promise<Buffer> {
    const plain = renderResumePlainText(content);
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 54, bottom: 54, left: 54, right: 54 },
      info: {
        Title: title,
        Author: content.basics.fullName || 'HireUp',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const finished = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    doc.font('Helvetica').fontSize(10).text(plain, {
      lineGap: 3,
      align: 'left',
    });

    doc.fontSize(8).fillColor('#666666').text('Generated with HireUp — ATS-friendly export', {
      align: 'center',
    });

    doc.end();
    return finished;
  }
}
