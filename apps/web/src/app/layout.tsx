import type { Metadata } from 'next';
import { Fraunces, Sora } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display-loaded',
  display: 'swap',
});

const body = Sora({
  subsets: ['latin'],
  variable: '--font-body-loaded',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'HireUp — Resume scoring that gets you hired',
    template: '%s · HireUp',
  },
  description:
    'Build an impressive resume, match it to job descriptions, and get actionable scores and interview coaching with HireUp.',
  openGraph: {
    title: 'HireUp',
    description:
      'Create resumes, score them against real jobs, and prepare for interviews.',
    type: 'website',
    siteName: 'HireUp',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HireUp',
    description: 'Resume building, job-match scoring, and interview coaching.',
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/',
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body
        style={
          {
            ['--font-display' as string]: 'var(--font-display-loaded), Georgia, serif',
            ['--font-body' as string]: 'var(--font-body-loaded), system-ui, sans-serif',
          } as React.CSSProperties
        }
      >
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <header className="site-header">
          <div className="container site-header-inner">
            <Link href="/" className="brand">
              HireUp
            </Link>
            <nav className="nav-links" aria-label="Primary">
              <Link href="/pricing">Pricing</Link>
              <Link href="/tips">Tips</Link>
              <Link href="/login" className="btn btn-primary">
                Sign in
              </Link>
            </nav>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="footer">
          <div className="container footer-inner">
            <span>© {new Date().getFullYear()} HireUp</span>
            <span>
              Support the mission ·{' '}
              <Link href="/settings/billing">Donate</Link>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
