import type { ResumeContent } from '@hireup/shared';

export function ResumePreview({
  title,
  content,
}: {
  title: string;
  content: ResumeContent;
}) {
  return (
    <aside className="panel stack" aria-label="Resume preview">
      <h2 style={{ margin: 0 }}>{content.basics.fullName || title || 'Preview'}</h2>
      {content.basics.headline && <p className="muted">{content.basics.headline}</p>}
      <p className="muted" style={{ fontSize: '0.9rem' }}>
        {[content.basics.email, content.basics.phone, content.basics.location]
          .filter(Boolean)
          .join(' · ')}
      </p>
      {content.summary && (
        <div>
          <h3>Summary</h3>
          <p>{content.summary}</p>
        </div>
      )}
      {content.experience.length > 0 && (
        <div>
          <h3>Experience</h3>
          {content.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '0.8rem' }}>
              <strong>
                {exp.title} — {exp.company}
              </strong>
              <ul>
                {exp.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {content.skills.length > 0 && (
        <div>
          <h3>Skills</h3>
          <p>{content.skills.join(', ')}</p>
        </div>
      )}
    </aside>
  );
}
