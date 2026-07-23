'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Item, ItemCategory } from '@/types';
import { useAuthStore } from '@/store/authStore';

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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">불러오는 중...</div>;

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-2">물품 대여 📦</h1>
        <p className="text-gray-600 mb-6">이사, 청소, 생활, 행사에 필요한 물품을 빌려드립니다.</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {(['ALL', 'MOVING', 'CLEANING', 'LIVING', 'EVENT'] as const).map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === cat ? 'bg-[#003478] text-white' : 'bg-white border border-[#EDEFF1] text-gray-600 hover:border-[#003478]'}`}>
              {cat === 'ALL' ? '전체' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">등록된 물품이 없습니다.</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {filtered.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-[#EDEFF1] p-5">
                <div className="text-xs text-gray-400 mb-1">{CATEGORY_LABELS[item.category]}</div>
                <h2 className="text-base font-bold text-gray-800 mb-2">{item.name}</h2>
                {item.description && <p className="text-xs text-gray-500 mb-3">{item.description}</p>}
                <div className="text-xs text-gray-500 mb-4">
                  재고: {item.availableQuantity} / {item.totalQuantity}개
                </div>
                {isLoggedIn && item.availableQuantity > 0 ? (
                  <Link href={`/items/${item.id}`}
                    className="block text-center py-2 bg-[#003478] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors">
                    대여 신청
                  </Link>
                ) : item.availableQuantity === 0 ? (
                  <div className="text-center py-2 bg-gray-100 text-gray-400 rounded-lg text-sm">재고 없음</div>
                ) : (
                  <Link href="/login" className="block text-center py-2 border border-[#003478] text-[#003478] rounded-lg text-sm hover:bg-blue-50 transition-colors">
                    로그인 후 신청
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
