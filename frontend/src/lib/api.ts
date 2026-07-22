import axios from 'axios';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://churchhub-backend.fly.dev/api/v1').trim();

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

function getToken(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function setToken(key: string, value: string) {
  // 이미 어느 storage에 저장됐는지 따라 같은 곳에 갱신
  if (typeof window === 'undefined') return;
  if (localStorage.getItem('accessToken') !== null || key === 'accessToken' && localStorage.getItem(key) !== null) {
    localStorage.setItem(key, value);
  } else if (sessionStorage.getItem('accessToken') !== null) {
    sessionStorage.setItem(key, value);
  } else {
    localStorage.setItem(key, value);
  }
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
}

export function saveTokens(accessToken: string, refreshToken: string, remember: boolean) {
  const storage = remember ? localStorage : sessionStorage;
  // 반대쪽 지우기
  if (remember) {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
  } else {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
  storage.setItem('accessToken', accessToken);
  storage.setItem('refreshToken', refreshToken);
}

api.interceptors.request.use((config) => {
  const token = getToken('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = getToken('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefresh } = res.data.data;
          const inLocal = localStorage.getItem('refreshToken') !== null;
          saveTokens(accessToken, newRefresh, inLocal);
          original.headers.Authorization = `Bearer ${accessToken}`;
          return api(original);
        } catch {
          clearTokens();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
