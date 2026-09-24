const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export type User = { id: string; email: string; name: string };

function token() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tf_token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };
  const t = token();
  if (t) (headers as Record<string, string>)['Authorization'] = `Bearer ${t}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function setAuth(accessToken: string, user: User) {
  localStorage.setItem('tf_token', accessToken);
  localStorage.setItem('tf_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('tf_token');
  localStorage.removeItem('tf_user');
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('tf_user');
  return raw ? (JSON.parse(raw) as User) : null;
}

export { API_URL };
