'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import type { ResumeContent } from '@hireup/shared';
import { emptyResumeContent } from '@hireup/shared';
import { api } from '@/lib/api';
import { ResumePreview } from '@/components/ResumePreview';

type ResumeResponse = {
  id: string;
  title: string;
  content: ResumeContent;
  status: string;
};

export default function EditResumePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<ResumeContent>(emptyResumeContent());
  const [status, setStatus] = useState('DRAFT');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    api<ResumeResponse>(`/resumes/${id}`)
      .then((resume) => {
        setTitle(resume.title);
        setContent(resume.content);
        setStatus(resume.status);
      })
      .catch((err) => {
        if (err?.status === 401) window.location.href = '/login';
        else setError(err?.message ?? 'Failed to load resume');
      });
  }, [id]);

  const persist = useCallback(
    async (nextTitle: string, nextContent: ResumeContent, nextStatus?: string) => {
      setSaveState('saving');
      try {
        await api(`/resumes/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: nextTitle,
            content: nextContent,
            status: nextStatus,
          }),
        });
        setSaveState('saved');
      } catch (err) {
        setSaveState('error');
        setError((err as { message?: string })?.message ?? 'Save failed');
      }
    },
    [id],
  );

  function updateContent(updater: (prev: ResumeContent) => ResumeContent) {
    setContent((prev) => {
      const next = updater(prev);
      startTransition(() => {
        void persist(title, next);
      });
      return next;
    });
  }

  return (
    <div className="app-shell">
      <div className="container stack">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/dashboard" className="muted">
            ← Dashboard
          </Link>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="muted" aria-live="polite">
              {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Save error' : ''}
            </span>
            <Link href={`/resumes/${id}/match`} className="btn btn-primary">
              Match to a job
            </Link>
          </div>
        </div>

        {error && <p style={{ color: '#9b1c1c' }}>{error}</p>}

        <div className="field">
          <label htmlFor="title">Resume title</label>
          <input
            id="title"
            value={title}
            onChange={(e) => {
              const next = e.target.value;
              setTitle(next);
              void persist(next, content);
            }}
          />
        </div>

        <div className="edit-grid">
          <form className="panel stack" onSubmit={(e) => e.preventDefault()}>
            <h2 style={{ margin: 0 }}>Basics</h2>
            <div className="field">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                value={content.basics.fullName}
                onChange={(e) =>
                  updateContent((c) => ({
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
                value={content.basics.email}
                onChange={(e) =>
                  updateContent((c) => ({
                    ...c,
                    basics: { ...c.basics, email: e.target.value },
                  }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="headline">Headline</label>
              <input
                id="headline"
                value={content.basics.headline ?? ''}
                onChange={(e) =>
                  updateContent((c) => ({
                    ...c,
                    basics: { ...c.basics, headline: e.target.value },
                  }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="summary">Summary</label>
              <textarea
                id="summary"
                rows={4}
                value={content.summary}
                onChange={(e) =>
                  updateContent((c) => ({ ...c, summary: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="skills">Skills (comma-separated)</label>
              <input
                id="skills"
                value={content.skills.join(', ')}
                onChange={(e) =>
                  updateContent((c) => ({
                    ...c,
                    skills: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  }))
                }
              />
            </div>

            <h2>Experience</h2>
            {(content.experience[0] ? [content.experience[0]] : [{ company: '', title: '', bullets: [''] }]).map(
              (exp, idx) => (
                <div key={idx} className="stack">
                  <div className="field">
                    <label htmlFor="exp-title">Title</label>
                    <input
                      id="exp-title"
                      value={exp.title}
                      onChange={(e) =>
                        updateContent((c) => {
                          const experience = [...c.experience];
                          experience[0] = {
                            ...(experience[0] ?? { company: '', title: '', bullets: [] }),
                            title: e.target.value,
                          };
                          return { ...c, experience };
                        })
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="exp-company">Company</label>
                    <input
                      id="exp-company"
                      value={exp.company}
                      onChange={(e) =>
                        updateContent((c) => {
                          const experience = [...c.experience];
                          experience[0] = {
                            ...(experience[0] ?? { company: '', title: '', bullets: [] }),
                            company: e.target.value,
                          };
                          return { ...c, experience };
                        })
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="exp-bullets">Bullets (one per line)</label>
                    <textarea
                      id="exp-bullets"
                      rows={4}
                      value={(exp.bullets ?? []).join('\n')}
                      onChange={(e) =>
                        updateContent((c) => {
                          const experience = [...c.experience];
                          experience[0] = {
                            ...(experience[0] ?? { company: '', title: '', bullets: [] }),
                            bullets: e.target.value.split('\n').filter(Boolean),
                          };
                          return { ...c, experience };
                        })
                      }
                    />
                  </div>
                </div>
              ),
            )}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setStatus('READY');
                void persist(title, content, 'READY');
              }}
            >
              Mark ready ({status})
            </button>
          </form>

          <ResumePreview title={title} content={content} />
        </div>
      </div>
    </div>
  );
}
