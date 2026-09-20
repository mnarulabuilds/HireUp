'use client';

import type { ResumeContent } from '@hireup/shared';

type Props = {
  content: ResumeContent;
  onChange: (updater: (prev: ResumeContent) => ResumeContent) => void;
};

export function ResumeEditorForm({ content, onChange }: Props) {
  return (
    <form className="panel stack" onSubmit={(e) => e.preventDefault()} aria-label="Resume editor">
      <h2 style={{ margin: 0 }}>Basics</h2>
      <div className="field-grid-2">
        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            autoComplete="name"
            value={content.basics.fullName}
            onChange={(e) =>
              onChange((c) => ({
                ...c,
                basics: { ...c.basics, fullName: e.target.value },
              }))
            }
          />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={content.basics.email}
            onChange={(e) =>
              onChange((c) => ({
                ...c,
                basics: { ...c.basics, email: e.target.value },
              }))
            }
          />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={content.basics.phone ?? ''}
            onChange={(e) =>
              onChange((c) => ({
                ...c,
                basics: { ...c.basics, phone: e.target.value },
              }))
            }
          />
        </div>
        <div className="field">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            value={content.basics.location ?? ''}
            onChange={(e) =>
              onChange((c) => ({
                ...c,
                basics: { ...c.basics, location: e.target.value },
              }))
            }
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="headline">Headline</label>
        <input
          id="headline"
          value={content.basics.headline ?? ''}
          onChange={(e) =>
            onChange((c) => ({
              ...c,
              basics: { ...c.basics, headline: e.target.value },
            }))
          }
        />
      </div>
      <div className="field">
        <label htmlFor="links">Links (label|url per line)</label>
        <textarea
          id="links"
          rows={2}
          value={content.basics.links
            .map((l) => `${l.label}|${l.url}`)
            .join('\n')}
          onChange={(e) =>
            onChange((c) => ({
              ...c,
              basics: {
                ...c.basics,
                links: e.target.value
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => {
                    const [label, url] = line.split('|');
                    return { label: (label ?? '').trim(), url: (url ?? '').trim() };
                  })
                  .filter((l) => l.label && l.url),
              },
            }))
          }
        />
      </div>

      <h2>Summary</h2>
      <div className="field">
        <label htmlFor="summary">Professional summary</label>
        <textarea
          id="summary"
          rows={4}
          value={content.summary}
          onChange={(e) =>
            onChange((c) => ({ ...c, summary: e.target.value }))
          }
        />
      </div>

      <div className="section-header-row">
        <h2 style={{ margin: 0 }}>Experience</h2>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() =>
            onChange((c) => ({
              ...c,
              experience: [
                ...c.experience,
                { company: '', title: '', bullets: [''] },
              ],
            }))
          }
        >
          Add role
        </button>
      </div>
      {content.experience.map((exp, idx) => (
        <fieldset key={idx} className="nested-panel stack">
          <legend className="sr-only">Experience role {idx + 1}</legend>
          <div className="field-grid-2">
            <div className="field">
              <label htmlFor={`exp-title-${idx}`}>Title</label>
              <input
                id={`exp-title-${idx}`}
                value={exp.title}
                onChange={(e) =>
                  onChange((c) => {
                    const experience = [...c.experience];
                    experience[idx] = { ...experience[idx]!, title: e.target.value };
                    return { ...c, experience };
                  })
                }
              />
            </div>
            <div className="field">
              <label htmlFor={`exp-company-${idx}`}>Company</label>
              <input
                id={`exp-company-${idx}`}
                value={exp.company}
                onChange={(e) =>
                  onChange((c) => {
                    const experience = [...c.experience];
                    experience[idx] = { ...experience[idx]!, company: e.target.value };
                    return { ...c, experience };
                  })
                }
              />
            </div>
            <div className="field">
              <label htmlFor={`exp-start-${idx}`}>Start</label>
              <input
                id={`exp-start-${idx}`}
                placeholder="2020"
                value={exp.startDate ?? ''}
                onChange={(e) =>
                  onChange((c) => {
                    const experience = [...c.experience];
                    experience[idx] = { ...experience[idx]!, startDate: e.target.value };
                    return { ...c, experience };
                  })
                }
              />
            </div>
            <div className="field">
              <label htmlFor={`exp-end-${idx}`}>End</label>
              <input
                id={`exp-end-${idx}`}
                placeholder="Present"
                value={exp.endDate ?? ''}
                disabled={exp.current}
                onChange={(e) =>
                  onChange((c) => {
                    const experience = [...c.experience];
                    experience[idx] = { ...experience[idx]!, endDate: e.target.value };
                    return { ...c, experience };
                  })
                }
              />
            </div>
          </div>
          <label className="checkbox-inline">
            <input
              type="checkbox"
              checked={!!exp.current}
              onChange={(e) =>
                onChange((c) => {
                  const experience = [...c.experience];
                  experience[idx] = {
                    ...experience[idx]!,
                    current: e.target.checked,
                    endDate: e.target.checked ? '' : experience[idx]!.endDate,
                  };
                  return { ...c, experience };
                })
              }
            />
            Current role
          </label>
          <div className="field">
            <label htmlFor={`exp-bullets-${idx}`}>Bullets (one per line)</label>
            <textarea
              id={`exp-bullets-${idx}`}
              rows={4}
              value={(exp.bullets ?? []).join('\n')}
              onChange={(e) =>
                onChange((c) => {
                  const experience = [...c.experience];
                  experience[idx] = {
                    ...experience[idx]!,
                    bullets: e.target.value.split('\n').filter((b) => b.length > 0),
                  };
                  return { ...c, experience };
                })
              }
            />
          </div>
          {content.experience.length > 1 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                onChange((c) => ({
                  ...c,
                  experience: c.experience.filter((_, i) => i !== idx),
                }))
              }
            >
              Remove role
            </button>
          )}
        </fieldset>
      ))}

      <div className="section-header-row">
        <h2 style={{ margin: 0 }}>Education</h2>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() =>
            onChange((c) => ({
              ...c,
              education: [...c.education, { school: '', degree: '' }],
            }))
          }
        >
          Add school
        </button>
      </div>
      {content.education.map((ed, idx) => (
        <fieldset key={idx} className="nested-panel stack">
          <legend className="sr-only">Education {idx + 1}</legend>
          <div className="field-grid-2">
            <div className="field">
              <label htmlFor={`ed-school-${idx}`}>School</label>
              <input
                id={`ed-school-${idx}`}
                value={ed.school}
                onChange={(e) =>
                  onChange((c) => {
                    const education = [...c.education];
                    education[idx] = { ...education[idx]!, school: e.target.value };
                    return { ...c, education };
                  })
                }
              />
            </div>
            <div className="field">
              <label htmlFor={`ed-degree-${idx}`}>Degree</label>
              <input
                id={`ed-degree-${idx}`}
                value={ed.degree}
                onChange={(e) =>
                  onChange((c) => {
                    const education = [...c.education];
                    education[idx] = { ...education[idx]!, degree: e.target.value };
                    return { ...c, education };
                  })
                }
              />
            </div>
          </div>
        </fieldset>
      ))}

      <h2>Skills</h2>
      <div className="field">
        <label htmlFor="skills">Skills (comma-separated)</label>
        <input
          id="skills"
          value={content.skills.join(', ')}
          onChange={(e) =>
            onChange((c) => ({
              ...c,
              skills: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            }))
          }
        />
      </div>

      <div className="section-header-row">
        <h2 style={{ margin: 0 }}>Projects</h2>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() =>
            onChange((c) => ({
              ...c,
              projects: [...c.projects, { name: '', bullets: [] }],
            }))
          }
        >
          Add project
        </button>
      </div>
      {content.projects.map((p, idx) => (
        <fieldset key={idx} className="nested-panel stack">
          <legend className="sr-only">Project {idx + 1}</legend>
          <div className="field">
            <label htmlFor={`proj-name-${idx}`}>Name</label>
            <input
              id={`proj-name-${idx}`}
              value={p.name}
              onChange={(e) =>
                onChange((c) => {
                  const projects = [...c.projects];
                  projects[idx] = { ...projects[idx]!, name: e.target.value };
                  return { ...c, projects };
                })
              }
            />
          </div>
          <div className="field">
            <label htmlFor={`proj-desc-${idx}`}>Description</label>
            <textarea
              id={`proj-desc-${idx}`}
              rows={2}
              value={p.description ?? ''}
              onChange={(e) =>
                onChange((c) => {
                  const projects = [...c.projects];
                  projects[idx] = { ...projects[idx]!, description: e.target.value };
                  return { ...c, projects };
                })
              }
            />
          </div>
        </fieldset>
      ))}
    </form>
  );
}
