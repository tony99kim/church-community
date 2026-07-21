'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface User {
  id: number;
  email: string;
  nickname: string;
  role: string;
  status: string;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  USER: '일반',
  ADMIN: '관리자',
  SUPER_ADMIN: '최고관리자',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: '활성', color: 'bg-green-100 text-green-700' },
  SUSPENDED: { label: '정지', color: 'bg-red-100 text-red-600' },
  WITHDRAWN: { label: '탈퇴', color: 'bg-gray-100 text-gray-500' },
};

export default function AdminUsersPage() {
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUsers = (p = 0) => {
    setLoading(true);
    api.get('/admin/users', { params: { page: p, size: 15, sort: 'createdAt,desc' } })
      .then((res) => {
        setUsers(res.data.data.content);
        setTotalPages(res.data.data.totalPages);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(page); }, [page]);

  const handleStatusToggle = async (u: User) => {
    const newStatus = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const action = newStatus === 'SUSPENDED' ? '정지' : '활성화';
    if (!confirm(`${u.nickname}님을 ${action}하시겠어요?`)) return;
    try {
      await api.put(`/admin/users/${u.id}/status`, { status: newStatus });
      fetchUsers(page);
    } catch {
      alert('변경에 실패했습니다.');
    }
  };

  const handleRoleChange = async (u: User, newRole: string) => {
    if (!confirm(`${u.nickname}님의 권한을 ${ROLE_LABELS[newRole]}(으)로 변경하시겠어요?`)) return;
    try {
      await api.put(`/admin/users/${u.id}/role`, { role: newRole });
      fetchUsers(page);
    } catch {
      alert('권한 변경에 실패했습니다. SUPER_ADMIN만 가능합니다.');
    }
  };

  const isSuperAdmin = me?.role === 'SUPER_ADMIN';

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
        <p className="text-sm text-gray-500 mt-1">회원 목록을 조회하고 상태를 관리할 수 있습니다</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-[1fr_1.2fr_80px_80px_120px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span>닉네임</span>
          <span>이메일</span>
          <span className="text-center">권한</span>
          <span className="text-center">상태</span>
          <span className="text-center">관리</span>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="px-6 py-4 flex gap-4 animate-pulse">
                <div className="h-4 bg-gray-100 rounded flex-1" />
                <div className="h-4 bg-gray-100 rounded w-40" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">회원이 없습니다.</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {users.map((u) => {
              const statusInfo = STATUS_LABELS[u.status] ?? { label: u.status, color: 'bg-gray-100 text-gray-500' };
              return (
                <li key={u.id} className="grid grid-cols-[1fr_1.2fr_80px_80px_120px] gap-4 px-6 py-4 items-center hover:bg-gray-50 transition">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{u.nickname}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{new Date(u.createdAt).toLocaleDateString('ko-KR')} 가입</div>
                  </div>
                  <div className="text-sm text-gray-600 truncate">{u.email}</div>
                  <div className="text-center">
                    {isSuperAdmin && u.id !== me?.id ? (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#003478]"
                      >
                        <option value="USER">일반</option>
                        <option value="ADMIN">관리자</option>
                        <option value="SUPER_ADMIN">최고관리자</option>
                      </select>
                    ) : (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{ROLE_LABELS[u.role] ?? u.role}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    {u.id !== me?.id && u.status !== 'WITHDRAWN' ? (
                      <button
                        onClick={() => handleStatusToggle(u)}
                        className={`text-xs border px-3 py-1.5 rounded-lg transition ${
                          u.status === 'ACTIVE'
                            ? 'text-red-500 border-red-200 hover:bg-red-50'
                            : 'text-green-600 border-green-200 hover:bg-green-50'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? '정지' : '활성화'}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">–</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-5">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          >
            ‹ 이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition ${page === i ? 'bg-[#003478] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          >
            다음 ›
          </button>
        </div>
      )}
    </div>
  );
}
