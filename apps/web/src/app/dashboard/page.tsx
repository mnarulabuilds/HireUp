'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { PublicUser } from '@/lib/types';
import { SponsoredTip } from '@/components/SponsoredTip';
import { ScoreBars } from '@/components/ScoreBars';

type ResumeListItem = {
  id: string;
  title: string;
  source: string;
  status: string;
  updatedAt: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [resumes, setResumes] = useState<ResumeListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<PublicUser>('/auth/me'),
      api<ResumeListItem[]>('/resumes'),
    ])
      .then(([me, list]) => {
        setUser(me);
        setResumes(list);
      })
      .catch((err) => {
        if (err?.status === 401) {
          window.location.href = '/login';
          return;
        }
        setError(err?.message ?? 'Failed to load dashboard');
      });
  }, []);

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }

  return (
    <div className="app-shell">
      <div className="container stack">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '0 0 0.3rem' }}>
              Welcome{user?.name ? `, ${user.name}` : ''}
            </h1>
            <p className="muted" style={{ margin: 0 }}>
              Plan: {user?.plan ?? '…'} · Matches used this month:{' '}
              {user?.usage.matchesUsedMonth ?? '—'} /{' '}
              {user?.limits.maxMatchesPerMonth ?? '—'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link href="/resumes/new" className="btn btn-primary">
              New resume
            </Link>
            <Link href="/coaching" className="btn btn-secondary">
              Coaching
            </Link>
            <Link href="/settings/billing" className="btn btn-secondary">
              Billing
            </Link>
            <button type="button" className="btn btn-secondary" onClick={logout}>
              Log out
            </button>
          </div>
        </div>

        <SponsoredTip />

        {error && <p style={{ color: '#9b1c1c' }}>{error}</p>}

        <section className="panel stack">
          <h2 style={{ margin: 0 }}>Your resumes</h2>
          {!resumes && (
            <div className="stack">
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          )}
          {resumes?.length === 0 && (
            <p className="muted">
              No resumes yet.{' '}
              <Link href="/resumes/new">Create your first one</Link>.
            </p>
          )}
          {resumes?.map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem',
                alignItems: 'center',
                borderTop: '1px solid var(--line)',
                paddingTop: '0.85rem',
              }}
            >
              <div>
                <strong>{r.title}</strong>
                <div className="muted" style={{ fontSize: '0.85rem' }}>
                  {r.source} · {r.status} · updated{' '}
                  {new Date(r.updatedAt).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link href={`/resumes/${r.id}/edit`} className="btn btn-secondary">
                  Edit
                </Link>
                <Link href={`/resumes/${r.id}/match`} className="btn btn-primary">
                  Match
                </Link>
              </div>
            </div>
          ))}
        </section>

        <section className="panel">
          <h2 style={{ marginTop: 0 }}>What a strong score looks like</h2>
          <ScoreBars
            scores={{
              overall: 82,
              ats: 88,
              skills: 79,
              experience: 84,
              interviewClearance: 76,
            }}
          />
        </section>
      </div>
    </div>
  );
}
