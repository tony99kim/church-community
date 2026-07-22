import { create } from 'zustand';
import api, { clearTokens } from '@/lib/api';

interface User {
  id: number;
  email: string;
  nickname: string;
  role: string;
  profileImageUrl?: string;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  hydrated: boolean;
  setUser: (user: User) => void;
  setHydrated: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  hydrated: false,
  setUser: (user) => set({ user, isLoggedIn: true }),
  setHydrated: () => set({ hydrated: true }),
  logout: () => {
    api.post('/auth/logout').catch(() => {});
    clearTokens();
    set({ user: null, isLoggedIn: false });
  },
}));
