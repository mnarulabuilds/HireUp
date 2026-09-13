'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type CoachingSession = {
  id: string;
  targetRole: string;
  focusAreas: string;
  paid: boolean;
  planJson: null | {
    agenda: string[];
    tips: string[];
    stages: { stage: string; likelihood: number; tip: string }[];
  };
};

export default function CoachingPage() {
  const [targetRole, setTargetRole] = useState('');
  const [focusAreas, setFocusAreas] = useState('');
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    api<CoachingSession[]>('/coaching')
      .then(setSessions)
      .catch((err) => {
        if (err?.status === 401) window.location.href = '/login';
      });
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const result = await api<{
        session: CoachingSession;
        requiresPayment: boolean;
        message?: string;
      }>('/coaching', {
        method: 'POST',
        body: JSON.stringify({ targetRole, focusAreas }),
      });
      if (result.requiresPayment) {
        setMessage(result.message ?? 'Payment required');
        try {
          const checkout = await api<{ url: string }>('/billing/checkout', {
            method: 'POST',
            body: JSON.stringify({ plan: 'COACH' }),
          });
          if (checkout.url) window.location.href = checkout.url;
        } catch {
          setMessage(
            'Coach checkout unavailable locally. Configure Stripe or upgrade plan.',
          );
        }
      } else {
        setMessage('Coaching plan unlocked.');
      }
      refresh();
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Failed');
    }
  }

  return (
    <div className="app-shell">
      <div className="container stack">
        <Link href="/dashboard" className="muted">
          ← Dashboard
        </Link>
        <h1>Interview coaching</h1>
        <p className="lead">
          Get a stage-by-stage prep plan for a nominal Coach fee — or included if
          you already have Coach access.
        </p>

        <form className="panel stack" onSubmit={createSession}>
          <div className="field">
            <label htmlFor="targetRole">Target role</label>
            <input
              id="targetRole"
              required
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="focusAreas">Focus areas</label>
            <textarea
              id="focusAreas"
              required
              rows={3}
              value={focusAreas}
              onChange={(e) => setFocusAreas(e.target.value)}
              placeholder="System design, behavioral stories, salary negotiation…"
            />
          </div>
          {error && <p style={{ color: '#9b1c1c' }}>{error}</p>}
          {message && <p className="muted">{message}</p>}
          <button type="submit" className="btn btn-primary">
            Create coaching session
          </button>
        </form>

        {sessions.map((s) => (
          <article key={s.id} className="panel stack">
            <h2 style={{ margin: 0 }}>{s.targetRole}</h2>
            <p className="muted">{s.focusAreas}</p>
            <p className="muted">{s.paid ? 'Unlocked' : 'Awaiting payment'}</p>
            {s.planJson && (
              <>
                <h3>Agenda</h3>
                <ul>
                  {s.planJson.agenda.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
                <h3>Tips</h3>
                <ul>
                  {s.planJson.tips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
