import type { ResumeContent, SectionType } from '@hireup/shared';
import {
  enabledSections,
  formatRoleDateRange,
  normalizeSectionConfig,
  sectionHeading,
  visibleCustomSections,
  visibleEducationEntries,
  visibleExperienceRoles,
  visibleProjects,
} from '@hireup/shared';

function ResumeSectionTitle({ children }: { children: string }) {
  return <h2 className="resume-doc-section-title">{children}</h2>;
}

export function ResumePreview({
  title,
  content,
}: {
  title: string;
  content: ResumeContent;
}) {
  const config = normalizeSectionConfig(content.sectionConfig);
  const sections = enabledSections(config);
  const displayName = content.basics.fullName.trim() || title || 'Preview';

  const contactParts = [
    content.basics.email?.trim(),
    content.basics.phone?.trim(),
    content.basics.location?.trim(),
  ].filter(Boolean);

  for (const link of content.basics.links ?? []) {
    if (!link.url?.trim()) continue;
    const label = link.label?.trim() || 'Link';
    contactParts.push(`${label}: ${link.url.trim()}`);
  }

  function renderSection(sectionType: SectionType) {
    switch (sectionType) {
      case 'summary':
        if (!content.summary.trim()) return null;
        return (
          <section key="summary" className="resume-doc-section">
            <ResumeSectionTitle>{sectionHeading('summary', config)}</ResumeSectionTitle>
            <p className="resume-doc-summary">{content.summary.trim()}</p>
          </section>
        );
      case 'experience': {
        const roles = visibleExperienceRoles(content.experience);
        if (!roles.length) return null;
        return (
          <section key="experience" className="resume-doc-section">
            <ResumeSectionTitle>{sectionHeading('experience', config)}</ResumeSectionTitle>
            <div className="resume-entry-list">
              {roles.map((exp, i) => {
                const titleLine = [exp.title.trim(), exp.company.trim()]
                  .filter(Boolean)
                  .join(', ');
                const dates = formatRoleDateRange(
                  exp.startDate,
                  exp.endDate,
                  exp.current,
                );
                const bullets = exp.bullets.map((b) => b.trim()).filter(Boolean);
                return (
                  <article
                    key={`${exp.company}-${exp.title}-${i}`}
                    className="resume-entry"
                  >
                    {(titleLine || dates) && (
                      <div className="resume-entry-head">
                        {titleLine ? (
                          <span className="resume-entry-title">{titleLine}</span>
                        ) : (
                          <span />
                        )}
                        {dates ? (
                          <span className="resume-entry-dates">{dates}</span>
                        ) : null}
                      </div>
                    )}
                    {exp.location?.trim() ? (
                      <p className="resume-entry-meta">{exp.location.trim()}</p>
                    ) : null}
                    {bullets.length > 0 ? (
                      <ul className="resume-bullets">
                        {bullets.map((b, bi) => (
                          <li key={`${bi}-${b.slice(0, 24)}`}>{b}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        );
      }
      case 'education': {
        const entries = visibleEducationEntries(content.education);
        if (!entries.length) return null;
        return (
          <section key="education" className="resume-doc-section">
            <ResumeSectionTitle>{sectionHeading('education', config)}</ResumeSectionTitle>
            <div className="resume-entry-list">
              {entries.map((ed, i) => {
                const line = [ed.degree.trim(), ed.field?.trim(), ed.school.trim()]
                  .filter(Boolean)
                  .join(', ');
                const dates = [ed.startDate, ed.endDate].filter(Boolean).join(' - ');
                return (
                  <article key={`${ed.school}-${i}`} className="resume-entry resume-entry-compact">
                    {(line || dates) && (
                      <div className="resume-entry-head">
                        {line ? <span className="resume-entry-title">{line}</span> : <span />}
                        {dates ? (
                          <span className="resume-entry-dates">{dates}</span>
                        ) : null}
                      </div>
                    )}
                    {ed.details?.trim() ? (
                      <p className="resume-entry-body">{ed.details.trim()}</p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        );
      }
      case 'skills': {
        const skills = content.skills.map((s) => s.trim()).filter(Boolean);
        if (!skills.length) return null;
        return (
          <section key="skills" className="resume-doc-section">
            <ResumeSectionTitle>{sectionHeading('skills', config)}</ResumeSectionTitle>
            <p className="resume-doc-skills">{skills.join(', ')}</p>
          </section>
        );
      }
      case 'projects': {
        const projects = visibleProjects(content.projects);
        if (!projects.length) return null;
        return (
          <section key="projects" className="resume-doc-section">
            <ResumeSectionTitle>{sectionHeading('projects', config)}</ResumeSectionTitle>
            <div className="resume-entry-list">
              {projects.map((p, i) => {
                const bullets = p.bullets.map((b) => b.trim()).filter(Boolean);
                return (
                  <article key={`${p.name}-${i}`} className="resume-entry">
                    {p.name.trim() ? (
                      <p className="resume-entry-title resume-entry-title-block">
                        {p.name.trim()}
                      </p>
                    ) : null}
                    {p.url?.trim() ? (
                      <p className="resume-entry-meta">{p.url.trim()}</p>
                    ) : null}
                    {p.description?.trim() ? (
                      <p className="resume-entry-body">{p.description.trim()}</p>
                    ) : null}
                    {bullets.length > 0 ? (
                      <ul className="resume-bullets">
                        {bullets.map((b, bi) => (
                          <li key={`${bi}-${b.slice(0, 24)}`}>{b}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        );
      }
      case 'custom': {
        const blocks = visibleCustomSections(content.customSections);
        if (!blocks.length) return null;
        return (
          <div key="custom" className="resume-doc-custom-group">
            {blocks.map((block) => (
              <section key={block.title || block.content} className="resume-doc-section">
                <ResumeSectionTitle>
                  {block.title.trim() || 'Additional'}
                </ResumeSectionTitle>
                <p className="resume-entry-body">{block.content.trim()}</p>
              </section>
            ))}
          </div>
        );
      }
      default:
        return null;
    }
  }

  return (
    <div className="resume-document-shell">
      <p className="resume-document-label">Live preview</p>
      <aside className="resume-document" aria-label="Resume preview">
        <header className="resume-doc-header">
          <h1 className="resume-doc-name">{displayName}</h1>
          {content.basics.headline?.trim() ? (
            <p className="resume-doc-headline">{content.basics.headline.trim()}</p>
          ) : null}
          {contactParts.length > 0 ? (
            <p className="resume-doc-contact">{contactParts.join(' | ')}</p>
          ) : null}
        </header>

        <div className="resume-doc-body">
          {sections.map((sectionType) => renderSection(sectionType))}
        </div>
      </aside>
    </div>
  );
}
