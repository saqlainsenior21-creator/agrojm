import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiFetch } from './api'

interface User { id: string; name: string; email: string; role: string; parish?: string; business_name?: string; buyer_type?: string }
interface AuthCtx { user: User | null; login: (email: string, password: string) => Promise<void>; logout: () => void; loading: boolean }

const Ctx = createContext<AuthCtx>({ user: null, login: async () => {}, logout: () => {}, loading: true });

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

  return <Ctx.Provider value={{ user, login, logout, loading }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
