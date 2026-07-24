'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Space, SlotInfo } from '@/types';
import { useAuthStore } from '@/store/authStore';

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const slotStyle: Record<string, string> = {
  AVAILABLE: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 cursor-pointer',
  TAKEN: 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed',
  MY_PENDING: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 cursor-pointer',
  MY_APPROVED: 'bg-blue-50 text-[#003478] border-[#003478] cursor-default',
};

const slotLabel: Record<string, string> = {
  AVAILABLE: '예약 가능',
  TAKEN: '마감',
  MY_PENDING: '대기중',
  MY_APPROVED: '승인됨',
};

export default function SpaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();

  const [space, setSpace] = useState<Space | null>(null);
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [loadingSlots, setLoadingSlots] = useState(false);

  // 신청 모달 상태
  const [pendingSlot, setPendingSlot] = useState<SlotInfo | null>(null);
  const [form, setForm] = useState({ headcount: '', purpose: '', contactPhone: '' });
  const [submitting, setSubmitting] = useState(false);

  // 취소 모달 상태
  const [cancelSlot, setCancelSlot] = useState<SlotInfo | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.get(`/spaces/${id}`).then(r => setSpace(r.data.data));
  }, [id]);

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    api.get(`/spaces/${id}/slots?date=${selectedDate}`)
      .then(r => setSlots(r.data.data ?? []))
      .finally(() => setLoadingSlots(false));
  }, [id, selectedDate]);

  const handleDayClick = (day: number) => {
    const dateStr = toDateStr(calYear, calMonth, day);
    const today = new Date().toLocaleDateString('en-CA');
    if (dateStr < today) return; // 과거 날짜 선택 불가
    setSelectedDate(dateStr);
    setSlots([]);
  };

  const handleSlotClick = (slot: SlotInfo) => {
    if (slot.status === 'MY_PENDING' && slot.rentalId) {
      setCancelSlot(slot);
      return;
    }
    if (slot.status !== 'AVAILABLE') return;
    if (!isLoggedIn) { router.push('/login'); return; }
    setPendingSlot(slot);
    setForm({ headcount: '', purpose: '', contactPhone: '' });
  };

  const handleCancel = async () => {
    if (!cancelSlot?.rentalId) return;
    setCancelling(true);
    try {
      await api.put(`/spaces/rentals/${cancelSlot.rentalId}/cancel`);
      setCancelSlot(null);
      const r = await api.get(`/spaces/${id}/slots?date=${selectedDate}`);
      setSlots(r.data.data ?? []);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? '취소 중 오류가 발생했습니다.');
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmit = async () => {
    if (!pendingSlot || !selectedDate) return;
    setSubmitting(true);
    try {
      await api.post(`/spaces/${id}/rentals`, {
        startDateTime: `${selectedDate}T${pendingSlot.startTime.slice(0, 8)}`,
        endDateTime: `${selectedDate}T${pendingSlot.endTime.slice(0, 8)}`,
        headcount: form.headcount ? Number(form.headcount) : null,
        purpose: form.purpose,
        contactPhone: form.contactPhone,
      });
      alert('예약 신청이 완료되었습니다! 담당자 승인 후 확정됩니다.');
      setPendingSlot(null);
      // 슬롯 새로고침
      const r = await api.get(`/spaces/${id}/slots?date=${selectedDate}`);
      setSlots(r.data.data ?? []);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? '예약 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const { firstDay, daysInMonth } = getMonthDays(calYear, calMonth);
  const today = new Date().toLocaleDateString('en-CA');

  if (!space) return <div className="min-h-screen flex items-center justify-center text-gray-400">불러오는 중...</div>;

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 공간 정보 */}
        <div className="bg-white rounded-2xl border border-[#EDEFF1] p-5 mb-6">
          <div className="flex items-start justify-between mb-1">
            <h1 className="text-xl font-bold text-gray-900">{space.name}</h1>
            <span className={`px-2 py-0.5 text-xs rounded-full ${space.available ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
              {space.available ? '예약 가능' : '예약 불가'}
            </span>
          </div>
          {space.churchName && <p className="text-xs text-gray-400 mb-2">⛪ {space.churchName}</p>}
          {space.description && <p className="text-sm text-gray-600 mb-2">{space.description}</p>}
          <div className="text-xs text-gray-400 flex gap-4 flex-wrap">
            {space.capacity && <span>👥 최대 {space.capacity}명</span>}
            <span>🕐 {space.openTime?.slice(0,5)} ~ {space.closeTime?.slice(0,5)}</span>
            <span>⏱ {space.slotMinutes}분 단위</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 달력 */}
          <div className="bg-white rounded-2xl border border-[#EDEFF1] p-5">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); }}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">‹</button>
              <span className="font-semibold text-gray-800">{calYear}년 {calMonth + 1}월</span>
              <button onClick={() => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); }}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">›</button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">
              {['일','월','화','수','목','금','토'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 text-center text-sm gap-y-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dateStr = toDateStr(calYear, calMonth, day);
                const isPast = dateStr < today;
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === today;
                return (
                  <button key={day} disabled={isPast || !space.available}
                    onClick={() => handleDayClick(day)}
                    className={`w-8 h-8 mx-auto rounded-full text-xs font-medium transition-colors
                      ${isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                      ${isSelected ? 'bg-[#003478] text-white' : isToday ? 'ring-2 ring-[#003478] text-[#003478]' : !isPast ? 'hover:bg-blue-50 text-gray-700' : ''}
                    `}>
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 슬롯 그리드 */}
          <div className="bg-white rounded-2xl border border-[#EDEFF1] p-5">
            {!selectedDate ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">← 날짜를 선택하세요</div>
            ) : loadingSlots ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">불러오는 중...</div>
            ) : slots.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">예약 가능한 시간이 없습니다</div>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-700 mb-3">{selectedDate} 시간대</p>
                <div className="grid grid-cols-2 gap-2">
                  {slots.map(slot => (
                    <button key={slot.startTime}
                      onClick={() => handleSlotClick(slot)}
                      className={`border rounded-xl px-3 py-2 text-xs font-medium transition-colors ${slotStyle[slot.status]}`}>
                      <div>{slot.startTime.slice(0,5)} ~ {slot.endTime.slice(0,5)}</div>
                      <div className="text-[10px] mt-0.5 opacity-70">{slotLabel[slot.status]}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex gap-3 flex-wrap text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"/> 예약가능</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block"/> 마감</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/> 내 대기</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#003478] inline-block"/> 내 승인</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 취소 확인 모달 */}
      {cancelSlot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="font-bold text-gray-900 mb-2">예약 취소</h2>
            <p className="text-sm text-gray-600 mb-1">이 예약을 취소하시겠어요?</p>
            <p className="text-xs text-gray-400 mb-5">
              {selectedDate} {cancelSlot.startTime.slice(0, 5)} ~ {cancelSlot.endTime.slice(0, 5)}
            </p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setCancelSlot(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50">닫기</button>
              <button type="button" onClick={handleCancel} disabled={cancelling}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50">
                {cancelling ? '취소 중...' : '취소하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 신청 모달 */}
      {pendingSlot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="font-bold text-gray-900 mb-1">예약 신청</h2>
            <p className="text-xs text-gray-500 mb-4">
              {selectedDate} {pendingSlot.startTime.slice(0,5)} ~ {pendingSlot.endTime.slice(0,5)}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">예상 인원</label>
                <input type="number" min="1" value={form.headcount}
                  onChange={e => setForm(f => ({ ...f, headcount: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                  placeholder="명" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">사용 목적 *</label>
                <textarea required rows={2} value={form.purpose}
                  onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">연락처 *</label>
                <input value={form.contactPhone}
                  onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                  placeholder="010-0000-0000" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button type="button" onClick={() => setPendingSlot(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50">취소</button>
              <button type="button" onClick={handleSubmit} disabled={submitting || !form.purpose || !form.contactPhone}
                className="px-4 py-2 text-sm bg-[#003478] text-white rounded-xl font-semibold hover:bg-blue-900 disabled:opacity-50">
                {submitting ? '신청 중...' : '예약 신청'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
