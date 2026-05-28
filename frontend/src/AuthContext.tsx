import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiFetch } from './api'

interface User { id: string; name: string; email: string; role: string; parish?: string; business_name?: string; buyer_type?: string; rada_id?: string; verification_status?: string }
interface AuthCtx { user: User | null; login: (email: string, password: string) => Promise<void>; logout: () => void; loading: boolean; refreshUser: () => Promise<void> }

const Ctx = createContext<AuthCtx>({ user: null, login: async () => {}, logout: () => {}, loading: true, refreshUser: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('agrojm_token');
    if (token) {
      apiFetch('/auth/me').then(u => setUser(u)).catch(() => localStorage.removeItem('agrojm_token')).finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('agrojm_token', data.token);
    setUser(data.user);
  };

  const logout = () => { localStorage.removeItem('agrojm_token'); setUser(null); };

  const refreshUser = async () => {
    const u = await apiFetch('/auth/me');
    setUser(u);
  };

  return <Ctx.Provider value={{ user, login, logout, loading, refreshUser }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
