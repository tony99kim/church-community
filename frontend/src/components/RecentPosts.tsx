'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Post {
  id: number;
  title: string;
  authorNickname: string;
  categoryName: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export default function RecentPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/posts', { params: { page: 0, size: 8 } })
      .then((res) => setPosts(res.data.data.content))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="font-bold text-gray-900">💬 최근 게시글</h2>
        <Link href="/posts" className="text-xs text-blue-600 hover:underline">전체보기</Link>
      </div>
      {loading ? (
        <div className="p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-sm">
          아직 게시글이 없어요.<br />
          <Link href="/posts/write" className="text-blue-600 hover:underline">첫 글을 작성해보세요!</Link>
        </div>
      ) : (
        <ul>
          {posts.map((post, i) => (
            <li key={post.id} className={i !== 0 ? 'border-t border-gray-50' : ''}>
              <Link href={`/posts/${post.id}`} className="flex items-center px-5 py-3 hover:bg-gray-50 transition gap-3">
                <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded shrink-0">{post.categoryName}</span>
                <span className="flex-1 text-sm text-gray-800 truncate">{post.title}</span>
                <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
                  <span>💬{post.commentCount}</span>
                  <span>👁{post.viewCount}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
