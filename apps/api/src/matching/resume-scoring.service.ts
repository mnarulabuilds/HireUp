import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import {
  MatchFeedback,
  MatchFeedbackSchema,
  MatchScores,
  MatchScoresSchema,
  ResumeContent,
  ResumeContentSchema,
  keywordOverlapRatio,
  missingJobKeywords,
  tokenizeJobText,
} from '@hireup/shared';
import OpenAI from 'openai';

export type ScoreResult = {
  scores: MatchScores;
  feedback: MatchFeedback;
  provider: 'openai' | 'heuristic';
};

@Injectable()
export class ResumeScoringService {
  private readonly logger = new Logger(ResumeScoringService.name);

  contentHash(
    resume: ResumeContent,
    jobDescription: string,
    options?: { richFeedback?: boolean; jobTitle?: string },
  ) {
    return createHash('sha256')
      .update(JSON.stringify(resume))
      .update('\n')
      .update(jobDescription)
      .update('\n')
      .update(options?.jobTitle ?? '')
      .update('\n')
      .update(options?.richFeedback ? 'rich' : 'basic')
      .digest('hex');
  }

  async score(
    resumeInput: unknown,
    jobDescription: string,
    richFeedback: boolean,
    jobTitle?: string,
  ): Promise<ScoreResult> {
    const resume = ResumeContentSchema.parse(resumeInput);
    if (process.env.OPENAI_API_KEY) {
      try {
        const ai = await this.scoreWithOpenAI(
          resume,
          jobDescription,
          richFeedback,
          jobTitle,
        );
        return { ...ai, provider: 'openai' };
      } catch (err) {
        this.logger.warn(`OpenAI scoring failed, using heuristic: ${String(err)}`);
      }
    }
    return {
      ...this.scoreHeuristic(resume, jobDescription, richFeedback, jobTitle),
      provider: 'heuristic',
    };
  }

  scoreHeuristic(
    resume: ResumeContent,
    jobDescription: string,
    richFeedback: boolean,
    jobTitle?: string,
  ): Omit<ScoreResult, 'provider'> {
    const jd = jobDescription.toLowerCase();
    const resumeSkills = resume.skills.map((s) => s.toLowerCase());
    const resumeText = JSON.stringify(resume).toLowerCase();
    const jdTokens = tokenizeJobText(`${jobDescription} ${jobTitle ?? ''}`);

    const skillHits = resumeSkills.filter((s) => jd.includes(s)).length;
    const listedSkillCoverage = keywordOverlapRatio(
      jdTokens.filter((t) => t.length > 3),
      resumeSkills.join(' '),
    );
    const tokenHits = jdTokens.filter((t) => resumeText.includes(t)).length;
    const titleBoost =
      jobTitle && jobTitle.trim().length > 2
        ? Math.round(keywordOverlapRatio(tokenizeJobText(jobTitle), resumeText) * 12)
        : 0;
    const skillScore = Math.min(
      100,
      Math.round(
        (skillHits / Math.max(resumeSkills.length || 1, 1)) * 55 +
          listedSkillCoverage * 25 +
          (tokenHits / Math.max(jdTokens.length, 1)) * 20 +
          (resumeSkills.length ? 8 : 0) +
          titleBoost,
      ),
    );

    const expYearsProxy = resume.experience.length * 18;
    const bulletCount = resume.experience.reduce(
      (n, e) => n + e.bullets.length,
      0,
    );
    const experienceScore = Math.min(
      100,
      Math.round(expYearsProxy + bulletCount * 4 + (resume.summary ? 8 : 0)),
    );

    const atsScore = Math.min(
      100,
      Math.round(
        (resume.basics.email ? 15 : 0) +
          (resume.basics.fullName ? 10 : 0) +
          (resume.skills.length ? 20 : 0) +
          (resume.experience.length ? 25 : 0) +
          (resume.education.length ? 15 : 0) +
          (resume.summary.length > 40 ? 15 : 5),
      ),
    );

    const overall = Math.round(
      skillScore * 0.4 + experienceScore * 0.3 + atsScore * 0.3,
    );
    const interviewClearance = Math.min(
      100,
      Math.round(overall * 0.85 + (bulletCount > 4 ? 8 : 0)),
    );

    const missingSkills = missingJobKeywords(
      jobDescription,
      resumeText,
      richFeedback ? 8 : 3,
      jobTitle ?? '',
    );

    const feedback: MatchFeedback = {
      strengths: [
        resume.skills.length
          ? `Skills present: ${resume.skills.slice(0, 5).join(', ')}`
          : 'Clear contact basics help ATS parsing',
        resume.experience.length
          ? `${resume.experience.length} role(s) documented`
          : 'Resume structure is readable',
      ].filter(Boolean),
      gaps: missingSkills.length
        ? missingSkills.map((s) => `Consider adding evidence for “${s}”`)
        : ['Add more quantified impact bullets'],
      actions: [
        'Mirror exact keywords from the job description in skills and bullets',
        'Lead bullets with action verbs and measurable outcomes',
        richFeedback
          ? 'Tailor your summary to the target role’s top 3 responsibilities'
          : 'Upgrade to Pro for deeper rewrite suggestions',
      ],
      interviewStages: [
        {
          stage: 'Recruiter screen',
          likelihood: Math.min(100, interviewClearance + 5),
          tip: 'Prepare a 60-second story matching the JD headline.',
        },
        {
          stage: 'Hiring manager',
          likelihood: interviewClearance,
          tip: 'Map 2–3 bullets to the role’s must-have requirements.',
        },
        {
          stage: 'Onsite / loop',
          likelihood: Math.max(20, interviewClearance - 12),
          tip: 'Practice deep dives on projects listed on the resume.',
        },
        {
          stage: 'Offer',
          likelihood: Math.max(10, interviewClearance - 22),
          tip: 'Align compensation research with the level implied by the JD.',
        },
      ],
    };

    return {
      scores: {
        overall,
        ats: atsScore,
        skills: skillScore,
        experience: experienceScore,
        interviewClearance,
      },
      feedback,
    };
  }

  private async scoreWithOpenAI(
    resume: ResumeContent,
    jobDescription: string,
    richFeedback: boolean,
    jobTitle?: string,
  ): Promise<Omit<ScoreResult, 'provider'>> {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `You are an expert resume coach and ATS analyst.
Return ONLY valid JSON with shape:
{"scores":{"overall":0-100,"ats":0-100,"skills":0-100,"experience":0-100,"interviewClearance":0-100},
"feedback":{"strengths":string[],"gaps":string[],"actions":string[],
"interviewStages":[{"stage":string,"likelihood":0-100,"tip":string}]}}
Rich feedback: ${richFeedback}
Target job title: ${jobTitle ?? 'Not provided'}
Job description:
${jobDescription}
Resume JSON:
${JSON.stringify(resume)}`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'Respond with JSON only.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as { scores?: MatchScores; feedback?: MatchFeedback };
    return {
      scores: MatchScoresSchema.parse(parsed.scores),
      feedback: MatchFeedbackSchema.parse(parsed.feedback),
    };
  }
}
