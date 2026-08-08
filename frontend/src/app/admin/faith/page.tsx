'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { FaithQuestion, PrayerRequest, ChatMessage } from '@/types';

type Tab = 'questions' | 'prayers';
type QFilter = 'all' | 'unanswered' | 'answered';
type PFilter = 'all' | 'unprayed' | 'prayed';

export default function AdminFaithPage() {
  const [tab, setTab] = useState<Tab>('questions');
  const [qFilter, setQFilter] = useState<QFilter>('all');
  const [pFilter, setPFilter] = useState<PFilter>('all');
  const [questions, setQuestions] = useState<FaithQuestion[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [prayingId, setPrayingId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchAll = () => {
    Promise.all([
      api.get('/faith/admin/questions').then(r => setQuestions(r.data.data ?? [])),
      api.get('/faith/admin/prayers').then(r => setPrayers(r.data.data ?? [])),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const openChat = async (questionId: number) => {
    if (expandedId === questionId) { setExpandedId(null); return; }
    setExpandedId(questionId);
    const res = await api.get(`/faith/questions/${questionId}/messages`);
    setMessages(res.data.data ?? []);
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const sendMsg = async (questionId: number) => {
    const content = msgInput.trim();
    if (!content) return;
    setSendingMsg(true);
    try {
      await api.post(`/faith/questions/${questionId}/messages`, { content });
      setMsgInput('');
      const res = await api.get(`/faith/questions/${questionId}/messages`);
      setMessages(res.data.data ?? []);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } finally {
      setSendingMsg(false);
    }
  };

  const toggleAdminPrayed = async (prayerId: number) => {
    setPrayingId(prayerId);
    try {
      const res = await api.put(`/faith/admin/prayers/${prayerId}/prayed`);
      setPrayers(prev => prev.map(p => p.id === prayerId ? { ...p, adminPrayed: res.data.data.adminPrayed } : p));
    } catch {
      alert('변경에 실패했습니다.');
    } finally {
      setPrayingId(null);
    }
  };

  const unansweredCount = questions.filter(q => q.answers.length === 0).length;
  const unprayedCount = prayers.filter(p => !p.adminPrayed).length;

  const filteredQuestions = questions.filter(q => {
    if (qFilter === 'unanswered') return q.answers.length === 0;
    if (qFilter === 'answered') return q.answers.length > 0;
    return true;
  });

  const filteredPrayers = prayers.filter(p => {
    if (pFilter === 'unprayed') return !p.adminPrayed;
    if (pFilter === 'prayed') return p.adminPrayed;
    return true;
  });

  if (loading) return <div className="p-6 text-gray-400">불러오는 중...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6">신앙 Q&A 관리</h1>

      {/* 메인 탭 */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        {(['questions', 'prayers'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition relative ${tab === t ? 'bg-white text-[#003478] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'questions' ? `신앙 질문 (${questions.length})` : `기도 요청 (${prayers.length})`}
            {t === 'questions' && unansweredCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unansweredCount}
              </span>
            )}
            {t === 'prayers' && unprayedCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unprayedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'questions' && (
        <>
          {/* 질문 필터 */}
          <div className="flex gap-1 mb-4">
            {([
              { key: 'all', label: `전체 (${questions.length})` },
              { key: 'unanswered', label: `미답변 (${unansweredCount})` },
              { key: 'answered', label: `답변완료 (${questions.length - unansweredCount})` },
            ] as { key: QFilter; label: string }[]).map(f => (
              <button key={f.key} onClick={() => setQFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${qFilter === f.key ? 'bg-[#003478] text-white border-[#003478]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#003478]'}`}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredQuestions.length === 0 ? (
              <div className="bg-white border border-[#EDEFF1] rounded-xl py-12 text-center text-gray-400 text-sm">
                {qFilter === 'unanswered' ? '미답변 질문이 없습니다.' : qFilter === 'answered' ? '답변된 질문이 없습니다.' : '등록된 질문이 없습니다.'}
              </div>
            ) : filteredQuestions.map(q => (
              <div key={q.id} className={`bg-white border rounded-xl p-4 ${q.answers.length === 0 ? 'border-amber-200' : 'border-[#EDEFF1]'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 text-xs text-gray-400">
                      <span>{q.anonymous ? '익명' : q.authorNickname}</span>
                      <span>·</span>
                      <span>{new Date(q.createdAt).toLocaleDateString('ko-KR')}</span>
                      {!q.publicVisible && (
                        <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px]">비공개</span>
                      )}
                      {q.answers.length === 0 ? (
                        <span className="bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded text-[10px] font-medium">미답변</span>
                      ) : (
                        <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-medium">답변완료</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 mb-2">{q.content}</p>
                    {q.answers.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {q.answers.map(a => (
                          <div key={a.id} className="bg-blue-50 rounded-lg p-3">
                            <div className="text-xs text-[#003478] font-medium mb-1">답변 — {a.pastorNickname}</div>
                            <p className="text-sm text-gray-700">{a.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => openChat(q.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition shrink-0 ${expandedId === q.id ? 'bg-[#003478] text-white border-[#003478]' : 'text-[#003478] border-blue-200 hover:bg-blue-50'}`}
                  >
                    {expandedId === q.id ? '닫기' : '💬 채팅'}
                  </button>
                </div>
                {expandedId === q.id && (
                  <div className="mt-3 border-t border-[#EDEFF1] pt-3">
                    <div className="bg-gray-50 rounded-xl p-3 max-h-56 overflow-y-auto space-y-2 mb-2">
                      {messages.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">아직 대화가 없습니다. 먼저 메시지를 보내세요.</p>
                      ) : messages.map(m => (
                        <div key={m.id} className={`flex ${m.senderRole === 'PASTOR' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.senderRole === 'PASTOR' ? 'bg-[#003478] text-white' : 'bg-white border border-[#EDEFF1] text-gray-800'}`}>
                            {m.senderRole !== 'PASTOR' && <div className="text-[10px] text-gray-400 mb-0.5">{m.senderNickname}</div>}
                            <p>{m.content}</p>
                            <div className={`text-[10px] mt-0.5 ${m.senderRole === 'PASTOR' ? 'text-blue-200' : 'text-gray-400'}`}>
                              {new Date(m.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={chatBottomRef} />
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={msgInput}
                        onChange={e => setMsgInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMsg(q.id))}
                        placeholder="답변 또는 추가 메시지..."
                        className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                      />
                      <button
                        onClick={() => sendMsg(q.id)}
                        disabled={sendingMsg || !msgInput.trim()}
                        className="px-4 py-2 text-sm bg-[#003478] text-white rounded-xl font-semibold hover:bg-blue-900 disabled:opacity-50"
                      >
                        전송
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'prayers' && (
        <>
          {/* 기도 필터 */}
          <div className="flex gap-1 mb-4">
            {([
              { key: 'all', label: `전체 (${prayers.length})` },
              { key: 'unprayed', label: `기도 필요 (${unprayedCount})` },
              { key: 'prayed', label: `기도 완료 (${prayers.length - unprayedCount})` },
            ] as { key: PFilter; label: string }[]).map(f => (
              <button key={f.key} onClick={() => setPFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${pFilter === f.key ? 'bg-[#003478] text-white border-[#003478]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#003478]'}`}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredPrayers.length === 0 ? (
              <div className="bg-white border border-[#EDEFF1] rounded-xl py-12 text-center text-gray-400 text-sm">
                {pFilter === 'unprayed' ? '기도가 필요한 요청이 없습니다.' : pFilter === 'prayed' ? '기도 완료된 요청이 없습니다.' : '등록된 기도 요청이 없습니다.'}
              </div>
            ) : filteredPrayers.map(p => {
              const prayed = p.adminPrayed;
              return (
                <div key={p.id} className={`bg-white border rounded-xl p-4 ${prayed ? 'border-green-200 bg-green-50/30' : 'border-[#EDEFF1]'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 text-xs text-gray-400">
                        <span>{p.authorNickname}</span>
                        <span>·</span>
                        <span>{new Date(p.createdAt).toLocaleDateString('ko-KR')}</span>
                        {!p.publicVisible && (
                          <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px]">비공개</span>
                        )}
                        {prayed ? (
                          <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-medium">기도 완료</span>
                        ) : (
                          <span className="bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded text-[10px] font-medium">기도 필요</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800">{p.content}</p>
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                        <span>🙏</span>
                        <span>{p.prayerCount}명이 기도함</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleAdminPrayed(p.id)}
                      disabled={prayingId === p.id}
                      className={`shrink-0 text-xs px-3 py-1.5 rounded-lg border transition disabled:opacity-50 ${
                        prayed
                          ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                          : 'text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {prayingId === p.id ? '...' : prayed ? '🙏 기도했음' : '기도하기'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
