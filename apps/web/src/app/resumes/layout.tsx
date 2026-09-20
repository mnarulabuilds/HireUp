import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resumes',
  robots: { index: false, follow: false },
};

export default function ResumesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
