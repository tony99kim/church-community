'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Conversation, DmMessage } from '@/types';

export default function MessagesPage() {
  const router = useRouter();
  const { user, isLoggedIn, hydrated } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn) { router.replace('/login'); return; }
    api.get('/conversations')
      .then(r => setConversations(r.data.data ?? []))
      .finally(() => setLoading(false));
  }, [hydrated, isLoggedIn]);

  const openConversation = async (convId: number) => {
    setSelectedId(convId);
    const res = await api.get(`/conversations/${convId}/messages`);
    setMessages(res.data.data ?? []);
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c));
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const sendMessage = async () => {
    const content = msgInput.trim();
    if (!content || !selectedId) return;
    setSending(true);
    try {
      await api.post(`/conversations/${selectedId}/messages`, { content });
      setMsgInput('');
      const res = await api.get(`/conversations/${selectedId}/messages`);
      setMessages(res.data.data ?? []);
      const convRes = await api.get('/conversations');
      setConversations(convRes.data.data ?? []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } finally {
      setSending(false);
    }
  };

  const selected = conversations.find(c => c.id === selectedId);
  const counterpart = selected
    ? (user?.id === selected.userId ? selected.pastorNickname : selected.userNickname)
    : null;

  if (!hydrated || loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">불러오는 중...</div>;
  }

  return (
    <main className="min-h-screen bg-[#f4f6f8]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[#003478] mb-6">메시지 💬</h1>
        <div className="flex gap-4 h-[600px]">

          {/* 대화 목록 */}
          <div className="w-72 shrink-0 bg-white rounded-2xl border border-[#EDEFF1] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-[#EDEFF1] font-semibold text-sm text-gray-700">
              대화 목록
            </div>
            {conversations.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400 text-center px-4">
                <div>
                  <div className="text-3xl mb-2">💬</div>
                  <p>아직 대화가 없습니다.</p>
                  <p className="text-xs mt-1 text-gray-300">신앙 Q&A에서 비공개 상담을 시작해보세요.</p>
                </div>
              </div>
            ) : (
              <ul className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {conversations.map(c => {
                  const name = user?.id === c.userId ? c.pastorNickname : c.userNickname;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => openConversation(c.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${selectedId === c.id ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#003478] rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-sm font-semibold text-gray-900 truncate">{name}</span>
                              {c.unreadCount > 0 && (
                                <span className="ml-1 shrink-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                  {c.unreadCount > 9 ? '9+' : c.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 truncate">{c.lastMessagePreview}</p>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* 채팅 영역 */}
          <div className="flex-1 bg-white rounded-2xl border border-[#EDEFF1] overflow-hidden flex flex-col">
            {!selectedId ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                대화를 선택하세요
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-[#EDEFF1] flex items-center gap-2">
                  <div className="w-7 h-7 bg-[#003478] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {counterpart?.[0]}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{counterpart}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">메시지가 없습니다.</p>
                  )}
                  {messages.map(m => {
                    const isMine = m.senderId === user?.id;
                    return (
                      <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-sm ${isMine ? 'bg-[#003478] text-white' : 'bg-gray-100 text-gray-800'}`}>
                          {!isMine && (
                            <div className="text-[10px] text-gray-500 mb-0.5 font-medium">{m.senderNickname}</div>
                          )}
                          <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                          <div className={`text-[10px] mt-1 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                            {new Date(m.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                <div className="px-4 py-3 border-t border-[#EDEFF1] flex gap-2">
                  <input
                    value={msgInput}
                    onChange={e => setMsgInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    placeholder="메시지를 입력하세요..."
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !msgInput.trim()}
                    className="px-4 py-2.5 bg-[#003478] text-white rounded-xl text-sm font-medium hover:bg-blue-900 disabled:opacity-50 transition"
                  >
                    전송
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
