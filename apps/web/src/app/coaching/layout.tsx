import type { Metadata } from 'next';
import { RequireAuth } from '@/components/RequireAuth';

export const metadata: Metadata = {
  title: 'Coaching',
  robots: { index: false, follow: false },
};

export default function CoachingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
