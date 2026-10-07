'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

interface PendingCounts {
  spaceRentals: number;
  itemRentals: number;
  welcomeKits: number;
  faithQuestions: number;
  reports: number;
}

const ZERO: PendingCounts = { spaceRentals: 0, itemRentals: 0, welcomeKits: 0, faithQuestions: 0, reports: 0 };

const Ctx = createContext<{ counts: PendingCounts; refresh: () => void }>({ counts: ZERO, refresh: () => {} });

export function PendingCountsProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<PendingCounts>(ZERO);

  const refresh = useCallback(() => {
    api.get('/admin/pending-counts')
      .then((r) => setCounts({ ...ZERO, ...r.data.data }))
      .catch(() => {});
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return <Ctx.Provider value={{ counts, refresh }}>{children}</Ctx.Provider>;
}

export const usePendingCounts = () => useContext(Ctx);
