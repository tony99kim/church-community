'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { WelcomeKit } from '@/types';

export default function AdminWelcomeKitsPage() {
  const router = useRouter();
  const [kits, setKits] = useState<WelcomeKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatInputs, setChatInputs] = useState<Record<number, string>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [startingChat, setStartingChat] = useState<number | null>(null);

  const fetchKits = () => {
    api.get('/admin/welcome/kits').then(r => setKits(r.data.data ?? [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchKits(); }, []);

  const markProcessed = async (id: number) => {
    await api.put(`/admin/welcome/kits/${id}/process`);
    fetchKits();
  };

  const startChat = async (kit: WelcomeKit) => {
    const msg = chatInputs[kit.id]?.trim();
    if (!msg || !kit.userId) return;
    setStartingChat(kit.id);
    try {
      const res = await api.post('/conversations', { recipientId: kit.userId, initialMessage: msg });
      router.push(`/messages?convId=${res.data.data.id}`);
    } catch {
      alert('채팅 시작에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setStartingChat(null);
    }
  };

  const pending = kits.filter(k => !k.processed);
  const done = kits.filter(k => k.processed);

  if (loading) return <div className="p-6 text-gray-400">불러오는 중...</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">웰컴 키트 신청 관리</h1>
        <p className="text-sm text-gray-500 mt-1">신청자에게 답변 메시지를 보내거나 처리 완료 표시를 할 수 있습니다.</p>
      </div>

      {/* 미처리 */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-amber-600 mb-3">미처리 ({pending.length})</h2>
        {pending.length === 0 ? (
          <div className="bg-white border border-[#EDEFF1] rounded-xl py-8 text-center text-gray-400 text-sm">
            미처리 신청이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(kit => (
              <div key={kit.id} className="bg-white border border-amber-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{kit.name} · {kit.phone}</div>
                    {kit.address && <div className="text-xs text-gray-400 mt-0.5">📍 {kit.address}</div>}
                    {kit.message && <div className="text-xs text-gray-500 mt-1 italic">"{kit.message}"</div>}
                    <div className="text-xs text-gray-400 mt-1">{new Date(kit.createdAt).toLocaleDateString('ko-KR')} 신청</div>
                    {kit.adminMessage && (
                      <div className="mt-2 bg-blue-50 rounded-lg px-3 py-2">
                        <div className="text-xs text-[#003478] font-medium mb-0.5">보낸 메시지</div>
                        <p className="text-xs text-gray-700">{kit.adminMessage}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {kit.userId ? (
                      <button
                        onClick={() => setExpandedId(expandedId === kit.id ? null : kit.id)}
                        className="text-xs text-[#003478] border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50"
                      >
                        💬 {expandedId === kit.id ? '닫기' : '채팅 시작'}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 border border-gray-200 px-3 py-1.5 rounded-lg">비회원 신청</span>
                    )}
                    <button
                      onClick={() => markProcessed(kit.id)}
                      className="text-xs text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50"
                    >
                      처리 완료
                    </button>
                  </div>
                </div>
                {expandedId === kit.id && kit.userId && (
                  <div className="mt-3 border-t border-[#EDEFF1] pt-3">
                    <p className="text-xs text-gray-500 mb-2">
                      <span className="font-medium text-gray-700">{kit.name}</span>님께 첫 메시지를 보내면 채팅방이 열립니다.
                    </p>
                    <textarea
                      autoFocus
                      rows={3}
                      value={chatInputs[kit.id] ?? ''}
                      onChange={e => setChatInputs(prev => ({ ...prev, [kit.id]: e.target.value }))}
                      placeholder={`안녕하세요 ${kit.name}님! 웰컴 키트 신청 감사합니다. 전달 일정을 안내드릴게요.`}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] resize-none mb-2"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => startChat(kit)}
                        disabled={!chatInputs[kit.id]?.trim() || startingChat === kit.id}
                        className="px-4 py-2 text-sm bg-[#003478] text-white rounded-xl font-semibold hover:bg-blue-900 disabled:opacity-50"
                      >
                        {startingChat === kit.id ? '채팅 여는 중...' : '채팅방 열기 →'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 처리 완료 */}
      {done.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 mb-3">처리 완료 ({done.length})</h2>
          <div className="space-y-2">
            {done.map(kit => (
              <div key={kit.id} className="bg-white border border-[#EDEFF1] rounded-xl p-4 opacity-70">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-sm">{kit.name} · {kit.phone}</div>
                    {kit.address && <div className="text-xs text-gray-400 mt-0.5">📍 {kit.address}</div>}
                    {kit.message && <div className="text-xs text-gray-500 mt-1 italic">"{kit.message}"</div>}
                    {kit.adminMessage && (
                      <div className="mt-2 bg-blue-50 rounded-lg px-3 py-2">
                        <div className="text-xs text-[#003478] font-medium mb-0.5">보낸 메시지</div>
                        <p className="text-xs text-gray-700">{kit.adminMessage}</p>
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">{new Date(kit.createdAt).toLocaleDateString('ko-KR')} 신청</div>
                  </div>
                  <span className="text-xs font-medium text-green-600 shrink-0">처리 완료</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
