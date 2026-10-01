'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Item, ItemCategory } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  MOVING: '🚛 이사/정리',
  CLEANING: '🧹 청소',
  LIVING: '🛋 생활',
  EVENT: '🎪 행사',
};

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<ItemCategory | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    api.get('/items').then(r => setItems(r.data.data ?? [])).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? items : items.filter(i => i.category === filter);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">물품 대여 📦</h1>
          <p className="text-muted-foreground text-sm mt-1">이사, 청소, 생활, 행사에 필요한 물품을 빌려드립니다.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(['ALL', 'MOVING', 'CLEANING', 'LIVING', 'EVENT'] as const).map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                filter === cat
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-white border border-border text-gray-600 hover:border-primary'
              }`}>
              {cat === 'ALL' ? '전체' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <Card className="py-20 text-center">
            <div className="text-4xl mb-2">📦</div>
            <p className="text-muted-foreground">등록된 물품이 없습니다.</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {filtered.map(item => (
              <Card key={item.id} className={`overflow-hidden hover:shadow-md transition-all ${item.availableQuantity === 0 ? 'opacity-60' : 'hover:-translate-y-0.5'}`}>
                <CardContent className="p-5">
                  <Badge className="bg-accent text-muted-foreground border-0 text-xs mb-2">{CATEGORY_LABELS[item.category]}</Badge>
                  <h2 className="text-base font-bold text-gray-800 mb-1">{item.name}</h2>
                  {item.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.description}</p>}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>재고</span>
                    <span className={item.availableQuantity === 0 ? 'text-red-400 font-semibold' : 'text-green-600 font-semibold'}>
                      {item.availableQuantity} / {item.totalQuantity}개
                    </span>
                  </div>
                  <div className="w-full bg-accent rounded-full h-1.5 mb-4">
                    <div className="bg-primary h-1.5 rounded-full transition-all"
                      style={{ width: `${item.totalQuantity > 0 ? Math.round(item.availableQuantity / item.totalQuantity * 100) : 0}%` }} />
                  </div>
                  {isLoggedIn && item.availableQuantity > 0 ? (
                    <Link href={`/items/${item.id}`}
                      className="block text-center py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition">
                      대여 신청
                    </Link>
                  ) : item.availableQuantity === 0 ? (
                    <div className="text-center py-2.5 bg-accent text-muted-foreground rounded-xl text-sm font-medium">재고 없음</div>
                  ) : (
                    <Link href="/login"
                      className="block text-center py-2.5 border-2 border-primary text-primary rounded-xl text-sm font-bold hover:bg-primary/5 transition">
                      로그인 후 신청
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
