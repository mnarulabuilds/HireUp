import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { MatchRequestSchema } from '@hireup/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { MatchingService } from './matching.service';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Post('resumes/:resumeId')
  create(
    @CurrentUser() user: AuthUser,
    @Param('resumeId') resumeId: string,
    @Body(new ZodValidationPipe(MatchRequestSchema)) body: unknown,
  ) {
    return this.matching.match(user.userId, resumeId, body as never);
  }

  @Get('resumes/:resumeId')
  list(@CurrentUser() user: AuthUser, @Param('resumeId') resumeId: string) {
    return this.matching.listForResume(user.userId, resumeId);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.matching.getOne(user.userId, id);
  }
}
