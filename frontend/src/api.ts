const BASE = import.meta.env.VITE_API_URL || '/api';

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem('agrojm_token');
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
