// NEXT_PUBLIC_API_URL 은 백엔드 주소. 끝에 /api/v1 이 붙어 있어도 되고 없어도 됨.
const RAW_BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://churchhub-backend.fly.dev').trim();

/** 백엔드 origin (예: https://churchhub-backend.fly.dev). 소셜 로그인 시작 링크와 서버 측 fetch에 사용 */
export const BACKEND_ORIGIN = RAW_BACKEND_URL.replace(/\/+$/, '').replace(/\/api\/v1$/, '');

/**
 * 브라우저는 같은 도메인의 /api/v1 을 부르고 next.config.ts 의 rewrites 가 백엔드로 넘김.
 * 그래서 인증 쿠키가 프론트 도메인에 SameSite=Lax 로 저장되어 CSRF 가 막힘.
 * 서버(generateMetadata 등)에는 프록시가 없으므로 백엔드를 직접 부름.
 */
export const API_BASE = typeof window === 'undefined' ? `${BACKEND_ORIGIN}/api/v1` : '/api/v1';
