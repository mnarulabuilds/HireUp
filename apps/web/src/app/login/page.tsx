'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, authUrl } from '@/lib/api';
import { fetchCurrentUser } from '@/lib/auth';

type Providers = { google: boolean; github: boolean; dev: boolean };

function safeReturnPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/dashboard';
  }
  return next;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [providers, setProviders] = useState<Providers | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const returnTo = safeReturnPath(searchParams.get('next'));

  useEffect(() => {
    fetchCurrentUser().then((user) => {
      if (user) window.location.href = returnTo;
    });
  }, [returnTo]);

  useEffect(() => {
    api<Providers>('/auth/providers')
      .then(setProviders)
      .catch(() =>
        setProviders({ google: false, github: false, dev: true }),
      );
  }, []);

  async function devLogin() {
    setLoading(true);
    setError(null);
    try {
      await api('/auth/dev-login', {
        method: 'POST',
        body: JSON.stringify({ email: 'dev@hireup.local', name: 'HireUp Dev' }),
      });
      window.location.href = returnTo;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 480 }}>
        <div className="panel stack">
          <h1 style={{ margin: 0 }}>Sign in to HireUp</h1>
          <p className="muted">
            Use SSO to keep your resumes and match history synced securely.
          </p>
          {!providers && <div className="skeleton" style={{ height: 44 }} />}
          {providers?.google && (
            <a className="btn btn-primary" href={authUrl('google')}>
              Continue with Google
            </a>
          )}
          {providers?.github && (
            <a className="btn btn-secondary" href={authUrl('github')}>
              Continue with GitHub
            </a>
          )}
          {providers?.dev && (
            <button
              type="button"
              className="btn btn-accent"
              onClick={devLogin}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Dev login (local)'}
            </button>
          )}
          {error && <p style={{ color: '#9b1c1c' }}>{error}</p>}
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <section className="section">
          <div className="container" style={{ maxWidth: 480 }}>
            <div className="skeleton" style={{ height: 220, borderRadius: 12 }} />
          </div>
        </section>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
