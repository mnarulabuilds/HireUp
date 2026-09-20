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

  it('maps remaining fields and builds initial content', () => {
    let content = emptyResumeContent();
    content = service.applyAnswer(content, 'email', 'sam@example.com');
    content = service.applyAnswer(content, 'headline', 'Engineer');
    content = service.applyAnswer(content, 'location', 'Berlin');
    content = service.applyAnswer(content, 'summary', 'Builder of tools.');
    content = service.applyAnswer(content, 'education', 'B.S. | State U | CS');
    expect(content.basics.email).toBe('sam@example.com');
    expect(content.education[0]?.school).toBe('State U');
    expect(service.buildInitialContent().basics.fullName).toBe('');
  });

  it('ignores unknown question ids', () => {
    const content = emptyResumeContent();
    const next = service.applyAnswer(content, 'unknown', 'value');
    expect(next).toEqual(content);
  });

  it('applies role and education defaults when pipe segments are empty', () => {
    let content = emptyResumeContent();
    content = service.applyAnswer(content, 'latestRole', ' |  | ');
    expect(content.experience[0]).toMatchObject({
      title: 'Role',
      company: 'Company',
      bullets: [],
    });

    content = service.applyAnswer(content, 'education', ' |  | ');
    expect(content.education[0]).toMatchObject({
      degree: 'Degree',
      school: 'School',
      field: undefined,
    });
  });
});
