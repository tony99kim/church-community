'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface User {
  id: number;
  email: string;
  nickname: string;
  name?: string;
  role: string;
  status: string;
  createdAt: string;
  churchName?: string;
}

const ROLE_LABELS: Record<string, string> = {
  USER: '일반',
  CHURCH_MANAGER: '교회관리자',
  PASTOR: '목사',
  SUPER_ADMIN: '최고관리자',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: '활성', color: 'bg-green-100 text-green-700' },
  SUSPENDED: { label: '정지', color: 'bg-red-100 text-red-600' },
  DELETED: { label: '삭제됨', color: 'bg-gray-100 text-gray-500' },
};

export default function AdminUsersPage() {
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [churches, setChurches] = useState<{ id: number; name: string }[]>([]);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: number } | null>(null);
  const [selectedChurchId, setSelectedChurchId] = useState('');

  const fetchUsers = (p = 0) => {
    setLoading(true);
    api.get('/admin/users', { params: { page: p, size: 15, sort: 'createdAt,desc' } })
      .then((res) => {
        setUsers(res.data.data.content);
        setTotalPages(res.data.data.totalPages);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers(0);
    api.get('/churches').then(r => setChurches(r.data.data ?? []));
  }, []);

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

  const handleDelete = async (u: User) => {
    if (!confirm(`⚠️ ${u.nickname}님을 완전히 삭제하시겠어요?\n\n개인정보가 익명화되며 복구할 수 없습니다.\n(게시글·댓글은 "탈퇴회원" 이름으로 유지됩니다)`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      fetchUsers(page);
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const handleRoleChange = async (u: User, newRole: string) => {
    if (newRole === 'CHURCH_MANAGER') {
      setPendingRoleChange({ userId: u.id });
      setSelectedChurchId('');
      return;
    }
    if (!confirm(`${u.nickname}님의 권한을 ${ROLE_LABELS[newRole] ?? newRole}(으)로 변경하시겠어요?`)) return;
    try {
      await api.put(`/admin/users/${u.id}/role`, { role: newRole });
      fetchUsers(page);
    } catch {
      alert('권한 변경에 실패했습니다. SUPER_ADMIN만 가능합니다.');
    }
  };

  const confirmChurchManagerAssign = async () => {
    if (!pendingRoleChange || !selectedChurchId) return;
    try {
      await api.put(`/admin/users/${pendingRoleChange.userId}/role`, {
        role: 'CHURCH_MANAGER',
        churchId: Number(selectedChurchId),
      });
      setPendingRoleChange(null);
      fetchUsers(page);
    } catch {
      alert('권한 변경에 실패했습니다.');
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
        <div className="grid grid-cols-[1fr_1.2fr_80px_80px_180px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
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
                <li key={u.id} className="grid grid-cols-[1fr_1.2fr_80px_80px_180px] gap-4 px-6 py-4 items-center hover:bg-gray-50 transition">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{u.nickname}</div>
                    {u.name && u.name !== u.nickname && (
                      <div className="text-xs text-gray-500 mt-0.5">실명: {u.name}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-0.5">{new Date(u.createdAt).toLocaleDateString('ko-KR')} 가입</div>
                  </div>
                  <div className="text-sm text-gray-600 truncate">{u.email}</div>
                  <div className="text-center">
                    {isSuperAdmin && u.id !== me?.id ? (
                      <>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#003478]"
                        >
                          <option value="USER">일반</option>
                          <option value="CHURCH_MANAGER">교회관리자</option>
                          <option value="PASTOR">목사</option>
                          <option value="SUPER_ADMIN">최고관리자</option>
                        </select>
                        {u.churchName && (
                          <div className="text-xs text-gray-400 mt-0.5 text-center">{u.churchName}</div>
                        )}
                      </>
                    ) : (
                      <div className="text-center">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                        {u.churchName && (
                          <div className="text-xs text-gray-400 mt-0.5">{u.churchName}</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    {u.id !== me?.id && u.status !== 'DELETED' ? (
                      <button
                        onClick={() => handleStatusToggle(u)}
                        className={`text-xs border px-2.5 py-1.5 rounded-lg transition ${
                          u.status === 'ACTIVE'
                            ? 'text-red-500 border-red-200 hover:bg-red-50'
                            : 'text-green-600 border-green-200 hover:bg-green-50'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? '정지' : '활성화'}
                      </button>
                    ) : null}
                    {isSuperAdmin && u.id !== me?.id && (
                      <button
                        onClick={() => handleDelete(u)}
                        className="text-xs border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition"
                      >
                        삭제
                      </button>
                    )}
                    {u.id === me?.id && <span className="text-xs text-gray-300">–</span>}
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

      {pendingRoleChange && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="font-bold text-gray-900 mb-1">교회관리자 교회 지정</h2>
            <p className="text-sm text-gray-500 mb-4">이 회원이 관리할 교회를 선택해주세요.</p>
            <select
              value={selectedChurchId}
              onChange={e => setSelectedChurchId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] mb-4"
            >
              <option value="">교회 선택</option>
              {churches.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setPendingRoleChange(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50"
              >취소</button>
              <button
                type="button"
                onClick={confirmChurchManagerAssign}
                disabled={!selectedChurchId}
                className="px-4 py-2 text-sm bg-[#003478] text-white rounded-xl font-semibold hover:bg-blue-900 disabled:opacity-50"
              >지정</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
