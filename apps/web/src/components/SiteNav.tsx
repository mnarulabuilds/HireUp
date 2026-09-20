'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchCurrentUser } from '@/lib/auth';
import type { PublicUser } from '@/lib/types';

function UserAvatar({ user }: { user: PublicUser }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        className="user-avatar"
        width={36}
        height={36}
        referrerPolicy="no-referrer"
      />
    );
  }
  const initial = (user.name?.[0] ?? user.email[0] ?? '?').toUpperCase();
  return (
    <span className="user-avatar user-avatar-fallback" aria-hidden>
      {initial}
    </span>
  );
}

export function SiteNav() {
  const [user, setUser] = useState<PublicUser | null | undefined>(undefined);

  useEffect(() => {
    fetchCurrentUser()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  return (
    <nav className="nav-links" aria-label="Primary">
      <Link href="/pricing">Pricing</Link>
      <Link href="/tips">Tips</Link>
      {user === undefined && (
        <span className="user-avatar user-avatar-skeleton" aria-hidden />
      )}
      {user && (
        <Link
          href="/dashboard"
          className="user-avatar-link"
          title={user.name ?? user.email}
        >
          <UserAvatar user={user} />
          <span className="sr-only">Dashboard</span>
        </Link>
      )}
      {user === null && (
        <Link href="/login" className="btn btn-primary">
          Sign in
        </Link>
      )}
    </nav>
  );
}
