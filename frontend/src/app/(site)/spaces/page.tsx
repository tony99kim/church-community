'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Space } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    api.get('/spaces').then(r => setSpaces(r.data.data ?? [])).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const filtered = search.trim()
    ? spaces.filter(s => s.name.includes(search) || (s.churchName ?? '').includes(search))
    : spaces;

  const grouped = filtered.reduce<Record<string, Space[]>>((acc, s) => {
    const key = s.churchName ?? '기타';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">공간 대여 🏠</h1>
          <p className="text-muted-foreground text-sm mt-1">날짜와 시간대를 선택해 바로 예약하세요. 담당자 확인 후 최종 승인됩니다.</p>
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="공간명 또는 교회명으로 검색..."
          className="w-full mb-4 px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />

        {!isLoggedIn && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-6">
            ※ 예약하려면 <Link href="/login" className="font-bold underline">로그인</Link>이 필요합니다.
          </div>
        )}

        {Object.keys(grouped).length === 0 ? (
          <Card className="py-20 text-center">
            <div className="text-4xl mb-2">🏠</div>
            <p className="text-muted-foreground">등록된 공간이 없습니다.</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([churchName, churchSpaces]) => (
              <section key={churchName}>
                <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-primary">⛪</span> {churchName}
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {churchSpaces.map(space => (
                    <Card key={space.id} className={`overflow-hidden flex flex-col ${space.available ? 'hover:shadow-md hover:-translate-y-0.5 transition-all' : 'opacity-70'}`}>
                      {space.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={space.imageUrl} alt={space.name} className="w-full h-44 object-cover shrink-0" />
                      ) : (
                        <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-4xl shrink-0">🏠</div>
                      )}
                      <CardContent className="p-5 flex flex-col flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-base font-bold text-gray-800">{space.name}</h3>
                          <Badge className={`shrink-0 ml-2 text-xs ${space.available ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-500 border-red-200'} border`}>
                            {space.available ? '예약 가능' : '예약 불가'}
                          </Badge>
                        </div>
                        {space.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{space.description}</p>}
                        <div className="text-xs text-muted-foreground space-y-1 flex-1">
                          {space.usageTypes && <div>✅ {space.usageTypes}</div>}
                          {space.capacity && <div>👥 최대 {space.capacity}명</div>}
                          {space.openTime && (
                            <div>🕐 {space.openTime.slice(0, 5)} ~ {space.closeTime?.slice(0, 5)} ({space.slotMinutes}분 단위)</div>
                          )}
                        </div>
                        <div className="mt-4">
                          {space.available ? (
                            <Link href={`/spaces/${space.id}`}
                              className="block text-center py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition">
                              {isLoggedIn ? '날짜 선택하기' : '로그인 후 예약'}
                            </Link>
                          ) : (
                            <div className="block text-center py-2.5 bg-accent text-muted-foreground rounded-xl text-sm font-medium cursor-not-allowed">
                              예약 불가
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
