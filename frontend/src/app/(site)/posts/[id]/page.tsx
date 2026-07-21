'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  authorNickname: string;
  categoryName: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  createdAt: string;
}

interface Comment {
  id: number;
  content: string;
  authorNickname: string;
  authorId: number;
  parentId: number | null;
  children?: Comment[];
  createdAt: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function CommentItem({
  comment,
  currentUserId,
  isAdmin,
  onReply,
  onDelete,
}: {
  comment: Comment;
  currentUserId?: number;
  isAdmin?: boolean;
  onReply: (id: number, nickname: string) => void;
  onDelete: (commentId: number) => void;
}) {
  const canDelete = currentUserId === comment.authorId || isAdmin;
  return (
    <div className={`${comment.parentId ? 'ml-8 bg-gray-50 rounded-xl px-4 py-3 mt-2' : 'py-4 border-b border-gray-50'}`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#003478] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
            {comment.authorNickname[0]}
          </div>
          <span className="text-sm font-semibold text-gray-900">{comment.authorNickname}</span>
          <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString('ko-KR')}</span>
        </div>
        {canDelete && (
          <button
            onClick={() => onDelete(comment.id)}
            className="text-xs text-gray-300 hover:text-red-400 transition shrink-0"
          >
            삭제
          </button>
        )}
      </div>
      <p className="text-sm text-gray-700 leading-relaxed ml-9 mb-1.5">{comment.content}</p>
      <button
        onClick={() => onReply(comment.id, comment.authorNickname)}
        className="ml-9 text-xs text-gray-400 hover:text-[#003478] transition font-medium"
      >
        답글 달기
      </button>
      {comment.children?.map((child) => (
        <CommentItem
          key={child.id}
          comment={child}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onReply={onReply}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isLoggedIn } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyNickname, setReplyNickname] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const fetchComments = async () => {
    const res = await api.get(`/posts/${id}/comments`);
    setComments(res.data.data.content ?? res.data.data);
  };

  useEffect(() => {
    Promise.all([
      api.get(`/posts/${id}`),
      api.get(`/posts/${id}/comments`),
    ]).then(([postRes, commentRes]) => {
      setPost(postRes.data.data);
      setLiked(postRes.data.data.liked);
      setLikeCount(postRes.data.data.likeCount);
      setComments(commentRes.data.data.content ?? commentRes.data.data);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!isLoggedIn) { router.push('/login'); return; }
    const res = await api.post(`/posts/${id}/like`);
    setLiked(res.data.data);
    setLikeCount((c) => res.data.data ? c + 1 : c - 1);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) { router.push('/login'); return; }
    await api.post(`/posts/${id}/comments`, { content: commentText, parentId: replyTo });
    setCommentText('');
    setReplyTo(null);
    setReplyNickname('');
    await fetchComments();
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!confirm('댓글을 삭제하시겠어요?')) return;
    await api.delete(`/posts/${id}/comments/${commentId}`);
    await fetchComments();
  };

  const handleDelete = async () => {
    if (!confirm('게시글을 삭제하시겠어요?')) return;
    await api.delete(`/posts/${id}`);
    router.push('/posts');
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/4" />
      </div>
    </div>
  );

  if (!post) return <div className="max-w-3xl mx-auto px-4 py-8 text-center text-gray-400">게시글을 찾을 수 없습니다.</div>;

  return (
    <div className="bg-[#f4f6f8] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link href="/posts" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#003478] transition mb-4">
          ← 목록으로
        </Link>

        <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-full font-medium">{post.categoryName}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-4">{post.title}</h1>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#003478] rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {post.authorNickname[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{post.authorNickname}</div>
                  <div className="text-xs text-gray-400">{formatDate(post.createdAt)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>조회 {post.viewCount}</span>
                {(user?.id === post.authorId || isAdmin) && (
                  <div className="flex gap-2 ml-2">
                    {user?.id === post.authorId && (
                      <Link href={`/posts/${id}/edit`} className="text-gray-400 hover:text-blue-600 transition">수정</Link>
                    )}
                    <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 transition">삭제</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="text-gray-800 leading-loose whitespace-pre-wrap text-sm min-h-[120px]">{post.content}</div>
          </div>

          <div className="px-6 pb-6 flex justify-center">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full border-2 text-sm font-semibold transition ${liked ? 'border-red-400 bg-red-50 text-red-500' : 'border-gray-200 text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-400'}`}
            >
              {liked ? '❤️' : '🤍'} 좋아요 {likeCount}
            </button>
          </div>
        </article>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">댓글 <span className="text-[#003478]">{comments.length}</span></h2>
          </div>

          <div className="divide-y divide-gray-50 px-6">
            {comments.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">첫 댓글을 작성해보세요 ✨</div>
            ) : (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={user?.id}
                  isAdmin={isAdmin}
                  onReply={(cid, nickname) => { setReplyTo(cid); setReplyNickname(nickname); }}
                  onDelete={handleCommentDelete}
                />
              ))
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            {isLoggedIn ? (
              <form onSubmit={handleComment}>
                {replyTo && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 mb-2 bg-blue-50 px-3 py-2 rounded-lg">
                    <span>↩ <strong>{replyNickname}</strong>님에게 답글</span>
                    <button type="button" onClick={() => { setReplyTo(null); setReplyNickname(''); }} className="ml-auto text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                )}
                <div className="flex gap-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                    rows={2}
                    className="flex-1 border border-gray-300 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] resize-none"
                    required
                  />
                  <button type="submit" className="bg-[#003478] text-white px-5 rounded-xl text-sm font-semibold hover:bg-blue-900 transition self-end py-2.5">
                    등록
                  </button>
                </div>
              </form>
            ) : (
              <Link href="/login" className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500 hover:text-[#003478] border border-dashed border-gray-300 rounded-xl transition">
                🔐 로그인 후 댓글을 작성할 수 있어요
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
