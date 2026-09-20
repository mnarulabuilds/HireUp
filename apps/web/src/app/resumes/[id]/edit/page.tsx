'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import type { ResumeContent } from '@hireup/shared';
import { emptyResumeContent } from '@hireup/shared';
import { api } from '@/lib/api';
import { downloadResumeExport } from '@/lib/download';
import { ResumePreview } from '@/components/ResumePreview';

function PanelSkeleton({ label }: { label: string }) {
  return (
    <section className="panel stack" aria-busy="true" aria-label={label}>
      <div className="skeleton" />
      <div className="skeleton" />
    </section>
  );
}

const ResumeEditorForm = dynamic(
  () => import('@/components/ResumeEditorForm').then((m) => ({ default: m.ResumeEditorForm })),
  { loading: () => <PanelSkeleton label="Loading resume editor" /> },
);

const ResumeSectionControls = dynamic(
  () =>
    import('@/components/ResumeSectionControls').then((m) => ({
      default: m.ResumeSectionControls,
    })),
  { loading: () => <PanelSkeleton label="Loading section controls" /> },
);

const ResumeSuggestionsPanel = dynamic(
  () =>
    import('@/components/ResumeSuggestionsPanel').then((m) => ({
      default: m.ResumeSuggestionsPanel,
    })),
  { loading: () => <PanelSkeleton label="Loading suggestions" /> },
);

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
  const [exportError, setExportError] = useState<string | null>(null);
  const [resumeLoaded, setResumeLoaded] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setResumeLoaded(false);
    api<ResumeResponse>(`/resumes/${id}`)
      .then((resume) => {
        setTitle(resume.title);
        setContent(resume.content);
        setStatus(resume.status);
        setResumeLoaded(true);
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

  async function handleExport(format: 'txt' | 'pdf') {
    setExportError(null);
    try {
      await downloadResumeExport(id, format);
    } catch (err) {
      setExportError((err as Error).message ?? 'Export failed');
    }
  }

  return (
    <div className="app-shell">
      <div className="container stack">
        <div className="page-toolbar">
          <Link href="/dashboard" className="muted">
            ← Dashboard
          </Link>
          <div className="toolbar-actions">
            <span className="muted" aria-live="polite">
              {saveState === 'saving'
                ? 'Saving…'
                : saveState === 'saved'
                  ? 'Saved'
                  : saveState === 'error'
                    ? 'Save error'
                    : ''}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void handleExport('txt')}
            >
              Download TXT
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void handleExport('pdf')}
            >
              Download PDF
            </button>
            <Link href={`/resumes/${id}/match`} className="btn btn-primary">
              Match to a job
            </Link>
          </div>
        </div>

        {error && (
          <p role="alert" aria-live="assertive" className="form-error">
            {error}
          </p>
        )}
        {exportError && (
          <p role="alert" aria-live="assertive" className="form-error">
            {exportError}
          </p>
        )}

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

        <div className="edit-layout">
          <div className="stack">
            <ResumeSectionControls
              content={content}
              onChange={(next) => updateContent(() => next)}
            />
            <ResumeSuggestionsPanel content={resumeLoaded ? content : null} />
            <ResumeEditorForm content={content} onChange={updateContent} />
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
          </div>
          <ResumePreview title={title} content={content} />
        </div>
      </div>
    </div>
  );
}
