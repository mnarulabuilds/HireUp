import { PLANS } from '@hireup/shared';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'HireUp plans: Free, Pro at $11/mo, and Coach interview prep for $19.',
};

export default function PricingPage() {
  return (
    <section className="section">
      <div className="container">
        <h1>Pricing that stays out of your way</h1>
        <p className="lead">
          Start free. Upgrade when matching and richer feedback become part of
          your weekly job search rhythm.
        </p>
        <div className="grid-3">
          {PLANS.map((plan) => (
            <div key={plan.id} className="panel stack">
              <div>
                <h2 style={{ margin: 0 }}>{plan.name}</h2>
                <p style={{ fontSize: '1.6rem', margin: '0.4rem 0' }}>
                  {plan.priceLabel}
                </p>
                <p className="muted">{plan.description}</p>
              </div>
              <ul className="muted">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Link
                href="/login"
                className={`btn ${plan.id === 'PRO' ? 'btn-primary' : 'btn-secondary'}`}
              >
                {plan.id === 'FREE' ? 'Get started' : 'Choose plan'}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
