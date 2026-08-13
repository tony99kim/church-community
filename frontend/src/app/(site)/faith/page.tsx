'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { FaithQuestion, PrayerRequest, PastorInfo } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/Toast';

type Tab = 'questions' | 'prayers' | 'consult';

export default function FaithPage() {
  const [tab, setTab] = useState<Tab>('questions');
  const [questions, setQuestions] = useState<FaithQuestion[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [qForm, setQForm] = useState({ content: '', anonymous: false, publicVisible: true });
  const [pForm, setPForm] = useState({ content: '', publicVisible: false });
  // qVisibility: 'public'(실명공개) | 'anonymous'(익명공개)
  const [qVisibility, setQVisibility] = useState<'public' | 'anonymous'>('anonymous');
  const [pPublic, setPPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useAuthStore();
  const router = useRouter();
  const [pastors, setPastors] = useState<PastorInfo[]>([]);
  const [consultForm, setConsultForm] = useState({ pastorId: '', message: '' });
  const [consultLoading, setConsultLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/faith/questions').then(r => setQuestions(r.data.data ?? [])),
      api.get('/faith/prayers').then(r => setPrayers(r.data.data ?? [])),
      api.get('/users/pastors').then(r => setPastors(r.data.data ?? [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/faith/questions', {
      content: qForm.content,
      anonymous: qVisibility === 'anonymous',
      publicVisible: true,
    });
    setQForm({ content: '', anonymous: false, publicVisible: true });
    setQVisibility('public');
    api.get('/faith/questions').then(r => setQuestions(r.data.data ?? []));
  };

  const submitPrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/faith/prayers', { content: pForm.content, publicVisible: pPublic });
    setPForm({ content: '', publicVisible: true });
    setPPublic(true);
    api.get('/faith/prayers').then(r => setPrayers(r.data.data ?? []));
  };

  const submitConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultForm.pastorId || !consultForm.message.trim()) return;
    setConsultLoading(true);
    try {
      const res = await api.post('/conversations', {
        recipientId: Number(consultForm.pastorId),
        initialMessage: consultForm.message,
      });
      router.push(`/messages?convId=${res.data.data.id}`);
    } catch {
      toast('메시지 전송에 실패했습니다. 다시 시도해주세요.', 'error');
    } finally {
      setConsultLoading(false);
    }
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

        <div className="flex gap-2 mb-6 flex-wrap">
          {([['questions', '신앙 질문'], ['prayers', '기도 요청'], ['consult', '비공개 상담 🔒']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${tab === key ? 'bg-[#003478] text-white' : 'bg-white border border-[#EDEFF1] text-gray-600'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'questions' && (
          <div className="space-y-4">
            {!isLoggedIn && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center text-sm text-gray-600">
                <Link href="/login" className="text-[#003478] font-semibold hover:underline">로그인</Link> 후 신앙 질문을 남길 수 있습니다.
              </div>
            )}
            {isLoggedIn && (
              <form onSubmit={submitQuestion} className="bg-white rounded-2xl border border-[#EDEFF1] p-5">
                <textarea required value={qForm.content} rows={3} placeholder="신앙에 대해 궁금한 점을 남겨주세요..."
                  onChange={e => setQForm(p => ({ ...p, content: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478] resize-none mb-3" />
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {(['public', 'anonymous'] as const).map((v) => (
                      <button key={v} type="button" onClick={() => setQVisibility(v)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition ${qVisibility === v ? 'bg-white text-[#003478] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        {v === 'public' ? '실명 공개' : '익명'}
                      </button>
                    ))}
                  </div>
                  <button type="submit" className="px-4 py-2 bg-[#003478] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors">
                    질문하기
                  </button>
                </div>
              </form>
            )}
            {questions.map(q => (
              <div key={q.id} className="bg-white rounded-2xl border border-[#EDEFF1] p-5">
                <div className="flex items-center gap-2 mb-2 text-xs text-gray-400 flex-wrap">
                  <span>{q.anonymous ? '익명' : q.authorNickname}</span>
                  <span>·</span>
                  <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                  {q.answers.length === 0 && (
                    <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[10px] font-medium">미답변</span>
                  )}
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

        {tab === 'consult' && (
          <div className="bg-white rounded-2xl border border-[#EDEFF1] p-6 max-w-lg mx-auto">
            <h2 className="text-base font-semibold text-[#003478] mb-1">비공개 상담</h2>
            <p className="text-xs text-gray-500 mb-5">목사님께 개인 메시지를 보내드립니다. 내용은 본인과 해당 목사님만 볼 수 있습니다.</p>
            {!isLoggedIn ? (
              <p className="text-sm text-gray-500 text-center py-8">로그인 후 이용할 수 있습니다.</p>
            ) : pastors.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">현재 상담 가능한 목사님이 없습니다.</p>
            ) : (
              <form onSubmit={submitConsult} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">목사님 선택</label>
                  <select required value={consultForm.pastorId}
                    onChange={e => setConsultForm(p => ({ ...p, pastorId: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]">
                    <option value="">-- 목사님을 선택하세요 --</option>
                    {pastors.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nickname}{p.churchName ? ` (${p.churchName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">상담 내용</label>
                  <textarea required rows={5} value={consultForm.message}
                    onChange={e => setConsultForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="상담하고 싶은 내용을 작성해주세요..."
                    className="w-full px-3 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478] resize-none" />
                </div>
                <button type="submit" disabled={consultLoading || !consultForm.pastorId || !consultForm.message.trim()}
                  className="w-full py-2.5 bg-[#003478] text-white rounded-lg text-sm font-medium hover:bg-blue-900 disabled:opacity-50 transition-colors">
                  {consultLoading ? '전송 중...' : '메시지 보내기'}
                </button>
              </form>
            )}
          </div>
        )}

        {tab === 'prayers' && (
          <div className="space-y-4">
            {!isLoggedIn && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center text-sm text-gray-600">
                <Link href="/login" className="text-[#003478] font-semibold hover:underline">로그인</Link> 후 기도 요청을 남길 수 있습니다.
              </div>
            )}
            {isLoggedIn && (
              <form onSubmit={submitPrayer} className="bg-white rounded-2xl border border-[#EDEFF1] p-5">
                <textarea required value={pForm.content} rows={3} placeholder="기도 제목을 나눠주세요..."
                  onChange={e => setPForm(p => ({ ...p, content: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478] resize-none mb-3" />
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {([true, false] as const).map((v) => (
                      <button key={String(v)} type="button" onClick={() => setPPublic(v)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition ${pPublic === v ? 'bg-white text-[#003478] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        {v ? '공개' : '나만 보기'}
                      </button>
                    ))}
                  </div>
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
