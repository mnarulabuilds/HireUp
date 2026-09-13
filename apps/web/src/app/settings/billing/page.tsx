'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PLANS } from '@hireup/shared';
import { api } from '@/lib/api';
import type { PublicUser } from '@/lib/types';

type BillingStatus = {
  available: boolean;
  donationLink: string | null;
  prices: { pro: string | null; coach: string | null };
};

export default function BillingPage() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<PublicUser>('/auth/me'),
      api<BillingStatus>('/billing/status'),
    ])
      .then(([me, status]) => {
        setUser(me);
        setBilling(status);
      })
      .catch((err) => {
        if (err?.status === 401) window.location.href = '/login';
        else setError(err?.message ?? 'Failed to load billing');
      });
  }, []);

  async function checkout(plan: 'PRO' | 'COACH') {
    setError(null);
    setMessage(null);
    try {
      const session = await api<{ url: string }>('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      });
      if (session.url) window.location.href = session.url;
    } catch (err) {
      setError(
        (err as { message?: string })?.message ??
          'Billing unavailable — configure Stripe keys',
      );
    }
  }

  async function openPortal() {
    try {
      const session = await api<{ url: string }>('/billing/portal', {
        method: 'POST',
      });
      if (session.url) window.location.href = session.url;
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Portal unavailable');
    }
  }

  return (
    <div className="app-shell">
      <div className="container stack">
        <Link href="/dashboard" className="muted">
          ← Dashboard
        </Link>
        <h1>Billing & support</h1>
        <p className="lead">
          Current plan: <strong>{user?.plan ?? '…'}</strong>
          {!billing?.available && ' · Stripe not configured in this environment'}
        </p>

        {error && <p style={{ color: '#9b1c1c' }}>{error}</p>}
        {message && <p className="muted">{message}</p>}

        <div className="grid-3">
          {PLANS.map((plan) => (
            <div key={plan.id} className="panel stack">
              <h2 style={{ margin: 0 }}>{plan.name}</h2>
              <p style={{ fontSize: '1.4rem', margin: 0 }}>{plan.priceLabel}</p>
              <p className="muted">{plan.description}</p>
              {plan.id === 'FREE' ? (
                <span className="muted">Default plan</span>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => checkout(plan.id as 'PRO' | 'COACH')}
                >
                  {plan.id === 'PRO' ? 'Upgrade to Pro' : 'Buy Coach'}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="panel stack">
          <h2 style={{ margin: 0 }}>Manage subscription</h2>
          <p className="muted">
            Open the Stripe customer portal to update payment methods or cancel.
          </p>
          <button type="button" className="btn btn-secondary" onClick={openPortal}>
            Open customer portal
          </button>
        </div>

        <div className="panel stack">
          <h2 style={{ margin: 0 }}>Donate</h2>
          <p className="muted">
            Optional donations help keep free matching available to job seekers.
          </p>
          {billing?.donationLink ? (
            <a className="btn btn-accent" href={billing.donationLink} target="_blank" rel="noreferrer">
              Donate via Stripe
            </a>
          ) : (
            <p className="muted">Donation link not configured (STRIPE_DONATION_PAYMENT_LINK).</p>
          )}
        </div>
      </div>
    </div>
  );
}
