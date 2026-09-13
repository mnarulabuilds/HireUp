'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function NewResumePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function createForm() {
    setBusy('form');
    setError(null);
    try {
      const resume = await api<{ id: string }>('/resumes', {
        method: 'POST',
        body: JSON.stringify({ title: 'Untitled Resume', source: 'FORM' }),
      });
      router.push(`/resumes/${resume.id}/edit`);
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Could not create resume');
    } finally {
      setBusy(null);
    }
  }

  async function startChat() {
    setBusy('chat');
    setError(null);
    try {
      const session = await api<{ resumeId: string }>('/chat-builder/start', {
        method: 'POST',
      });
      router.push(`/resumes/${session.resumeId}/chat`);
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Could not start chat');
    } finally {
      setBusy(null);
    }
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setBusy('upload');
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const resume = await api<{ id: string }>('/resumes/upload', {
        method: 'POST',
        body: form,
      });
      router.push(`/resumes/${resume.id}/edit`);
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Upload failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="app-shell">
      <div className="container stack">
        <Link href="/dashboard" className="muted">
          ← Dashboard
        </Link>
        <h1>How do you want to build?</h1>
        <p className="lead">
          Pick one path. You can always edit the structured resume afterward.
        </p>
        {error && <p style={{ color: '#9b1c1c' }}>{error}</p>}
        <div className="grid-3" data-testid="builder-entry">
          <button
            type="button"
            className="panel stack"
            style={{ textAlign: 'left', cursor: 'pointer' }}
            onClick={createForm}
            disabled={!!busy}
          >
            <h2 style={{ margin: 0 }}>Forms</h2>
            <p className="muted">Fill section-by-section with live preview.</p>
            <span className="btn btn-primary">
              {busy === 'form' ? 'Creating…' : 'Start forms'}
            </span>
          </button>

          <label className="panel stack" style={{ cursor: 'pointer' }}>
            <h2 style={{ margin: 0 }}>Upload</h2>
            <p className="muted">PDF, DOCX, or TXT — we extract a draft.</p>
            <input
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,text/plain"
              hidden
              onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
            />
            <span className="btn btn-secondary">
              {busy === 'upload' ? 'Parsing…' : 'Choose file'}
            </span>
          </label>

          <button
            type="button"
            className="panel stack"
            style={{ textAlign: 'left', cursor: 'pointer' }}
            onClick={startChat}
            disabled={!!busy}
          >
            <h2 style={{ margin: 0 }}>Chat questionnaire</h2>
            <p className="muted">Answer short prompts; we assemble the resume.</p>
            <span className="btn btn-accent">
              {busy === 'chat' ? 'Starting…' : 'Start chat'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
