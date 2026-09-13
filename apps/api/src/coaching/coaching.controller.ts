import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CoachingService, CreateCoachingSchema } from './coaching.service';

@Controller('coaching')
@UseGuards(JwtAuthGuard)
export class CoachingController {
  constructor(private readonly coaching: CoachingService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.coaching.list(user.userId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateCoachingSchema)) body: unknown,
  ) {
    return this.coaching.create(user.userId, body as never);
  }

  @Post(':id/unlock')
  unlock(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.coaching.unlockPaid(user.userId, id);
  }
}
