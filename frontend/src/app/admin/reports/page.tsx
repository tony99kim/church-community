'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

type ReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';
type ReportType = 'POST' | 'COMMENT' | 'USER';

interface Report {
  id: number;
  reporterNickname: string;
  type: ReportType;
  targetId: number;
  reason: string;
  status: ReportStatus;
  adminNote: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<ReportStatus, string> = {
  PENDING: '대기 중', RESOLVED: '처리됨', REJECTED: '기각',
};
const STATUS_COLOR: Record<ReportStatus, string> = {
  PENDING: 'bg-yellow-50 text-yellow-600',
  RESOLVED: 'bg-green-50 text-green-600',
  REJECTED: 'bg-gray-100 text-gray-400',
};
const TYPE_LABEL: Record<ReportType, string> = {
  POST: '게시글', COMMENT: '댓글', USER: '회원',
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReportStatus | ''>('PENDING');
  const [actionId, setActionId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [actionType, setActionType] = useState<'resolve' | 'reject' | null>(null);

  const fetchReports = (status?: string) => {
    setLoading(true);
    const params = status ? { status, size: 50 } : { size: 50 };
    api.get('/admin/reports', { params })
      .then((r) => setReports(r.data.data.content))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReports(filter || undefined); }, [filter]);

  const openAction = (id: number, type: 'resolve' | 'reject') => {
    setActionId(id);
    setActionType(type);
    setNote('');
  };

  const handleAction = async () => {
    if (!actionId || !actionType) return;
    await api.put(`/admin/reports/${actionId}/${actionType}`, { adminNote: note });
    setActionId(null);
    setActionType(null);
    fetchReports(filter || undefined);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">신고 관리</h1>
        <div className="flex gap-2">
          {(['', 'PENDING', 'RESOLVED', 'REJECTED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                filter === s
                  ? 'bg-[#003478] text-white border-[#003478]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-[#003478]'
              }`}
            >
              {s === '' ? '전체' : STATUS_LABEL[s as ReportStatus]}
            </button>
          ))}
        </div>
      </div>

      {/* 처리 모달 */}
      {actionId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="font-bold text-gray-900 mb-3">
              {actionType === 'resolve' ? '신고 처리 (해결)' : '신고 기각'}
            </h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="관리자 메모 (선택)"
              rows={3}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] resize-none mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setActionId(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50">
                취소
              </button>
              <button
                onClick={handleAction}
                className={`px-4 py-2 text-sm rounded-xl font-semibold text-white ${
                  actionType === 'resolve' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 hover:bg-gray-600'
                }`}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center text-gray-400">
          신고 내역이 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">신고자</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">유형</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">대상 ID</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">사유</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">상태</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">일시</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.reporterNickname}</td>
                  <td className="px-4 py-3 text-gray-500">{TYPE_LABEL[r.type]}</td>
                  <td className="px-4 py-3 text-gray-500">#{r.targetId}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLOR[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'PENDING' && (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openAction(r.id, 'resolve')} className="text-xs text-green-600 hover:underline">처리</button>
                        <button onClick={() => openAction(r.id, 'reject')} className="text-xs text-gray-400 hover:underline">기각</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
