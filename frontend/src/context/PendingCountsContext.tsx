'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

interface PendingCounts {
  spaceRentals: number;
  itemRentals: number;
  welcomeKits: number;
  faithQuestions: number;
}

const ZERO: PendingCounts = { spaceRentals: 0, itemRentals: 0, welcomeKits: 0, faithQuestions: 0 };

const Ctx = createContext<{ counts: PendingCounts; refresh: () => void }>({ counts: ZERO, refresh: () => {} });

export function PendingCountsProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<PendingCounts>(ZERO);

  const refresh = useCallback(() => {
    Promise.all([
      api.get('/admin/spaces/rentals').then(r => (r.data.data ?? []).filter((x: { status: string }) => x.status === 'PENDING').length).catch(() => 0),
      api.get('/admin/items/rentals').then(r => (r.data.data ?? []).filter((x: { status: string }) => x.status === 'PENDING').length).catch(() => 0),
      api.get('/admin/welcome/kits').then(r => (r.data.data ?? []).filter((x: { processed: boolean }) => !x.processed).length).catch(() => 0),
      api.get('/faith/admin/questions').then(r => (r.data.data ?? []).filter((x: { answers: unknown[] }) => x.answers.length === 0).length).catch(() => 0),
    ]).then(([spaceRentals, itemRentals, welcomeKits, faithQuestions]) => {
      setCounts({ spaceRentals, itemRentals, welcomeKits, faithQuestions });
    });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return <Ctx.Provider value={{ counts, refresh }}>{children}</Ctx.Provider>;
}

export const usePendingCounts = () => useContext(Ctx);
