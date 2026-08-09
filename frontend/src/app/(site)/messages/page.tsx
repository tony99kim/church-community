'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Conversation, DmMessage, UserBasicInfo } from '@/types';

function formatConvTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return '어제';
  return d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-11 h-11 text-base' : 'w-10 h-10 text-sm';
  return (
    <div className={`${cls} bg-[#003478] rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
      {name?.[0] ?? '?'}
    </div>
  );
}

function NewConversationModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (convId: number) => void;
}) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<UserBasicInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserBasicInfo | null>(null);
  const [message, setMessage] = useState('');
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (keyword.trim().length < 1) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/users/search?keyword=${encodeURIComponent(keyword)}`);
        setResults(res.data.data ?? []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  const handleSend = async () => {
    if (!selectedUser || !message.trim()) return;
    setSending(true);
    try {
      const res = await api.post('/conversations', { recipientId: selectedUser.id, initialMessage: message });
      onCreated(res.data.data.id);
    } catch {
      alert('메시지 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">새 대화 시작</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-xl">×</button>
        </div>

        {!selectedUser ? (
          <>
            <div className="relative mb-3">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                autoFocus
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="닉네임으로 검색..."
                className="w-full pl-9 pr-4 py-2.5 border border-[#EDEFF1] rounded-xl text-sm focus:outline-none focus:border-[#003478]"
              />
            </div>
            {searching && <p className="text-xs text-gray-400 text-center py-3">검색 중...</p>}
            {!searching && keyword.trim() && results.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-3">검색 결과가 없습니다.</p>
            )}
            <ul className="space-y-0.5 max-h-56 overflow-y-auto">
              {results.map(u => (
                <li key={u.id}>
                  <button
                    onClick={() => setSelectedUser(u)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition text-left"
                  >
                    <Avatar name={u.nickname} size="sm" />
                    <span className="text-sm font-medium text-gray-900">{u.nickname}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-xl">
              <Avatar name={selectedUser.nickname} size="sm" />
              <span className="text-sm font-semibold text-gray-900 flex-1">{selectedUser.nickname}</span>
              <button onClick={() => setSelectedUser(null)} className="text-xs text-gray-400 hover:text-gray-600 underline">변경</button>
            </div>
            <textarea
              autoFocus
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="첫 메시지를 입력하세요..."
              className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-xl text-sm focus:outline-none focus:border-[#003478] resize-none mb-3"
            />
            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="w-full py-2.5 bg-[#003478] text-white rounded-xl text-sm font-semibold hover:bg-blue-900 disabled:opacity-50 transition"
            >
              {sending ? '전송 중...' : '보내기'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn, hydrated } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadConversations = () =>
    api.get('/conversations').then(r => setConversations(r.data.data ?? []));

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn) { router.replace('/login'); return; }
    loadConversations().finally(() => setLoading(false));
  }, [hydrated, isLoggedIn]);

  useEffect(() => {
    const convId = searchParams.get('convId');
    if (convId && conversations.length > 0 && !selectedId) {
      openConversation(Number(convId));
    }
  }, [conversations, searchParams]);

  const openConversation = async (convId: number) => {
    setSelectedId(convId);
    const res = await api.get(`/conversations/${convId}/messages`);
    setMessages(res.data.data ?? []);
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c));
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }, 50);
  };

  const sendMessage = async () => {
    const content = msgInput.trim();
    if (!content || !selectedId || sending) return;
    setSending(true);
    try {
      await api.post(`/conversations/${selectedId}/messages`, { content });
      setMsgInput('');
      const res = await api.get(`/conversations/${selectedId}/messages`);
      setMessages(res.data.data ?? []);
      await loadConversations();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } finally {
      setSending(false);
    }
  };

  const handleNewConversationCreated = async (convId: number) => {
    setShowNewModal(false);
    await loadConversations();
    openConversation(convId);
  };

  const selected = conversations.find(c => c.id === selectedId);
  const counterpart = selected
    ? (user?.id === selected.userId ? selected.pastorNickname : selected.userNickname)
    : null;

  if (!hydrated || loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 48px)' }}>
        <div className="text-center text-gray-400">
          <div className="w-10 h-10 border-2 border-[#003478] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showNewModal && (
        <NewConversationModal
          onClose={() => setShowNewModal(false)}
          onCreated={handleNewConversationCreated}
        />
      )}

      {/* 전체 채팅 컨테이너 — 헤더(48px) 제외한 풀스크린 */}
      <div className="flex bg-white" style={{ height: 'calc(100vh - 48px)' }}>

        {/* ── 왼쪽: 대화 목록 패널 ── */}
        {/* 모바일: 채팅 열리면 숨김 / 데스크톱: 항상 표시 */}
        <div className={`
          ${selectedId ? 'hidden md:flex' : 'flex'}
          flex-col w-full md:w-80 lg:w-96 border-r border-[#EDEFF1] bg-white
        `}>
          {/* 목록 헤더 */}
          <div className="px-4 py-3 border-b border-[#EDEFF1] flex items-center justify-between shrink-0">
            <h1 className="text-lg font-bold text-gray-900">메시지</h1>
            <button
              onClick={() => setShowNewModal(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#003478] text-white hover:bg-blue-900 transition text-xl leading-none"
              title="새 대화"
            >
              +
            </button>
          </div>

          {/* 대화 목록 */}
          {conversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 px-6 text-center">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-sm font-medium text-gray-600 mb-1">아직 대화가 없어요</p>
              <p className="text-xs text-gray-400 mb-4">새 대화를 시작해보세요</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="px-5 py-2 bg-[#003478] text-white text-sm rounded-xl hover:bg-blue-900 transition"
              >
                + 새 대화 시작
              </button>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto">
              {conversations.map(c => {
                const name = user?.id === c.userId ? c.pastorNickname : c.userNickname;
                const isSelected = selectedId === c.id;
                const hasUnread = c.unreadCount > 0;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => openConversation(c.id)}
                      className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition hover:bg-gray-50 active:bg-gray-100 ${isSelected ? 'bg-blue-50' : ''}`}
                    >
                      <Avatar name={name} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
                            {name}
                          </span>
                          <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                            {formatConvTime(c.lastMessageAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs truncate ${hasUnread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                            {c.lastMessagePreview || '대화를 시작하세요'}
                          </p>
                          {hasUnread && (
                            <span className="shrink-0 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                              {c.unreadCount > 99 ? '99+' : c.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── 오른쪽: 채팅 영역 ── */}
        {/* 모바일: 채팅 선택시에만 표시 / 데스크톱: 항상 표시 */}
        <div className={`
          ${selectedId ? 'flex' : 'hidden md:flex'}
          flex-col flex-1 min-w-0
        `}>
          {!selectedId ? (
            /* 데스크톱 빈 상태 */
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-sm font-medium text-gray-600 mb-1">대화를 선택하세요</p>
              <p className="text-xs text-gray-400 mb-4">또는 새 대화를 시작하세요</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="px-5 py-2 border border-[#003478] text-[#003478] text-sm rounded-xl hover:bg-blue-50 transition"
              >
                + 새 대화 시작
              </button>
            </div>
          ) : (
            <>
              {/* 채팅 헤더 */}
              <div className="px-4 py-3 border-b border-[#EDEFF1] flex items-center gap-3 bg-white shrink-0">
                {/* 모바일 뒤로가기 버튼 */}
                <button
                  onClick={() => setSelectedId(null)}
                  className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {counterpart && <Avatar name={counterpart} size="sm" />}
                <div>
                  <div className="text-sm font-semibold text-gray-900">{counterpart}</div>
                </div>
              </div>

              {/* 메시지 목록 */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-gray-50">
                {messages.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-8">첫 메시지를 보내보세요 👋</p>
                )}
                {messages.map((m, i) => {
                  const isMine = m.senderId === user?.id;
                  const prevSame = i > 0 && messages[i - 1].senderId === m.senderId;
                  return (
                    <div key={m.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'} ${prevSame ? 'mt-0.5' : 'mt-3'}`}>
                      {!isMine && !prevSame && <Avatar name={m.senderNickname} size="sm" />}
                      {!isMine && prevSame && <div className="w-8 shrink-0" />}
                      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[72%]`}>
                        {!isMine && !prevSame && (
                          <span className="text-[11px] text-gray-500 mb-1 ml-1">{m.senderNickname}</span>
                        )}
                        <div className={`flex items-end gap-1.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                            isMine
                              ? 'bg-[#003478] text-white rounded-br-sm'
                              : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
                          }`}>
                            {m.content}
                          </div>
                          <span className={`text-[10px] shrink-0 ${isMine ? 'text-gray-400' : 'text-gray-400'}`}>
                            {new Date(m.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* 입력창 */}
              <div className="px-4 py-3 bg-white border-t border-[#EDEFF1] flex items-center gap-2 shrink-0">
                <input
                  ref={inputRef}
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder="메시지 입력..."
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] focus:bg-white transition"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !msgInput.trim()}
                  className="w-10 h-10 flex items-center justify-center bg-[#003478] text-white rounded-full hover:bg-blue-900 disabled:opacity-40 transition shrink-0"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 48px)' }}>
        <div className="w-10 h-10 border-2 border-[#003478] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
