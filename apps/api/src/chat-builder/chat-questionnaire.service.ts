import { Injectable } from '@nestjs/common';
import { ResumeContent, emptyResumeContent } from '@hireup/shared';

export type ChatQuestion = {
  id: string;
  prompt: string;
  field: string;
};

export const CHAT_QUESTIONS: ChatQuestion[] = [
  {
    id: 'fullName',
    prompt: 'What is your full name as it should appear on the resume?',
    field: 'basics.fullName',
  },
  {
    id: 'email',
    prompt: 'What email should recruiters use to contact you?',
    field: 'basics.email',
  },
  {
    id: 'headline',
    prompt: 'In one line, what is your professional headline? (e.g. Senior Frontend Engineer)',
    field: 'basics.headline',
  },
  {
    id: 'location',
    prompt: 'Where are you based? (city, country)',
    field: 'basics.location',
  },
  {
    id: 'summary',
    prompt: 'Write a short professional summary (2–4 sentences).',
    field: 'summary',
  },
  {
    id: 'latestRole',
    prompt:
      'Describe your most recent role as: Title | Company | 2–3 achievement bullets separated by ;',
    field: 'experience',
  },
  {
    id: 'education',
    prompt: 'Describe your education as: Degree | School | Field (optional)',
    field: 'education',
  },
  {
    id: 'skills',
    prompt: 'List your top skills, separated by commas.',
    field: 'skills',
  },
];

@Injectable()
export class ChatQuestionnaireService {
  getQuestions() {
    return CHAT_QUESTIONS;
  }

  nextQuestion(stepIndex: number) {
    if (stepIndex >= CHAT_QUESTIONS.length) {
      return { completed: true as const, question: null };
    }
    return {
      completed: false as const,
      question: CHAT_QUESTIONS[stepIndex],
      stepIndex,
      total: CHAT_QUESTIONS.length,
    };
  }

  applyAnswer(
    content: ResumeContent,
    questionId: string,
    answer: string,
  ): ResumeContent {
    const next = structuredClone(content);
    switch (questionId) {
      case 'fullName':
        next.basics.fullName = answer.trim();
        break;
      case 'email':
        next.basics.email = answer.trim();
        break;
      case 'headline':
        next.basics.headline = answer.trim();
        break;
      case 'location':
        next.basics.location = answer.trim();
        break;
      case 'summary':
        next.summary = answer.trim();
        break;
      case 'latestRole': {
        const [title = '', company = '', bulletsRaw = ''] = answer
          .split('|')
          .map((p) => p.trim());
        next.experience = [
          {
            title: title || 'Role',
            company: company || 'Company',
            bullets: bulletsRaw
              .split(';')
              .map((b) => b.trim())
              .filter(Boolean),
          },
          ...next.experience,
        ];
        break;
      }
      case 'education': {
        const [degree = '', school = '', field = ''] = answer
          .split('|')
          .map((p) => p.trim());
        next.education = [
          {
            degree: degree || 'Degree',
            school: school || 'School',
            field: field || undefined,
          },
          ...next.education,
        ];
        break;
      }
      case 'skills':
        next.skills = answer
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      default:
        break;
    }
    return next;
  }

  buildInitialContent() {
    return emptyResumeContent();
  }
}
