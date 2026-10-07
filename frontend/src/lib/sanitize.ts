import DOMPurify from 'dompurify';

// DOMPurify는 브라우저 DOM이 필요함. 서버 렌더 중에는 정화할 수 없으므로 원본 대신 빈 문자열을 돌려줌
// (원본을 그대로 내보내면 SSR로 바뀌는 순간 XSS가 됨). 클라이언트에서 다시 렌더될 때 정화된 내용이 채워짐.
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') return '';
  return DOMPurify.sanitize(dirty);
}
