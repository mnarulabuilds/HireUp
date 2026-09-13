'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { MatchFeedback, MatchScores } from '@hireup/shared';
import { api } from '@/lib/api';
import { ScoreBars } from '@/components/ScoreBars';

type MatchResult = {
  id: string;
  scores: MatchScores;
  feedback: MatchFeedback;
  provider?: string;
  jobTitle?: string | null;
};

export default function MatchPage() {
  const params = useParams<{ id: string }>();
  const resumeId = params.id;
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [result, setResult] = useState<MatchResult | null>(null);
  const [history, setHistory] = useState<MatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<MatchResult[]>(`/matches/resumes/${resumeId}`)
      .then(setHistory)
      .catch(() => undefined);
  }, [resumeId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const match = await api<MatchResult>(`/matches/resumes/${resumeId}`, {
        method: 'POST',
        body: JSON.stringify({ jobTitle, jobDescription, jobUrl }),
      });
      setResult(match);
      setHistory((prev) => [match, ...prev]);
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Match failed');
    } finally {
      setLoading(false);
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
          interview-stage clearance estimates.
        </p>

        <form className="panel stack" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="jobTitle">Job title (optional)</label>
            <input
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="jobUrl">Job URL (optional)</label>
            <input
              id="jobUrl"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="jobDescription">Job description</label>
            <textarea
              id="jobDescription"
              rows={10}
              required
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full posting here…"
            />
          </div>
          {error && <p style={{ color: '#9b1c1c' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Scoring…' : 'Score my chances'}
          </button>
        </form>

        {result && (
          <section className="panel stack fade-up">
            <h2 style={{ margin: 0 }}>
              Results {result.provider ? `(${result.provider})` : ''}
            </h2>
            <ScoreBars scores={result.scores} />
            <div>
              <h3>Strengths</h3>
              <ul>
                {result.feedback.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <h3>Gaps</h3>
              <ul>
                {result.feedback.gaps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <h3>Actions</h3>
              <ul>
                {result.feedback.actions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <h3>Interview clearance path</h3>
              <ul>
                {result.feedback.interviewStages.map((stage) => (
                  <li key={stage.stage}>
                    <strong>
                      {stage.stage}: {stage.likelihood}%
                    </strong>{' '}
                    — {stage.tip}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {history.length > 0 && (
          <section className="panel stack">
            <h2 style={{ margin: 0 }}>Recent matches</h2>
            {history.map((m) => (
              <div key={m.id} className="muted">
                Overall {m.scores.overall} · Interview {m.scores.interviewClearance}
                {m.jobTitle ? ` · ${m.jobTitle}` : ''}
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
