import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE } from '@/lib/config';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

// 동시에 여러 요청이 401을 받아도 토큰 재발급은 한 번만 호출
let refreshing: Promise<void> | null = null;
function refreshOnce(): Promise<void> {
  if (!refreshing) {
    refreshing = axios
      .post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
      .then(() => undefined)
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    if (!original) return Promise.reject(error);

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      // /users/me는 초기 인증 확인용이므로 실패해도 리다이렉트 안 함 (Providers.tsx가 clearAuth 처리)
      const isAuthCheck = original.url?.includes('/users/me');
      const alreadyOnAuth = typeof window !== 'undefined' &&
        ['/login', '/register'].some(p => window.location.pathname.startsWith(p));
      if (isAuthCheck || alreadyOnAuth) return Promise.reject(error);
      try {
        await refreshOnce();
        return api(original);
      } catch {
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // 서버 콜드 스타트 대비 재시도는 조회(GET)만. POST 등을 재시도하면 글·신청이 중복 생성될 수 있음
    const status = error.response?.status;
    const isRetryable = (original.method ?? 'get').toLowerCase() === 'get'
      && (!error.response || (status !== undefined && status >= 500 && status !== 501));
    const retryCount = original._retryCount ?? 0;
    if (isRetryable && retryCount < 2) {
      original._retryCount = retryCount + 1;
      await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
      return api(original);
    }

    return Promise.reject(error);
  }
);

export default api;
