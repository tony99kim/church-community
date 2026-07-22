'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/Sidebar';
import ReportModal from '@/components/ReportModal';
import type { Post, Comment } from '@/types';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function CommentItem({
  comment, currentUserId, isAdmin, onReply, onDelete, onEdit,
}: {
  comment: Comment;
  currentUserId?: number;
  isAdmin?: boolean;
  onReply: (id: number, nickname: string) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number, content: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const [reporting, setReporting] = useState(false);

  const canModify = !comment.deleted && currentUserId === comment.authorId;
  const canDelete = !comment.deleted && (currentUserId === comment.authorId || isAdmin);
  const canReport = !comment.deleted && !!currentUserId && currentUserId !== comment.authorId && !isAdmin;

  const handleSave = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    await onEdit(comment.id, editText);
    setEditing(false);
    setSaving(false);
  };

  return (
    <div className={comment.parentId ? 'ml-8 pl-4 border-l-2 border-[#EDEFF1] mt-2' : 'py-4 border-b border-[#EDEFF1] last:border-0'}>
      {comment.deleted ? (
        <p className="text-sm text-gray-400 italic">삭제된 댓글입니다.</p>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#003478] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                {comment.authorNickname?.[0] ?? '?'}
              </div>
              <span className="text-sm font-bold text-gray-900">{comment.authorNickname}</span>
              <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString('ko-KR')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {canModify && !editing && (
                <button onClick={() => { setEditText(comment.content); setEditing(true); }} className="text-gray-400 hover:text-[#003478]">수정</button>
              )}
              {canDelete && (
                <button onClick={() => onDelete(comment.id)} className="text-gray-400 hover:text-red-500">삭제</button>
              )}
              {canReport && (
                <button onClick={() => setReporting(true)} className="text-gray-300 hover:text-red-400">신고</button>
              )}
            </div>
            {reporting && (
              <ReportModal type="COMMENT" targetId={comment.id} onClose={() => setReporting(false)} />
            )}
          </div>

          {editing ? (
            <div className="ml-9 space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                className="w-full border border-[#EDEFF1] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditing(false)} className="text-xs text-gray-500 border border-[#EDEFF1] px-3 py-1.5 rounded-lg hover:bg-gray-50">취소</button>
                <button onClick={handleSave} disabled={saving} className="text-xs bg-[#003478] text-white px-3 py-1.5 rounded-lg hover:bg-[#002560] disabled:opacity-50">
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed ml-9 mb-1.5">{comment.content}</p>
          )}

          {!editing && (
            <button
              onClick={() => onReply(comment.id, comment.authorNickname ?? '')}
              className="ml-9 text-xs text-gray-400 hover:text-[#003478] font-medium transition"
            >
              답글
            </button>
          )}
        </>
      )}
      {comment.replies?.map((reply) => (
        <CommentItem key={reply.id} comment={reply} currentUserId={currentUserId} isAdmin={isAdmin} onReply={onReply} onDelete={onDelete} onEdit={onEdit} />
      ))}
    </div>
  );
}

export default function PostDetailClient() {
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
  const [submitting, setSubmitting] = useState(false);
  const [reportingPost, setReportingPost] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const fetchComments = async () => {
    const res = await api.get(`/posts/${id}/comments`);
    const data = res.data.data;
    setComments(Array.isArray(data) ? data : data.content ?? []);
  };

  useEffect(() => {
    Promise.all([api.get(`/posts/${id}`), api.get(`/posts/${id}/comments`)])
      .then(([postRes, commentRes]) => {
        setPost(postRes.data.data);
        setLiked(postRes.data.data.liked);
        setLikeCount(postRes.data.data.likeCount);
        const data = commentRes.data.data;
        setComments(Array.isArray(data) ? data : data.content ?? []);
      })
      .finally(() => setLoading(false));
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
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post(`/posts/${id}/comments`, { content: commentText, parentId: replyTo });
      setCommentText('');
      setReplyTo(null);
      setReplyNickname('');
      await fetchComments();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentEdit = async (commentId: number, content: string) => {
    await api.put(`/posts/${id}/comments/${commentId}`, { content });
    await fetchComments();
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!confirm('댓글을 삭제하시겠어요?')) return;
    try {
      await api.delete(`/posts/${id}/comments/${commentId}`);
      await fetchComments();
    } catch {
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  const handlePostDelete = async () => {
    if (!confirm('게시글을 삭제하시겠어요?')) return;
    try {
      await api.delete(`/posts/${id}`);
      router.push('/posts');
    } catch {
      alert('게시글 삭제에 실패했습니다.');
    }
  };

  if (loading) return (
    <div className="flex gap-6 max-w-6xl mx-auto px-4 py-5 animate-pulse">
      <div className="w-64 shrink-0 hidden lg:block"><div className="h-40 bg-gray-100 rounded-xl" /></div>
      <div className="flex-1 space-y-4">
        <div className="h-8 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/4" />
        <div className="h-48 bg-gray-100 rounded" />
      </div>
    </div>
  );

  if (!post) return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-400">게시글을 찾을 수 없습니다.</div>
  );

  return (
    <div className="flex gap-6 max-w-6xl mx-auto px-4 py-5">
      {reportingPost && post && (
        <ReportModal type="POST" targetId={post.id} onClose={() => setReportingPost(false)} />
      )}
      <Sidebar activeCategoryId={null} />

      <div className="flex-1 min-w-0">
        <Link href="/posts" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#003478] transition mb-3">
          ← 목록으로
        </Link>

        <article className="bg-white border border-[#EDEFF1] rounded-xl overflow-hidden mb-4">
          <div className="px-6 pt-6 pb-4 border-b border-[#EDEFF1]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs bg-blue-50 text-[#003478] border border-blue-100 px-2.5 py-1 rounded font-bold">
                {post.categoryName}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 leading-snug mb-4">{post.title}</h1>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#003478] rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {post.authorNickname?.[0]}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{post.authorNickname}</div>
                  <div className="text-xs text-gray-400">{formatDate(post.createdAt)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>👁 {post.viewCount}</span>
                <span>❤ {likeCount}</span>
                <span>💬 {comments.length}</span>
                {(user?.id === post.authorId || isAdmin) && (
                  <div className="flex gap-2 ml-1 pl-3 border-l border-[#EDEFF1]">
                    {user?.id === post.authorId && (
                      <Link href={`/posts/${id}/edit`} className="text-gray-400 hover:text-[#003478] transition">수정</Link>
                    )}
                    <button onClick={handlePostDelete} className="text-gray-400 hover:text-red-500 transition">삭제</button>
                  </div>
                )}
                {isLoggedIn && user?.id !== post.authorId && !isAdmin && (
                  <button onClick={() => setReportingPost(true)} className="text-gray-300 hover:text-red-400 transition ml-1">신고</button>
                )}
              </div>
            </div>
          </div>

          {post.thumbnailUrl && (
            <div className="px-6 pt-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.thumbnailUrl}
                alt="썸네일"
                className="w-full max-h-80 object-cover rounded-xl border border-gray-100"
              />
            </div>
          )}

          <div className="px-6 py-6">
            <div
              className="text-gray-800 leading-loose text-sm min-h-[120px] prose prose-sm max-w-none prose-img:rounded-xl prose-img:my-3"
              dangerouslySetInnerHTML={{ __html: post.content ?? '' }}
            />
          </div>

          <div className="px-6 pb-6 flex justify-center">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-6 py-2 rounded-full border-2 text-sm font-bold transition ${
                liked
                  ? 'border-red-400 bg-red-50 text-red-500'
                  : 'border-[#EDEFF1] text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-400'
              }`}
            >
              {liked ? '❤️' : '🤍'} 좋아요 {likeCount}
            </button>
          </div>
        </article>

        <div className="bg-white border border-[#EDEFF1] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EDEFF1]">
            <h2 className="font-bold text-gray-900 text-sm">댓글 <span className="text-[#003478]">{comments.length}</span></h2>
          </div>

          <div className="px-6">
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
                  onEdit={handleCommentEdit}
                />
              ))
            )}
          </div>

          <div className="px-6 py-4 border-t border-[#EDEFF1] bg-gray-50">
            {isLoggedIn ? (
              <form onSubmit={handleComment} className="space-y-2">
                {replyTo && (
                  <div className="flex items-center gap-2 text-xs text-[#003478] bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg">
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
                    className="flex-1 border border-[#EDEFF1] bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] resize-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#003478] text-white px-5 rounded-xl text-sm font-bold hover:bg-[#002560] transition self-end py-2.5 disabled:opacity-50"
                  >
                    {submitting ? '...' : '등록'}
                  </button>
                </div>
              </form>
            ) : (
              <Link href="/login" className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500 hover:text-[#003478] border border-dashed border-[#EDEFF1] rounded-xl transition">
                🔐 로그인 후 댓글을 작성할 수 있어요
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
