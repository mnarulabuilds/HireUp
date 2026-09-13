import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ResumesModule } from './resumes/resumes.module';
import { MatchingModule } from './matching/matching.module';
import { BillingModule } from './billing/billing.module';
import { CoachingModule } from './coaching/coaching.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { ChatBuilderModule } from './chat-builder/chat-builder.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ResumesModule,
    ChatBuilderModule,
    MatchingModule,
    BillingModule,
    CoachingModule,
  ],
})
export class AppModule {}
