'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Church } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ChurchesPage() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [youthOnly, setYouthOnly] = useState(false);

  useEffect(() => {
    api.get('/churches').then(r => setChurches(r.data.data ?? [])).finally(() => setLoading(false));
  }, []);

  const filtered = churches.filter(c => {
    const matchSearch = !search || c.name.includes(search) || c.address.includes(search);
    const matchYouth = !youthOnly || c.hasYouthGroup;
    return matchSearch && matchYouth;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">함께하는 교회 ⛪</h1>
          <p className="text-muted-foreground text-sm mt-1">염리동 교동협의회 소속 교회들을 소개합니다.</p>
        </div>

        <div className="flex gap-2 mb-8">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="교회 이름, 주소 검색..."
            className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
          <button onClick={() => setYouthOnly(v => !v)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${youthOnly ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-white border border-border text-gray-600 hover:border-primary'}`}>
            청년부 있음
          </button>
        </div>

        {filtered.length === 0 ? (
          <Card className="py-20 text-center">
            <div className="text-4xl mb-2">⛪</div>
            <p className="text-muted-foreground">검색 결과가 없습니다.</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map(church => (
              <Link key={church.id} href={`/churches/${church.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer h-full">
                  {church.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={church.imageUrl} alt={church.name} className="w-full h-44 object-cover" />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-5xl">⛪</div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h2 className="text-base font-bold text-gray-900">{church.name}</h2>
                      {church.hasYouthGroup && (
                        <Badge className="bg-primary/10 text-primary border-0 text-xs shrink-0 ml-2">청년부</Badge>
                      )}
                    </div>
                    {church.introduction && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{church.introduction}</p>
                    )}
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div>📍 {church.address}</div>
                      {church.sundayServiceTime && <div>🕐 주일예배 {church.sundayServiceTime}</div>}
                      {church.contactInfo && <div>📞 {church.contactInfo}</div>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
