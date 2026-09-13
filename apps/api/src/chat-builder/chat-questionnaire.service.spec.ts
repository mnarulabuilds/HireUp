import { ChatQuestionnaireService } from './chat-questionnaire.service';
import { emptyResumeContent } from '@hireup/shared';

describe('ChatQuestionnaireService', () => {
  const service = new ChatQuestionnaireService();

  it('walks questions until complete', () => {
    const first = service.nextQuestion(0);
    expect(first.completed).toBe(false);
    expect(first.question?.id).toBe('fullName');

    const done = service.nextQuestion(service.getQuestions().length);
    expect(done.completed).toBe(true);
  });

  it('applies answers into resume content', () => {
    let content = emptyResumeContent();
    content = service.applyAnswer(content, 'fullName', 'Sam Lee');
    content = service.applyAnswer(content, 'skills', 'React, Node, SQL');
    content = service.applyAnswer(
      content,
      'latestRole',
      'Engineer | HireUp | Shipped resume builder; Improved match scores',
    );

    expect(content.basics.fullName).toBe('Sam Lee');
    expect(content.skills).toEqual(['React', 'Node', 'SQL']);
    expect(content.experience[0]?.company).toBe('HireUp');
    expect(content.experience[0]?.bullets).toHaveLength(2);
  });
});
