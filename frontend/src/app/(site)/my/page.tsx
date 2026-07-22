'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Post {
  id: number;
  title: string;
  categoryName: string;
  viewCount: number;
  commentCount: number;
  createdAt: string;
}

type Tab = 'info' | 'posts' | 'password';

export default function MyPage() {
  const router = useRouter();
  const { user, isLoggedIn, hydrated, setUser } = useAuthStore();
  const [tab, setTab] = useState<Tab>('info');
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // 프로필 수정
  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [nicknameMsg, setNicknameMsg] = useState('');
  const [nicknameLoading, setNicknameLoading] = useState(false);

  // 비밀번호 변경
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

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
    { key: 'posts', label: '내가 쓴 글' },
    { key: 'password', label: '비밀번호 변경' },
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
                {user?.role === 'SUPER_ADMIN' ? '최고관리자' : user?.role === 'ADMIN' ? '관리자' : '일반회원'}
              </span>
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 mb-5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-[#003478] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
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

        {/* 비밀번호 변경 */}
        {tab === 'password' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-5">비밀번호 변경</h2>
            <form onSubmit={handlePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">현재 비밀번호</label>
                <input
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  placeholder="현재 비밀번호"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">새 비밀번호</label>
                <input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  placeholder="8자 이상, 대소문자·숫자·특수문자(@$!%*?&) 포함"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">새 비밀번호 확인</label>
                <input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  placeholder="새 비밀번호 재입력"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                  required
                />
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
