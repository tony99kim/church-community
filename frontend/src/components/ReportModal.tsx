'use client';

import { useState } from 'react';
import api from '@/lib/api';

const REASONS = ['스팸/광고', '욕설/혐오 발언', '부적절한 내용', '허위 정보', '기타'];

export default function ReportModal({
  type,
  targetId,
  onClose,
}: {
  type: 'POST' | 'COMMENT';
  targetId: number;
  onClose: () => void;
}) {
  const [reason, setReason] = useState(REASONS[0]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/reports', { type, targetId, reason });
      alert('신고가 접수되었습니다.');
      onClose();
    } catch {
      alert('신고 접수에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-bold text-gray-900 mb-4">
          {type === 'POST' ? '게시글' : '댓글'} 신고
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">신고 사유</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-[#EDEFF1] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
            >
              {REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-sm border border-[#EDEFF1] px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-50 transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="text-sm bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 disabled:opacity-50 transition"
            >
              {submitting ? '신고 중...' : '신고하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
