import type { ResumeContent, SectionType } from '@hireup/shared';
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

  function renderSection(sectionType: SectionType) {
    switch (sectionType) {
      case 'summary':
        if (!content.summary) return null;
        return (
          <div key="summary">
            <h3>{sectionHeading('summary', config)}</h3>
            <p>{content.summary}</p>
          </div>
        );
      case 'experience':
        if (!content.experience.length) return null;
        return (
          <div key="experience">
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
        );
      case 'education':
        if (!content.education.length) return null;
        return (
          <div key="education">
            <h3>{sectionHeading('education', config)}</h3>
            {content.education.map((ed, i) => (
              <p key={`${ed.school}-${i}`} style={{ margin: '0.25rem 0' }}>
                {[ed.degree, ed.field, ed.school].filter(Boolean).join(' — ')}
              </p>
            ))}
          </div>
        );
      case 'skills':
        if (!content.skills.length) return null;
        return (
          <div key="skills">
            <h3>{sectionHeading('skills', config)}</h3>
            <p>{content.skills.join(', ')}</p>
          </div>
        );
      case 'projects':
        if (!content.projects.length) return null;
        return (
          <div key="projects">
            <h3>{sectionHeading('projects', config)}</h3>
            {content.projects.map((p, i) => (
              <div key={`${p.name}-${i}`}>
                <strong>{p.name}</strong>
                {p.description && <p className="muted">{p.description}</p>}
              </div>
            ))}
          </div>
        );
      case 'custom':
        if (!content.customSections.length) return null;
        return (
          <div key="custom">
            {content.customSections.map((block) => (
              <div key={block.title}>
                <h3>{block.title}</h3>
                <p>{block.content}</p>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  }

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

      {sections.map((sectionType) => renderSection(sectionType))}
    </aside>
  );
}
