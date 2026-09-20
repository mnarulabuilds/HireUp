import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Resume scoring that gets you hired',
  description:
    'Build ATS-friendly resumes with section-level control, job-match scoring, PDF export, and interview coaching.',
  openGraph: {
    title: 'HireUp — Resume scoring that gets you hired',
    description:
      'Structured resume building, ATS readiness suggestions, and job-match scores.',
  },
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'HireUp',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          url: siteUrl,
          description:
            'Build ATS-friendly resumes, score job fit, and prepare for interviews.',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        }}
      />
      <section className="hero">
        <div className="container hero-content">
          <h1 className="hero-brand">HireUp</h1>
          <p className="hero-copy">
            Build a resume that clears ATS screens, match it to real job
            descriptions, and walk into interviews with a clear score and a plan.
          </p>
          <div className="hero-actions">
            <Link href="/login" className="btn btn-primary">
              Start building
            </Link>
            <Link href="/pricing" className="btn btn-secondary" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.35)' }}>
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>One workflow from blank page to interview-ready</h2>
          <p className="lead">
            Upload an existing resume, fill structured forms, or answer a short
            chat questionnaire — then score yourself against any job posting.
          </p>
          <div className="grid-3">
            <div className="panel fade-up">
              <h3>Build your way</h3>
              <p className="muted">
                Upload, forms, or guided chat — all produce the same structured resume.
              </p>
            </div>
            <div className="panel fade-up" style={{ animationDelay: '80ms' }}>
              <h3>Score the fit</h3>
              <p className="muted">
                See ATS, skills, experience, and interview-clearance likelihood.
              </p>
            </div>
            <div className="panel fade-up" style={{ animationDelay: '160ms' }}>
              <h3>Coach the close</h3>
              <p className="muted">
                Optional interview prep with stage-by-stage tips for a nominal fee.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
