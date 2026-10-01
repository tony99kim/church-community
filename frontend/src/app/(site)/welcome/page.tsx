'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/Toast';
import { Card, CardContent } from '@/components/ui/card';

export default function WelcomePage() {
  const { isLoggedIn, hydrated } = useAuthStore();
  const [form, setForm] = useState({ name: '', phone: '', address: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingKit, setExistingKit] = useState<{ processed: boolean } | null>(null);
  const [kitLoading, setKitLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn) { setKitLoading(false); return; }
    api.get('/welcome/kits/my').then(r => {
      const kits = r.data.data;
      if (kits?.length > 0) setExistingKit(kits[0]);
    }).catch(() => {}).finally(() => setKitLoading(false));
  }, [hydrated, isLoggedIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/welcome/kit', form);
      setSubmitted(true);
    } catch {
      toast('신청 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">👋</div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">처음 오셨나요?</h1>
          <p className="text-muted-foreground">염리동에 새로 오신 청년을 환영해요. 필요한 것들을 모아뒀어요.</p>
        </div>

        <div className="space-y-6">
          {/* 웰컴 키트 */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">🎁 웰컴 키트 신청</h2>
              <p className="text-blue-100 text-sm mt-0.5">새로 이사 온 청년, 1인 가구 청년에게 환영 키트를 드립니다.</p>
            </div>
            <CardContent className="p-6">
              {!hydrated || kitLoading ? (
                <div className="py-8 text-center text-muted-foreground text-sm">불러오는 중...</div>
              ) : !isLoggedIn ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-4">웰컴 키트 신청은 로그인 후 이용할 수 있습니다.</p>
                  <Link href="/login" className="inline-block px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition shadow-md shadow-primary/20">
                    로그인하기
                  </Link>
                </div>
              ) : existingKit || submitted ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-green-700 font-bold mb-1">신청이 완료되었습니다!</p>
                  <p className="text-sm text-muted-foreground mb-4">처리 상태: {existingKit?.processed ? '처리 완료' : '처리 중'}</p>
                  <Link href="/my" className="inline-block px-5 py-2 border-2 border-primary text-primary rounded-xl text-sm font-bold hover:bg-primary/5 transition">
                    마이페이지에서 확인하기 →
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input required placeholder="이름" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
                  <input required placeholder="연락처" value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
                  <input placeholder="주소 (선택)" value={form.address}
                    onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
                  <textarea placeholder="하고 싶은 말 (선택)" value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition" />
                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition shadow-md shadow-primary/20 hover:-translate-y-0.5 disabled:opacity-50">
                    {loading ? '신청 중...' : '웰컴 키트 신청하기'}
                  </button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* 동네 생활 가이드 */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">🗺 동네 생활 가이드</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: '마트', icon: '🛒', items: ['이마트 공덕점', 'GS25 염리점'] },
                  { label: '병원', icon: '🏥', items: ['마포구 보건소', '연세365의원'] },
                  { label: '카페', icon: '☕', items: ['스타벅스 공덕역점', '동네 카페들'] },
                  { label: '도서관', icon: '📚', items: ['마포구립서강도서관', '공덕아리수도서관'] },
                  { label: '운동', icon: '🏃', items: ['마포한강공원', '염리어린이공원'] },
                  { label: '산책', icon: '🌿', items: ['와우산 둘레길', '한강 보행로'] },
                ].map(cat => (
                  <div key={cat.label} className="p-3 bg-accent rounded-xl">
                    <div className="font-bold text-sm text-primary mb-1">{cat.icon} {cat.label}</div>
                    {cat.items.map(i => <div key={i} className="text-xs text-muted-foreground mt-0.5">{i}</div>)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 청년 도움 링크 */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">🔗 청년 도움 링크</h2>
              <div className="space-y-2">
                {[
                  { label: '청년 월세 지원 (서울시)', href: 'https://youth.seoul.go.kr' },
                  { label: '마포구 청년 정책', href: 'https://www.mapo.go.kr' },
                  { label: '마포구 복지관', href: 'https://www.mapo.go.kr' },
                  { label: '마음건강 위기상담 (1577-0199)', href: 'tel:15770199' },
                ].map(link => (
                  <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 border border-border rounded-xl hover:border-primary hover:bg-accent transition-all group">
                    <span className="text-sm text-gray-700 group-hover:text-primary transition">{link.label}</span>
                    <span className="text-xs text-primary font-bold">→</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 교회 연결 문의 */}
          <Card className="bg-gradient-to-br from-primary/5 to-accent border-primary/20">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">⛪ 교회를 찾고 계신가요?</h2>
              <p className="text-sm text-muted-foreground mb-4">부담 없이 문의해 주세요. 가까운 교회와 청년 모임을 안내해 드릴게요.</p>
              <Link href="/churches"
                className="inline-block px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition shadow-md shadow-primary/20">
                교회 목록 보기 →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
