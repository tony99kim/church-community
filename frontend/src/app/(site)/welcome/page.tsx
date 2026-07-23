'use client';

import { useState } from 'react';
import api from '@/lib/api';

export default function WelcomePage() {
  const [form, setForm] = useState({ name: '', phone: '', address: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/welcome/kit', form);
      setSubmitted(true);
    } catch {
      alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-2">처음 오셨나요? 👋</h1>
        <p className="text-gray-600 mb-8">염리동에 새로 오신 청년을 환영해요. 필요한 것들을 모아뒀어요.</p>

        <div className="space-y-8">
          {/* 웰컴 키트 신청 */}
          <section className="bg-white rounded-2xl border border-[#EDEFF1] p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">🎁 웰컴 키트 신청</h2>
            <p className="text-sm text-gray-500 mb-4">새로 이사 온 청년, 1인 가구 청년에게 환영 키트를 드립니다.</p>
            {submitted ? (
              <div className="text-center py-6 text-green-600 font-medium">
                신청이 완료되었습니다! 담당자가 연락드릴게요 😊
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input required placeholder="이름" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
                <input required placeholder="연락처" value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
                <input placeholder="주소 (선택)" value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
                <textarea placeholder="하고 싶은 말 (선택)" value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478] resize-none" />
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-[#003478] text-white rounded-lg font-medium hover:bg-blue-900 transition-colors disabled:opacity-50">
                  {loading ? '신청 중...' : '웰컴 키트 신청하기'}
                </button>
              </form>
            )}
          </section>

          {/* 동네 생활 가이드 */}
          <section className="bg-white rounded-2xl border border-[#EDEFF1] p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">🗺 동네 생활 가이드</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: '마트', items: ['이마트 공덕점', 'GS25 염리점'] },
                { label: '병원', items: ['마포구 보건소', '연세365의원'] },
                { label: '카페', items: ['스타벅스 공덕역점', '동네 카페들'] },
                { label: '도서관', items: ['마포구립서강도서관', '공덕아리수도서관'] },
                { label: '운동', items: ['마포한강공원', '염리어린이공원'] },
                { label: '산책', items: ['와우산 둘레길', '한강 보행로'] },
              ].map(cat => (
                <div key={cat.label} className="p-3 bg-[#f4f6f8] rounded-lg">
                  <div className="font-semibold text-sm text-[#003478] mb-1">{cat.label}</div>
                  {cat.items.map(i => <div key={i} className="text-xs text-gray-600">{i}</div>)}
                </div>
              ))}
            </div>
          </section>

          {/* 청년 도움 링크 */}
          <section className="bg-white rounded-2xl border border-[#EDEFF1] p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">🔗 청년 도움 링크</h2>
            <div className="space-y-2">
              {[
                { label: '청년 월세 지원 (서울시)', href: 'https://youth.seoul.go.kr' },
                { label: '마포구 청년 정책', href: 'https://www.mapo.go.kr' },
                { label: '마포구 복지관', href: 'https://www.mapo.go.kr' },
                { label: '마음건강 위기상담 (1577-0199)', href: 'tel:15770199' },
              ].map(link => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 border border-[#EDEFF1] rounded-lg hover:border-[#003478] transition-colors">
                  <span className="text-sm text-gray-700">{link.label}</span>
                  <span className="text-xs text-[#003478]">→</span>
                </a>
              ))}
            </div>
          </section>

          {/* 교회 연결 문의 */}
          <section className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">⛪ 교회를 찾고 계신가요?</h2>
            <p className="text-sm text-gray-600 mb-4">부담 없이 문의해 주세요. 가까운 교회와 청년 모임을 안내해 드릴게요.</p>
            <a href="https://discord.gg/YOUR_INVITE_CODE" target="_blank" rel="noopener noreferrer"
              className="inline-block px-5 py-2.5 bg-[#003478] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors">
              Discord로 문의하기
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}
