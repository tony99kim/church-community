'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { FaithQuestion, PrayerRequest, PastorInfo } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/Toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Tab = 'questions' | 'prayers' | 'consult';

export default function FaithPage() {
  const [tab, setTab] = useState<Tab>('questions');
  const [questions, setQuestions] = useState<FaithQuestion[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [qForm, setQForm] = useState({ content: '' });
  const [pForm, setPForm] = useState({ content: '' });
  const [qVisibility, setQVisibility] = useState<'public' | 'anonymous' | 'secret'>('anonymous');
  const [pPublic, setPPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useAuthStore();
  const router = useRouter();
  const [counselors, setCounselors] = useState<PastorInfo[]>([]);
  const [selectedChurch, setSelectedChurch] = useState('');
  const [consultForm, setConsultForm] = useState({ pastorId: '', message: '' });
  const [consultLoading, setConsultLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/faith/questions').then(r => setQuestions(r.data.data ?? [])),
      api.get('/faith/prayers').then(r => setPrayers(r.data.data ?? [])),
      api.get('/users/pastors').then(r => setCounselors(r.data.data ?? [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/faith/questions', {
      content: qForm.content,
      anonymous: qVisibility === 'anonymous',
      publicVisible: qVisibility !== 'secret',
    });
    setQForm({ content: '' });
    setQVisibility('anonymous');
    api.get('/faith/questions').then(r => setQuestions(r.data.data ?? []));
  };

  const submitPrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/faith/prayers', { content: pForm.content, publicVisible: pPublic });
    setPForm({ content: '' });
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

  const [prayingIds, setPrayingIds] = useState<Set<number>>(new Set());
  const pray = async (id: number) => {
    if (!isLoggedIn) { alert('로그인 후 이용할 수 있습니다.'); return; }
    if (prayingIds.has(id)) return;
    setPrayingIds(prev => new Set(prev).add(id));
    try {
      await api.post(`/faith/prayers/${id}/pray`);
      setPrayers(prev => prev.map(p => p.id === id ? { ...p, prayerCount: p.prayerCount + 1 } : p));
    } finally {
      setPrayingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">불러오는 중...</span>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">✝️</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">신앙 Q&A</h1>
          <p className="text-sm text-muted-foreground mt-1">신앙 질문을 남기면 목사님이 답변해 드립니다</p>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-8 bg-muted p-1.5 rounded-2xl">
          {([['questions', '신앙 질문'], ['prayers', '기도 요청'], ['consult', '비공개 상담 🔒']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === key
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'questions' && (
          <div className="space-y-4">
            {!isLoggedIn ? (
              <Card className="p-5 text-center bg-primary/5 border-primary/20">
                <p className="text-sm text-gray-600">
                  <Link href="/login" className="text-primary font-bold hover:underline">로그인</Link> 후 신앙 질문을 남길 수 있습니다.
                </p>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-5">
                  <form onSubmit={submitQuestion}>
                    <textarea required value={qForm.content} rows={3} placeholder="신앙에 대해 궁금한 점을 남겨주세요..."
                      onChange={e => setQForm(p => ({ ...p, content: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none mb-4 transition-all" />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 bg-muted rounded-xl p-1">
                        {([['public', '실명 공개'], ['anonymous', '익명'], ['secret', '🔒 비밀글']] as const).map(([v, label]) => (
                          <button key={v} type="button" onClick={() => setQVisibility(v)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${qVisibility === v ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-gray-700'}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        {qVisibility === 'secret' && (
                          <span className="text-xs text-muted-foreground">나와 목사님만 볼 수 있어요</span>
                        )}
                        <button type="submit" className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                          질문하기
                        </button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {questions.map(q => (
              <Card key={q.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                      {q.anonymous ? '익' : (q.authorNickname?.[0] ?? '?')}
                    </div>
                    <span className="text-xs font-medium text-gray-600">{q.anonymous ? '익명' : q.authorNickname}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{new Date(q.createdAt).toLocaleDateString()}</span>
                    <div className="ml-auto">
                      {q.answers.length === 0 ? (
                        <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-[10px]">미답변</Badge>
                      ) : (
                        <Badge className="bg-green-50 text-green-600 border-green-200 text-[10px]">답변 {q.answers.length}</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed">{q.content}</p>
                  {q.answers.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {q.answers.map(a => (
                        <div key={a.id} className="bg-primary/5 border border-primary/15 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-white text-[10px] font-bold">목</span>
                            </div>
                            <span className="text-xs font-bold text-primary">목사님 답변</span>
                            <span className="text-xs text-muted-foreground">— {a.pastorNickname}</span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{a.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {tab === 'consult' && (() => {
          const ROLE_LABEL: Record<string, string> = { PASTOR: '목사', EVANGELIST: '전도사' };
          const churches = Array.from(new Set(counselors.map(c => c.churchName ?? '소속 없음')));
          const filtered = selectedChurch ? counselors.filter(c => (c.churchName ?? '소속 없음') === selectedChurch) : [];
          return (
            <Card className="max-w-lg mx-auto">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl mb-2">🔒</div>
                  <h2 className="text-base font-bold text-gray-900">비공개 상담</h2>
                  <p className="text-xs text-muted-foreground mt-1">목사님·전도사님께 개인 메시지를 보내드립니다.<br />내용은 본인과 해당 분만 볼 수 있습니다.</p>
                </div>
                {!isLoggedIn ? (
                  <p className="text-sm text-muted-foreground text-center py-8">로그인 후 이용할 수 있습니다.</p>
                ) : counselors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">현재 상담 가능한 분이 없습니다.</p>
                ) : (
                  <form onSubmit={submitConsult} className="space-y-4">
                    {/* 1단계: 교회 선택 */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-4 h-4 bg-primary text-white rounded-full text-[10px] flex items-center justify-center font-bold">1</span>
                          교회 선택
                        </span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {churches.map(church => (
                          <button key={church} type="button"
                            onClick={() => { setSelectedChurch(church); setConsultForm(p => ({ ...p, pastorId: '' })); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                              selectedChurch === church
                                ? 'bg-primary text-white border-primary'
                                : 'border-border text-gray-600 hover:border-primary hover:text-primary'
                            }`}>
                            {church}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2단계: 상담자 선택 */}
                    {selectedChurch && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-4 h-4 bg-primary text-white rounded-full text-[10px] flex items-center justify-center font-bold">2</span>
                            상담자 선택
                          </span>
                        </label>
                        <div className="space-y-2">
                          {filtered.map(c => (
                            <button key={c.id} type="button"
                              onClick={() => setConsultForm(p => ({ ...p, pastorId: String(c.id) }))}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                                consultForm.pastorId === String(c.id)
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50 hover:bg-accent'
                              }`}>
                              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm font-bold shrink-0">
                                {c.nickname[0]}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{c.nickname}</div>
                                <div className="text-xs text-muted-foreground">{ROLE_LABEL[c.role] ?? c.role}</div>
                              </div>
                              {consultForm.pastorId === String(c.id) && (
                                <div className="ml-auto w-4 h-4 bg-primary rounded-full flex items-center justify-center shrink-0">
                                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3단계: 메시지 */}
                    {consultForm.pastorId && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-4 h-4 bg-primary text-white rounded-full text-[10px] flex items-center justify-center font-bold">3</span>
                            상담 내용
                          </span>
                        </label>
                        <textarea required rows={5} value={consultForm.message}
                          onChange={e => setConsultForm(p => ({ ...p, message: e.target.value }))}
                          placeholder="상담하고 싶은 내용을 작성해주세요..."
                          className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none transition-all" />
                      </div>
                    )}

                    <button type="submit" disabled={consultLoading || !consultForm.pastorId || !consultForm.message.trim()}
                      className="w-full py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                      {consultLoading ? '전송 중...' : '메시지 보내기'}
                    </button>
                  </form>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {tab === 'prayers' && (
          <div className="space-y-4">
            {!isLoggedIn ? (
              <Card className="p-5 text-center bg-primary/5 border-primary/20">
                <p className="text-sm text-gray-600">
                  <Link href="/login" className="text-primary font-bold hover:underline">로그인</Link> 후 기도 요청을 남길 수 있습니다.
                </p>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-5">
                  <form onSubmit={submitPrayer}>
                    <textarea required value={pForm.content} rows={3} placeholder="기도 제목을 나눠주세요..."
                      onChange={e => setPForm(p => ({ ...p, content: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none mb-4 transition-all" />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 bg-muted rounded-xl p-1">
                        {([true, false] as const).map((v) => (
                          <button key={String(v)} type="button" onClick={() => setPPublic(v)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${pPublic === v ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-gray-700'}`}>
                            {v ? '공개' : '나만 보기'}
                          </button>
                        ))}
                      </div>
                      <button type="submit" className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                        등록하기
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
            {prayers.map(p => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-600">
                      {p.authorNickname?.[0] ?? '?'}
                    </div>
                    <span className="text-xs font-medium text-gray-600">{p.authorNickname}</span>
                    <span className="text-xs text-muted-foreground">· {new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed mb-4">{p.content}</p>
                  <button onClick={() => pray(p.id)} disabled={prayingIds.has(p.id)}
                    className="flex items-center gap-1.5 text-xs px-4 py-2 border border-border rounded-full text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                    🙏 함께 기도할게요 {p.prayerCount > 0 && <span className="font-bold text-primary">({p.prayerCount})</span>}
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
