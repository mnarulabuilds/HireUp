import { Module } from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { ResumesController } from './resumes.controller';
import { ResumeParserService } from './resume-parser.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [ResumesService, ResumeParserService],
  controllers: [ResumesController],
  exports: [ResumesService, ResumeParserService],
})
export class ResumesModule {}
