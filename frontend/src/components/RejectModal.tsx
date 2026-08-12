'use client';

import { useState } from 'react';

interface RejectModalProps {
  onConfirm: (reason: string) => void;
  onClose: () => void;
  title?: string;
}

export function RejectModal({ onConfirm, onClose, title = '거절 사유' }: RejectModalProps) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <h2 className="font-bold text-gray-900 mb-3">{title}</h2>
        <textarea
          rows={3}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="거절 사유를 입력하세요"
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] resize-none mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50">
            취소
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50"
          >
            거절 확인
          </button>
        </div>
      </div>
    </div>
  );
}
