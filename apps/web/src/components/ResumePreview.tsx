import type { ResumeContent } from '@hireup/shared';
import {
  enabledSections,
  normalizeSectionConfig,
  sectionHeading,
} from '@hireup/shared';

export function ResumePreview({
  title,
  content,
}: {
  title: string;
  content: ResumeContent;
}) {
  const config = normalizeSectionConfig(content.sectionConfig);
  const sections = enabledSections(config);

  return (
    <aside className="panel stack resume-preview" aria-label="Resume preview">
      <h2 style={{ margin: 0 }}>{content.basics.fullName || title || 'Preview'}</h2>
      {content.basics.headline && (
        <p className="muted">{content.basics.headline}</p>
      )}
      <p className="muted" style={{ fontSize: '0.9rem' }}>
        {[content.basics.email, content.basics.phone, content.basics.location]
          .filter(Boolean)
          .join(' · ')}
      </p>
      {content.basics.links?.length > 0 && (
        <ul className="preview-links">
          {content.basics.links.map((l) => (
            <li key={`${l.label}-${l.url}`}>
              {l.label}: {l.url}
            </li>
          ))}
        </ul>
      )}

      {sections.includes('summary') && content.summary && (
        <div>
          <h3>{sectionHeading('summary', config)}</h3>
          <p>{content.summary}</p>
        </div>
      )}
      {sections.includes('experience') && content.experience.length > 0 && (
        <div>
          <h3>{sectionHeading('experience', config)}</h3>
          {content.experience.map((exp, i) => (
            <div key={`${exp.company}-${exp.title}-${i}`} style={{ marginBottom: '0.8rem' }}>
              <strong>
                {exp.title}
                {exp.company ? ` — ${exp.company}` : ''}
              </strong>
              {(exp.startDate || exp.endDate) && (
                <p className="muted" style={{ margin: '0.15rem 0', fontSize: '0.85rem' }}>
                  {[exp.startDate, exp.endDate ?? (exp.current ? 'Present' : '')]
                    .filter(Boolean)
                    .join(' – ')}
                </p>
              )}
              <ul>
                {exp.bullets.map((b, bi) => (
                  <li key={`${bi}-${b.slice(0, 24)}`}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {sections.includes('education') && content.education.length > 0 && (
        <div>
          <h3>{sectionHeading('education', config)}</h3>
          {content.education.map((ed, i) => (
            <p key={`${ed.school}-${i}`} style={{ margin: '0.25rem 0' }}>
              {[ed.degree, ed.field, ed.school].filter(Boolean).join(' — ')}
            </p>
          ))}
        </div>
      )}
      {sections.includes('skills') && content.skills.length > 0 && (
        <div>
          <h3>{sectionHeading('skills', config)}</h3>
          <p>{content.skills.join(', ')}</p>
        </div>
      )}
      {sections.includes('projects') && content.projects.length > 0 && (
        <div>
          <h3>{sectionHeading('projects', config)}</h3>
          {content.projects.map((p, i) => (
            <div key={`${p.name}-${i}`}>
              <strong>{p.name}</strong>
              {p.description && <p className="muted">{p.description}</p>}
            </div>
          ))}
        </div>
      )}
      {sections.includes('custom') &&
        content.customSections.map((block) => (
          <div key={block.title}>
            <h3>{block.title}</h3>
            <p>{block.content}</p>
          </div>
        ))}
    </aside>
  );
}
