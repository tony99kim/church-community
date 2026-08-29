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
