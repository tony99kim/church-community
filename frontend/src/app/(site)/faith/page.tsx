'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { FaithQuestion, PrayerRequest } from '@/types';
import { useAuthStore } from '@/store/authStore';

type Tab = 'questions' | 'prayers';

export default function FaithPage() {
  const [tab, setTab] = useState<Tab>('questions');
  const [questions, setQuestions] = useState<FaithQuestion[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [qForm, setQForm] = useState({ content: '', anonymous: false, publicVisible: true });
  const [pForm, setPForm] = useState({ content: '', publicVisible: true });
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    Promise.all([
      api.get('/faith/questions').then(r => setQuestions(r.data.data ?? [])),
      api.get('/faith/prayers').then(r => setPrayers(r.data.data ?? [])),
    ]).finally(() => setLoading(false));
  }, []);

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/faith/questions', qForm);
    setQForm({ content: '', anonymous: false, publicVisible: true });
    api.get('/faith/questions').then(r => setQuestions(r.data.data ?? []));
  };

  const submitPrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/faith/prayers', pForm);
    setPForm({ content: '', publicVisible: true });
    api.get('/faith/prayers').then(r => setPrayers(r.data.data ?? []));
  };

  const pray = async (id: number) => {
    await api.post(`/faith/prayers/${id}/pray`);
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, prayerCount: p.prayerCount + 1 } : p));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">불러오는 중...</div>;

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-2">신앙 Q&A ✝️</h1>
        <p className="text-gray-600 mb-6">신앙 질문을 남기면 목사님이 답변해 드립니다.</p>

        <div className="flex gap-2 mb-6">
          {([['questions', '신앙 질문'], ['prayers', '기도 요청']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${tab === key ? 'bg-[#003478] text-white' : 'bg-white border border-[#EDEFF1] text-gray-600'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'questions' && (
          <div className="space-y-4">
            {isLoggedIn && (
              <form onSubmit={submitQuestion} className="bg-white rounded-2xl border border-[#EDEFF1] p-5">
                <textarea required value={qForm.content} rows={3} placeholder="신앙에 대해 궁금한 점을 남겨주세요..."
                  onChange={e => setQForm(p => ({ ...p, content: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478] resize-none mb-3" />
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={qForm.anonymous}
                        onChange={e => setQForm(p => ({ ...p, anonymous: e.target.checked }))}
                        className="accent-[#003478]" />
                      익명
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={qForm.publicVisible}
                        onChange={e => setQForm(p => ({ ...p, publicVisible: e.target.checked }))}
                        className="accent-[#003478]" />
                      공개
                    </label>
                  </div>
                  <button type="submit" className="px-4 py-2 bg-[#003478] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors">
                    질문하기
                  </button>
                </div>
              </form>
            )}
            {questions.map(q => (
              <div key={q.id} className="bg-white rounded-2xl border border-[#EDEFF1] p-5">
                <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                  <span>{q.anonymous ? '익명' : q.authorNickname}</span>
                  <span>·</span>
                  <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-800 text-sm mb-3">{q.content}</p>
                {q.answers.length > 0 && (
                  <div className="border-t border-[#EDEFF1] pt-3 space-y-2">
                    {q.answers.map(a => (
                      <div key={a.id} className="bg-blue-50 rounded-lg p-3">
                        <div className="text-xs text-[#003478] font-medium mb-1">목사님 답변 — {a.pastorNickname}</div>
                        <p className="text-sm text-gray-700">{a.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'prayers' && (
          <div className="space-y-4">
            {isLoggedIn && (
              <form onSubmit={submitPrayer} className="bg-white rounded-2xl border border-[#EDEFF1] p-5">
                <textarea required value={pForm.content} rows={3} placeholder="기도 제목을 나눠주세요..."
                  onChange={e => setPForm(p => ({ ...p, content: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478] resize-none mb-3" />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={pForm.publicVisible}
                      onChange={e => setPForm(p => ({ ...p, publicVisible: e.target.checked }))}
                      className="accent-[#003478]" />
                    공개
                  </label>
                  <button type="submit" className="px-4 py-2 bg-[#003478] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors">
                    등록하기
                  </button>
                </div>
              </form>
            )}
            {prayers.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-[#EDEFF1] p-5">
                <div className="text-xs text-gray-400 mb-2">{p.authorNickname} · {new Date(p.createdAt).toLocaleDateString()}</div>
                <p className="text-gray-800 text-sm mb-3">{p.content}</p>
                <button onClick={() => pray(p.id)}
                  className="text-xs px-3 py-1.5 border border-[#EDEFF1] rounded-full text-gray-600 hover:border-[#003478] hover:text-[#003478] transition-colors">
                  🙏 함께 기도할게요 {p.prayerCount > 0 && `(${p.prayerCount})`}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
