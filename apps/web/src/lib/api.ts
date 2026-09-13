const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type ApiError = {
  message: string;
  status: number;
};

async function parseError(res: Response): Promise<ApiError> {
  let message = res.statusText;
  try {
    const data = await res.json();
    message = data.message ?? data.error ?? JSON.stringify(data);
    if (Array.isArray(message)) message = message.join(', ');
  } catch {
    // ignore
  }
  return { message: String(message), status: res.status };
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export function authUrl(provider: 'google' | 'github') {
  return `${API_URL}/api/v1/auth/${provider}`;
}

export { API_URL };
