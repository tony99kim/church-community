import { create } from 'zustand';
import api from '@/lib/api';

interface User {
  id: number;
  email: string;
  nickname: string;
  role: string;
  profileImageUrl?: string;
  provider?: string;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  hydrated: boolean;
  setUser: (user: User) => void;
  setHydrated: () => void;
  logout: () => void;
}

const SESSION_KEY = 'ch_user';

export function loadSessionUser(): User | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSessionUser(user: User) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch {}
}

function clearSessionUser() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  hydrated: false,
  setUser: (user) => { saveSessionUser(user); set({ user, isLoggedIn: true }); },
  setHydrated: () => set({ hydrated: true }),
  logout: () => {
    api.post('/auth/logout').catch(() => {});
    clearSessionUser();
    set({ user: null, isLoggedIn: false });
  },
}));
