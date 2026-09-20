'use client';

import { useEffect, useState } from 'react';
import { fetchCurrentUser, redirectToLogin } from '@/lib/auth';

type Props = {
  children: React.ReactNode;
};

export function RequireAuth({ children }: Props) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    fetchCurrentUser()
      .then((user) => {
        if (user) {
          setAllowed(true);
          return;
        }
        redirectToLogin();
      })
      .catch(() => redirectToLogin());
  }, []);

  if (!allowed) {
    return (
      <div className="container" style={{ padding: '2.5rem 0' }}>
        <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />
      </div>
    );
  }

  return children;
}
