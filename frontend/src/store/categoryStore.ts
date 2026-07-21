import { create } from 'zustand';
import api from '@/lib/api';
import type { Category } from '@/types';

interface CategoryState {
  categories: Category[];
  loaded: boolean;
  load: () => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loaded: false,
  load: async () => {
    if (get().loaded) return;
    try {
      const res = await api.get('/categories');
      set({ categories: res.data.data, loaded: true });
    } catch {}
  },
}));
