import { Module } from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { ResumesController } from './resumes.controller';
import { ResumeParserService } from './resume-parser.service';
import { ResumePdfService } from './resume-pdf.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [ResumesService, ResumeParserService, ResumePdfService],
  controllers: [ResumesController],
  exports: [ResumesService, ResumeParserService],
})
export class ResumesModule {}
