'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { SpaceRental, ItemRental, FaithQuestion, PrayerRequest, WelcomeKit } from '@/types';

interface Post {
  id: number;
  title: string;
  categoryName: string;
  viewCount: number;
  commentCount: number;
  createdAt: string;
}

type Tab = 'info' | 'posts' | 'password' | 'spaceRentals' | 'itemRentals' | 'faithQuestions' | 'prayers' | 'welcomeKits';

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: '최고관리자',
  CHURCH_MANAGER: '교회관리자',
  PASTOR: '목사/전도사',
  USER: '일반회원',
};

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

const STATUS_LABEL: Record<string, string> = { PENDING: '대기중', APPROVED: '승인', REJECTED: '거절', CANCELLED: '취소' };
const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-600',
  APPROVED: 'bg-green-50 text-green-600',
  REJECTED: 'bg-red-50 text-red-500',
  CANCELLED: 'bg-gray-100 text-gray-400',
};

export default function MyPage() {
  const router = useRouter();
  const { user, isLoggedIn, hydrated, setUser } = useAuthStore();
  const [tab, setTab] = useState<Tab>('info');
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [spaceRentals, setSpaceRentals] = useState<SpaceRental[]>([]);
  const [spaceRentalsLoading, setSpaceRentalsLoading] = useState(false);
  const [itemRentals, setItemRentals] = useState<ItemRental[]>([]);
  const [itemRentalsLoading, setItemRentalsLoading] = useState(false);
  const [faithQuestions, setFaithQuestions] = useState<FaithQuestion[]>([]);
  const [faithQuestionsLoading, setFaithQuestionsLoading] = useState(false);
  const [myPrayers, setMyPrayers] = useState<PrayerRequest[]>([]);
  const [prayersLoading, setPrayersLoading] = useState(false);
  const [welcomeKits, setWelcomeKits] = useState<WelcomeKit[]>([]);
  const [welcomeKitsLoading, setWelcomeKitsLoading] = useState(false);

  // 프로필 수정
  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [nicknameMsg, setNicknameMsg] = useState('');
  const [nicknameLoading, setNicknameLoading] = useState(false);

  // 비밀번호 변경
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn) { router.replace('/login'); return; }
    setNickname(user?.nickname || '');
    setName((user as { name?: string })?.name || '');
  }, [hydrated, isLoggedIn, user]);

  useEffect(() => {
    if (tab === 'posts' && user) {
      setPostsLoading(true);
      api.get(`/users/${user.id}/posts`, { params: { page: 0, size: 20, sort: 'createdAt,desc' } })
        .then((res) => setPosts(res.data.data.content))
        .finally(() => setPostsLoading(false));
    }
    if (tab === 'spaceRentals') {
      setSpaceRentalsLoading(true);
      api.get('/spaces/rentals/my')
        .then((res) => setSpaceRentals(res.data.data ?? []))
        .finally(() => setSpaceRentalsLoading(false));
    }
    if (tab === 'itemRentals') {
      setItemRentalsLoading(true);
      api.get('/items/rentals/my')
        .then((res) => setItemRentals(res.data.data ?? []))
        .finally(() => setItemRentalsLoading(false));
    }
    if (tab === 'faithQuestions') {
      setFaithQuestionsLoading(true);
      api.get('/faith/questions/my')
        .then((res) => setFaithQuestions(res.data.data ?? []))
        .finally(() => setFaithQuestionsLoading(false));
    }
    if (tab === 'prayers') {
      setPrayersLoading(true);
      api.get('/faith/prayers/my')
        .then((res) => setMyPrayers(res.data.data ?? []))
        .finally(() => setPrayersLoading(false));
    }
    if (tab === 'welcomeKits') {
      setWelcomeKitsLoading(true);
      api.get('/welcome/kits/my')
        .then((res) => setWelcomeKits(res.data.data ?? []))
        .finally(() => setWelcomeKitsLoading(false));
    }
  }, [tab, user]);

  const handleNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    setNicknameLoading(true);
    setNicknameMsg('');
    try {
      const res = await api.put('/users/me', { nickname, name });
      setUser({ ...user!, nickname: res.data.data.nickname });
      setNicknameMsg('✅ 정보가 변경되었습니다.');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setNicknameMsg(e.response?.data?.message || '변경에 실패했습니다.');
    } finally {
      setNicknameLoading(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    setPwLoading(true);
    setPwMsg('');
    try {
      await api.put('/users/me/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg('✅ 비밀번호가 변경되었습니다.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setPwMsg(e.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setPwLoading(false);
    }
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'info', label: '내 정보' },
    { key: 'posts', label: '작성글' },
    { key: 'spaceRentals', label: '공간 신청' },
    { key: 'itemRentals', label: '물품 신청' },
    { key: 'welcomeKits', label: '웰컴키트' },
    { key: 'faithQuestions', label: '신앙 질문' },
    { key: 'prayers', label: '기도 요청' },
    { key: 'password', label: '비밀번호' },
  ];

  return (
    <div className="bg-[#f4f6f8] min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 프로필 헤더 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5 flex items-center gap-4">
          <div className="w-16 h-16 bg-[#003478] rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {user?.nickname?.[0]}
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{user?.nickname}</div>
            <div className="text-sm text-gray-500">{user?.email}</div>
            <div className="text-xs mt-1">
              <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                {ROLE_LABEL[user?.role ?? ''] ?? '일반회원'}
              </span>
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex flex-wrap gap-1 bg-white rounded-xl border border-gray-200 p-1 mb-5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 min-w-[80px] py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-[#003478] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 내 정보 */}
        {tab === 'info' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-5">내 정보 수정</h2>
            <form onSubmit={handleNickname} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">이름</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="실명"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                />
                <p className="text-xs text-gray-400 mt-1">행사 참여 명단 등 관리 목적으로만 사용됩니다.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">닉네임</label>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">게시글, 댓글 등 모든 활동에 닉네임으로 표시됩니다.</p>
              </div>
              {nicknameMsg && (
                <p className={`text-sm ${nicknameMsg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{nicknameMsg}</p>
              )}
              <button
                type="submit"
                disabled={nicknameLoading}
                className="w-full bg-[#003478] text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-900 disabled:opacity-50 transition"
              >
                {nicknameLoading ? '저장 중...' : '저장'}
              </button>
            </form>
          </div>
        )}

        {/* 내가 쓴 글 */}
        {tab === 'posts' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">내가 쓴 글 <span className="text-[#003478]">{posts.length}</span></h2>
            </div>
            {postsLoading ? (
              <div className="p-8 text-center text-gray-400">불러오는 중...</div>
            ) : posts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-gray-400 text-sm">작성한 게시글이 없습니다.</p>
                <Link href="/posts/write" className="inline-block mt-4 text-[#003478] text-sm font-medium hover:underline">
                  첫 글 작성하기 →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {posts.map((post) => (
                  <li key={post.id}>
                    <Link href={`/posts/${post.id}`} className="flex items-center px-6 py-3.5 hover:bg-gray-50 transition">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full shrink-0">{post.categoryName}</span>
                          <span className="text-sm font-medium text-gray-900 truncate">{post.title}</span>
                          {post.commentCount > 0 && (
                            <span className="text-xs text-red-400 shrink-0">[{post.commentCount}]</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(post.createdAt).toLocaleDateString('ko-KR')} · 조회 {post.viewCount}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 공간 신청 내역 */}
        {tab === 'spaceRentals' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">공간 신청 내역</h2>
            </div>
            {spaceRentalsLoading ? (
              <div className="p-8 text-center text-gray-400">불러오는 중...</div>
            ) : spaceRentals.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-400 text-sm">신청한 공간 대여가 없습니다.</p>
                <Link href="/spaces" className="inline-block mt-4 text-[#003478] text-sm font-medium hover:underline">
                  공간 예약하러 가기 →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {spaceRentals.map((r) => (
                  <li key={r.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[r.status]}`}>
                            {STATUS_LABEL[r.status]}
                          </span>
                          <span className="text-sm font-medium text-gray-900 truncate">{r.spaceName}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {r.startDateTime.slice(0, 10)} {r.startDateTime.slice(11, 16)} ~ {r.endDateTime.slice(11, 16)}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">목적: {r.purpose}</div>
                        {r.rejectReason && (
                          <div className="text-xs text-red-400 mt-0.5">거절 사유: {r.rejectReason}</div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 shrink-0">
                        {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 물품 신청 내역 */}
        {tab === 'itemRentals' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">물품 신청 내역</h2>
            </div>
            {itemRentalsLoading ? (
              <div className="p-8 text-center text-gray-400">불러오는 중...</div>
            ) : itemRentals.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">📦</div>
                <p className="text-gray-400 text-sm">신청한 물품 대여가 없습니다.</p>
                <Link href="/items" className="inline-block mt-4 text-[#003478] text-sm font-medium hover:underline">
                  물품 대여 신청하러 가기 →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {itemRentals.map((r) => (
                  <li key={r.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[r.status]}`}>
                            {STATUS_LABEL[r.status]}
                          </span>
                          <span className="text-sm font-medium text-gray-900 truncate">{r.itemName}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {r.startDate} ~ {r.endDate} · {r.quantity}개
                        </div>
                        {r.purpose && <div className="text-xs text-gray-400 mt-0.5">목적: {r.purpose}</div>}
                        {r.rejectReason && (
                          <div className="text-xs text-red-400 mt-0.5">거절 사유: {r.rejectReason}</div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 shrink-0">
                        {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 웰컴키트 신청 내역 */}
        {tab === 'welcomeKits' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">웰컴키트 신청 내역</h2>
            </div>
            {welcomeKitsLoading ? (
              <div className="p-8 text-center text-gray-400">불러오는 중...</div>
            ) : welcomeKits.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">🎁</div>
                <p className="text-gray-400 text-sm">웰컴키트 신청 내역이 없습니다.</p>
                <Link href="/welcome" className="inline-block mt-4 text-[#003478] text-sm font-medium hover:underline">
                  웰컴키트 신청하러 가기 →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {welcomeKits.map((kit) => (
                  <li key={kit.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${kit.processed ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                            {kit.processed ? '처리 완료' : '처리 중'}
                          </span>
                          <span className="text-xs text-gray-400">{new Date(kit.createdAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                        {kit.address && <div className="text-xs text-gray-500">📍 {kit.address}</div>}
                        {kit.message && <div className="text-xs text-gray-400 mt-0.5 italic">"{kit.message}"</div>}
                        {kit.adminMessage && (
                          <div className="mt-2 bg-blue-50 rounded-lg px-3 py-2">
                            <div className="text-xs text-[#003478] font-semibold mb-0.5">담당자 메시지</div>
                            <p className="text-sm text-gray-700">{kit.adminMessage}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 신앙 질문 내역 */}
        {tab === 'faithQuestions' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">내 신앙 질문</h2>
            </div>
            {faithQuestionsLoading ? (
              <div className="p-8 text-center text-gray-400">불러오는 중...</div>
            ) : faithQuestions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">✝️</div>
                <p className="text-gray-400 text-sm">남긴 신앙 질문이 없습니다.</p>
                <Link href="/faith" className="inline-block mt-4 text-[#003478] text-sm font-medium hover:underline">
                  신앙 Q&A 바로가기 →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {faithQuestions.map((q) => (
                  <li key={q.id} className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-1 text-xs text-gray-400">
                      <span>{q.anonymous ? '익명' : '실명'}</span>
                      <span>·</span>
                      <span>{new Date(q.createdAt).toLocaleDateString('ko-KR')}</span>
                      {q.answers.length > 0 && (
                        <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px]">답변 {q.answers.length}개</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 mb-2">{q.content}</p>
                    {q.answers.map(a => (
                      <div key={a.id} className="bg-blue-50 rounded-lg p-3 mt-1">
                        <div className="text-xs text-[#003478] font-medium mb-1">목사님 답변 — {a.pastorNickname}</div>
                        <p className="text-sm text-gray-700">{a.content}</p>
                      </div>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 기도 요청 내역 */}
        {tab === 'prayers' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">내 기도 요청</h2>
            </div>
            {prayersLoading ? (
              <div className="p-8 text-center text-gray-400">불러오는 중...</div>
            ) : myPrayers.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">🙏</div>
                <p className="text-gray-400 text-sm">남긴 기도 요청이 없습니다.</p>
                <Link href="/faith" className="inline-block mt-4 text-[#003478] text-sm font-medium hover:underline">
                  기도 요청하러 가기 →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {myPrayers.map((p) => (
                  <li key={p.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 text-xs text-gray-400">
                          <span>{p.publicVisible ? '공개' : '나만 보기'}</span>
                          <span>·</span>
                          <span>{new Date(p.createdAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                        <p className="text-sm text-gray-800">{p.content}</p>
                      </div>
                      <div className="text-xs text-gray-400 shrink-0">🙏 {p.prayerCount}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 비밀번호 변경 */}
        {tab === 'password' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-5">비밀번호 변경</h2>
            <form onSubmit={handlePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">현재 비밀번호</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    placeholder="현재 비밀번호"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                    required
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                    <EyeIcon open={showCurrent} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">새 비밀번호</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    placeholder="8자 이상, 대소문자·숫자·특수문자(@$!%*?&) 포함"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                    required
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                    <EyeIcon open={showNew} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">새 비밀번호 확인</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    placeholder="새 비밀번호 재입력"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
              </div>
              {pwMsg && (
                <p className={`text-sm ${pwMsg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{pwMsg}</p>
              )}
              <button
                type="submit"
                disabled={pwLoading}
                className="w-full bg-[#003478] text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-900 disabled:opacity-50 transition"
              >
                {pwLoading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
