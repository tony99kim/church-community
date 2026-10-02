import axios from 'axios';

const BASE_URL = `${(process.env.NEXT_PUBLIC_API_URL || 'https://churchhub-backend.fly.dev').trim()}/api/v1`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      // /users/me는 초기 인증 확인용이므로 실패해도 리다이렉트 안 함 (Providers.tsx가 clearAuth 처리)
      const isAuthCheck = original.url?.includes('/users/me');
      const alreadyOnAuth = typeof window !== 'undefined' &&
        ['/login', '/register'].some(p => window.location.pathname.startsWith(p));
      if (isAuthCheck || alreadyOnAuth) return Promise.reject(error);
      try {
        await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        return api(original);
      } catch {
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const isRetryable = !error.response || (status >= 500 && status !== 501);
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
