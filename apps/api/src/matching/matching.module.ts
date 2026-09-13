import { Module } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { ResumeScoringService } from './resume-scoring.service';
import { UsersModule } from '../users/users.module';
import { ResumesModule } from '../resumes/resumes.module';

@Module({
  imports: [UsersModule, ResumesModule],
  providers: [MatchingService, ResumeScoringService],
  controllers: [MatchingController],
  exports: [ResumeScoringService],
})
export class MatchingModule {}
