'use client';

import { useEffect, useRef, useState } from 'react';

interface ChatMessage {
  id: number;
  senderRole: string;
  senderNickname: string;
  content: string;
  createdAt: string;
}

interface ChatBoxProps {
  messages: ChatMessage[];
  onSend: (content: string) => Promise<void>;
  sending: boolean;
  adminRole: string;
  placeholder?: string;
}

export function ChatBox({ messages, onSend, sending, adminRole, placeholder = '메시지를 입력하세요...' }: ChatBoxProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setInput('');
    await onSend(content);
  };

  return (
    <div className="mt-3 border-t border-[#EDEFF1] pt-3">
      <div className="bg-gray-50 rounded-xl p-3 max-h-56 overflow-y-auto space-y-2 mb-2">
        {messages.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">아직 메시지가 없습니다.</p>
        ) : messages.map(m => (
          <div key={m.id} className={`flex ${m.senderRole === adminRole ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
              m.senderRole === adminRole ? 'bg-[#003478] text-white' : 'bg-white border border-[#EDEFF1] text-gray-800'
            }`}>
              {m.senderRole !== adminRole && (
                <div className="text-[10px] text-gray-400 mb-0.5">{m.senderNickname}</div>
              )}
              <p>{m.content}</p>
              <div className={`text-[10px] mt-0.5 ${m.senderRole === adminRole ? 'text-blue-200' : 'text-gray-400'}`}>
                {new Date(m.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder={placeholder}
          className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="px-4 py-2 bg-[#003478] text-white rounded-xl text-sm font-medium hover:bg-blue-900 disabled:opacity-50"
        >
          전송
        </button>
      </div>
    </div>
  );
}
