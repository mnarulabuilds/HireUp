import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ChatAnswerSchema } from '@hireup/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ChatBuilderService } from './chat-builder.service';

@Controller('chat-builder')
@UseGuards(JwtAuthGuard)
export class ChatBuilderController {
  constructor(private readonly chatBuilder: ChatBuilderService) {}

  @Post('start')
  start(@CurrentUser() user: AuthUser) {
    return this.chatBuilder.start(user.userId);
  }

  @Get(':resumeId')
  current(@CurrentUser() user: AuthUser, @Param('resumeId') resumeId: string) {
    return this.chatBuilder.current(user.userId, resumeId);
  }

  @Post(':resumeId/answer')
  answer(
    @CurrentUser() user: AuthUser,
    @Param('resumeId') resumeId: string,
    @Body(new ZodValidationPipe(ChatAnswerSchema)) body: unknown,
  ) {
    return this.chatBuilder.answer(user.userId, resumeId, body as never);
  }
}
