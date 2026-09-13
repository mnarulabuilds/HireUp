import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatAnswerSchema, ResumeContentSchema } from '@hireup/shared';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { ChatQuestionnaireService } from './chat-questionnaire.service';
import { ResumesService } from '../resumes/resumes.service';

@Injectable()
export class ChatBuilderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chat: ChatQuestionnaireService,
    private readonly resumes: ResumesService,
  ) {}

  async start(userId: string) {
    const resume = await this.resumes.create(userId, {
      title: 'Chat Resume',
      source: 'CHAT',
      content: this.chat.buildInitialContent(),
    });

    await this.prisma.chatBuilderState.create({
      data: { resumeId: resume.id, stepIndex: 0, answers: {} },
    });

    return {
      resumeId: resume.id,
      ...this.chat.nextQuestion(0),
    };
  }

  async current(userId: string, resumeId: string) {
    await this.resumes.get(userId, resumeId);
    const state = await this.prisma.chatBuilderState.findUnique({
      where: { resumeId },
    });
    if (!state) {
      throw new NotFoundException('Chat builder state not found');
    }
    const next = this.chat.nextQuestion(state.stepIndex);
    return {
      resumeId,
      ...next,
      completed: state.completed || next.completed,
    };
  }

  async answer(
    userId: string,
    resumeId: string,
    input: z.infer<typeof ChatAnswerSchema>,
  ) {
    const resume = await this.resumes.get(userId, resumeId);
    const state = await this.prisma.chatBuilderState.findUnique({
      where: { resumeId },
    });
    if (!state || state.completed) {
      throw new NotFoundException('No active chat questionnaire');
    }

    const question = this.chat.getQuestions()[state.stepIndex];
    if (!question) {
      return { completed: true, resumeId };
    }

    const content = this.chat.applyAnswer(
      ResumeContentSchema.parse(resume.content),
      question.id,
      input.answer,
    );

    const nextIndex = state.stepIndex + 1;
    const completed = nextIndex >= this.chat.getQuestions().length;
    const answers = {
      ...(state.answers as Record<string, string>),
      [question.id]: input.answer,
    };

    await this.prisma.$transaction([
      this.prisma.resume.update({
        where: { id: resumeId },
        data: {
          content: content as Prisma.InputJsonValue,
          status: completed ? 'READY' : 'DRAFT',
          title: content.basics.fullName
            ? `${content.basics.fullName} Resume`
            : resume.title,
        },
      }),
      this.prisma.chatBuilderState.update({
        where: { resumeId },
        data: {
          stepIndex: nextIndex,
          answers: answers as Prisma.InputJsonValue,
          completed,
        },
      }),
    ]);

    const next = this.chat.nextQuestion(nextIndex);
    return {
      resumeId,
      ...next,
      completed: completed || next.completed,
    };
  }
}
