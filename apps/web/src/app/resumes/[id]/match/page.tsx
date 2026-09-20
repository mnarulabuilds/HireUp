'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { MatchFeedback, MatchScores } from '@hireup/shared';
import { api } from '@/lib/api';
import { MatchFeedbackPanel } from '@/components/MatchFeedbackPanel';

type MatchResult = {
  id: string;
  scores: MatchScores;
  feedback: MatchFeedback;
  provider?: string;
  jobTitle?: string | null;
  cached?: boolean;
  createdAt?: string;
};

const MIN_JD_LENGTH = 40;

export default function MatchPage() {
  const params = useParams<{ id: string }>();
  const resumeId = params.id;
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [result, setResult] = useState<MatchResult | null>(null);
  const [history, setHistory] = useState<MatchResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const jdLength = jobDescription.trim().length;
  const jdReady = jdLength >= MIN_JD_LENGTH;

  const activeResult = useMemo(() => {
    if (selectedId) {
      return history.find((m) => m.id === selectedId) ?? result;
    }
    return result;
  }, [history, result, selectedId]);

  useEffect(() => {
    api<MatchResult[]>(`/matches/resumes/${resumeId}`)
      .then((rows) => {
        setHistory(rows);
        if (rows[0]) {
          setResult(rows[0]);
          setSelectedId(rows[0].id);
        }
      })
      .catch(() => undefined);
  }, [resumeId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jdReady) return;
    setLoading(true);
    setError(null);
    setSelectedId(null);
    try {
      const match = await api<MatchResult>(`/matches/resumes/${resumeId}`, {
        method: 'POST',
        body: JSON.stringify({ jobTitle, jobDescription, jobUrl }),
      });
      setResult(match);
      setSelectedId(match.id);
      setHistory((prev) => {
        const withoutDup = prev.filter((m) => m.id !== match.id);
        return [match, ...withoutDup];
      });
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Match failed');
    } finally {
      setLoading(false);
    }
  }

  async function openHistoryItem(id: string) {
    setSelectedId(id);
    const cached = history.find((m) => m.id === id);
    if (cached) {
      setResult(cached);
      return;
    }
    try {
      const row = await api<MatchResult>(`/matches/${id}`);
      setResult(row);
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Could not load match');
    }
  }

  return (
    <div className="app-shell">
      <div className="container stack">
        <Link href={`/resumes/${resumeId}/edit`} className="muted">
          ← Back to editor
        </Link>
        <h1>Match against a job</h1>
        <p className="lead">
          Paste a job description to see hire likelihood, ATS readiness, and
          interview-stage clearance estimates. Re-running the same resume + posting returns a
          cached score without using an extra match credit.
        </p>

        <form className="panel stack" onSubmit={onSubmit} aria-labelledby="match-form-heading">
          <h2 id="match-form-heading" style={{ margin: 0 }}>
            Job posting
          </h2>
          <div className="field">
            <label htmlFor="jobTitle">Job title (optional)</label>
            <input
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
            />
          </div>
          <div className="field">
            <label htmlFor="jobUrl">Job URL (optional)</label>
            <input
              id="jobUrl"
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="field">
            <label htmlFor="jobDescription">Job description</label>
            <textarea
              id="jobDescription"
              rows={10}
              required
              minLength={MIN_JD_LENGTH}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full posting here…"
              aria-describedby="jd-hint"
            />
            <p id="jd-hint" className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
              {jdLength} characters · minimum {MIN_JD_LENGTH} required
              {!jdReady ? ' · add more detail for accurate scoring' : ' · ready to score'}
            </p>
          </div>
          {error && (
            <p role="alert" aria-live="assertive" className="form-error">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !jdReady}
            aria-busy={loading}
          >
            {loading ? 'Scoring…' : 'Score my chances'}
          </button>
        </form>

        {activeResult && (
          <MatchFeedbackPanel
            scores={activeResult.scores}
            feedback={activeResult.feedback}
            provider={activeResult.provider}
            cached={activeResult.cached}
            jobTitle={activeResult.jobTitle}
          />
        )}

        {history.length > 0 && (
          <section className="panel stack" aria-labelledby="match-history-heading">
            <h2 id="match-history-heading" style={{ margin: 0 }}>
              Recent matches
            </h2>
            <ul className="match-history-list" role="list">
              {history.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className={`match-history-item${selectedId === m.id ? ' is-active' : ''}`}
                    onClick={() => void openHistoryItem(m.id)}
                  >
                    <span>
                      Overall {m.scores.overall} · Interview {m.scores.interviewClearance}
                      {m.jobTitle ? ` · ${m.jobTitle}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
