import { Module } from '@nestjs/common';
import { ChatBuilderService } from './chat-builder.service';
import { ChatBuilderController } from './chat-builder.controller';
import { ChatQuestionnaireService } from './chat-questionnaire.service';
import { ResumesModule } from '../resumes/resumes.module';

@Module({
  imports: [ResumesModule],
  providers: [ChatBuilderService, ChatQuestionnaireService],
  controllers: [ChatBuilderController],
  exports: [ChatQuestionnaireService],
})
export class ChatBuilderModule {}
