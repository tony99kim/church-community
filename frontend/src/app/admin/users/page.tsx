'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/Toast';

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
  PASTOR: '목사/전도사',
  SUPER_ADMIN: '최고관리자',
};

const ROLES_INFO = [
  {
    key: 'USER',
    label: '일반',
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    dot: 'bg-gray-400',
    desc: '일반 회원',
    permissions: ['게시글 작성 및 댓글', '공간·물품 대여 신청', '행사 참여 신청', '신앙 Q&A 열람 및 기도 요청'],
  },
  {
    key: 'CHURCH_MANAGER',
    label: '교회관리자',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500',
    desc: '특정 교회 소속 관리자',
    permissions: ['일반 회원의 모든 권한', '소속 교회 공간·물품 관리', '소속 교회 행사 등록·관리', '대여 신청 승인/거절', '웰컴키트 신청 관리'],
  },
  {
    key: 'PASTOR',
    label: '목사/전도사',
    color: 'text-violet-700 bg-violet-50 border-violet-200',
    dot: 'bg-violet-500',
    desc: '목사·전도사·사역자',
    permissions: ['일반 회원의 모든 권한', '신앙 질문 답변 작성', '기도 요청 완료 처리', '소속 교회 공간·물품 관리', '웰컴키트 신청 관리'],
  },
  {
    key: 'SUPER_ADMIN',
    label: '최고관리자',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    dot: 'bg-[#003478]',
    desc: '전체 시스템 관리자',
    permissions: ['모든 권한', '회원 상태·역할 변경', '교회·카테고리·공간·물품 전체 관리', '웰컴키트 및 모든 신청 관리'],
  },
];

function RoleGuideTooltip() {
  return (
    <div className="group/guide relative inline-flex items-center">
      <button
        type="button"
        className="w-5 h-5 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-400 hover:text-[#003478] text-[11px] font-bold flex items-center justify-center transition-colors"
        tabIndex={-1}
      >
        ?
      </button>
      <div className="hidden group-hover/guide:block absolute left-0 top-full mt-2 z-50 w-[480px]">
        <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-2xl">
          <p className="text-xs font-semibold text-gray-300 mb-3">권한별 역할 안내</p>
          <div className="grid grid-cols-2 gap-3">
            {ROLES_INFO.map((r) => (
              <div key={r.key} className="bg-gray-800 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${r.dot}`} />
                  <span className="text-xs font-semibold text-white">{r.label}</span>
                  <span className="text-[10px] text-gray-400">— {r.desc}</span>
                </div>
                <ul className="space-y-1">
                  {r.permissions.map((p) => (
                    <li key={p} className="text-[11px] text-gray-300 flex items-start gap-1.5">
                      <span className="text-blue-400 shrink-0 mt-0.5">·</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [error, setError] = useState<string | null>(null);
  const [churches, setChurches] = useState<{ id: number; name: string }[]>([]);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: number } | null>(null);
  const [selectedChurchId, setSelectedChurchId] = useState('');

  // 검색/필터
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const fetchUsers = (p = 0, keyword = activeSearch) => {
    setLoading(true);
    setError(null);
    const params: Record<string, unknown> = { page: p, size: 15, sort: 'createdAt,desc' };
    if (keyword) params.search = keyword;
    api.get('/admin/users', { params })
      .then((res) => {
        setUsers(res.data.data.content);
        setTotalPages(res.data.data.totalPages);
      })
      .catch(() => setError('회원 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers(0);
    api.get('/churches').then(r => setChurches(r.data.data ?? []));
  }, []);

  useEffect(() => { fetchUsers(page, activeSearch); }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setActiveSearch(searchInput);
    fetchUsers(0, searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setActiveSearch('');
    setPage(0);
    fetchUsers(0, '');
  };

  const handleStatusToggle = async (u: User) => {
    const newStatus = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const action = newStatus === 'SUSPENDED' ? '정지' : '활성화';
    if (!confirm(`${u.nickname}님을 ${action}하시겠어요?`)) return;
    try {
      await api.put(`/admin/users/${u.id}/status`, { status: newStatus });
      fetchUsers(page);
      toast(`${u.nickname}님을 ${action}했습니다`);
    } catch { toast('변경에 실패했습니다', 'error'); }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`⚠️ ${u.nickname}님을 완전히 삭제하시겠어요?\n\n개인정보가 익명화되며 복구할 수 없습니다.`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      fetchUsers(page);
      toast('삭제되었습니다');
    } catch { toast('삭제에 실패했습니다', 'error'); }
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
      toast('권한이 변경되었습니다');
    } catch { toast('권한 변경에 실패했습니다', 'error'); }
  };

  const confirmChurchManagerAssign = async () => {
    if (!pendingRoleChange || !selectedChurchId) return;
    try {
      await api.put(`/admin/users/${pendingRoleChange.userId}/role`, { role: 'CHURCH_MANAGER', churchId: Number(selectedChurchId) });
      setPendingRoleChange(null);
      fetchUsers(page);
      toast('권한이 변경되었습니다');
    } catch { toast('권한 변경에 실패했습니다', 'error'); }
  };

  const isSuperAdmin = me?.role === 'SUPER_ADMIN';

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm text-gray-500">회원 목록을 조회하고 상태를 관리할 수 있습니다</p>
          <RoleGuideTooltip />
        </div>
      </div>

      {/* 검색 */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="닉네임 또는 이메일로 검색"
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
        />
        <button
          type="submit"
          className="bg-[#003478] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-900 transition"
        >
          검색
        </button>
        {activeSearch && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="border border-gray-300 text-gray-600 px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition"
          >
            초기화
          </button>
        )}
      </form>
      {activeSearch && (
        <p className="text-xs text-gray-400 mb-3">
          &quot;{activeSearch}&quot; 검색 결과 — {users.length}명
        </p>
      )}

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
        ) : error ? (
          <div className="p-12 text-center text-red-400 text-sm">{error}</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            {activeSearch ? `"${activeSearch}"에 해당하는 회원이 없습니다.` : '회원이 없습니다.'}
          </div>
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
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
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
              <button type="button" onClick={() => setPendingRoleChange(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50">취소</button>
              <button type="button" onClick={confirmChurchManagerAssign} disabled={!selectedChurchId} className="px-4 py-2 text-sm bg-[#003478] text-white rounded-xl font-semibold hover:bg-blue-900 disabled:opacity-50">지정</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
