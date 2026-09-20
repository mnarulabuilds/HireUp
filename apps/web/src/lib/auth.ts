import { api, type ApiError } from '@/lib/api';
import type { PublicUser } from '@/lib/types';

export async function fetchCurrentUser(): Promise<PublicUser | null> {
  try {
    return await api<PublicUser>('/auth/me');
  } catch (err) {
    if ((err as ApiError)?.status === 401) return null;
    throw err;
  }
}

export function loginPath(returnTo?: string): string {
  if (!returnTo || returnTo === '/' || returnTo.startsWith('/login')) {
    return '/login';
  }
  return `/login?next=${encodeURIComponent(returnTo)}`;
}

export function redirectToLogin(returnTo?: string) {
  window.location.href = loginPath(returnTo ?? window.location.pathname + window.location.search);
}
