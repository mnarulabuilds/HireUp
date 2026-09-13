import { Module } from '@nestjs/common';
import { CoachingService } from './coaching.service';
import { CoachingController } from './coaching.controller';
import { UsersModule } from '../users/users.module';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [UsersModule, MatchingModule],
  providers: [CoachingService],
  controllers: [CoachingController],
})
export class CoachingModule {}
