import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// 백엔드 응답은 { success, code, message, data } 모양이라 화면에선 data만 꺼내 씀
export const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  // 리프레시 토큰 쿠키를 같이 보내야 재발급이 됨
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// 401이 동시에 여러 개 와도 재발급은 한 번만 하고 나머지는 그 결과를 기다림
let reissuing = null;

function reissue() {
  if (!reissuing) {
    reissuing = axios
      .post(`${client.defaults.baseURL}/api/auth/reissue`, null, { withCredentials: true })
      .then((res) => {
        const token = res.data.data.accessToken;
        useAuthStore.getState().setAccessToken(token);
        return token;
      })
      .finally(() => {
        reissuing = null;
      });
  }
  return reissuing;
}

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthCall = original?.url?.startsWith('/api/auth/') || original?.url === '/api/users/login';
    if (error.response?.status !== 401 || original._retried || isAuthCall) {
      return Promise.reject(error);
    }
    original._retried = true;
    try {
      const token = await reissue();
      original.headers.Authorization = `Bearer ${token}`;
      return client(original);
    } catch (e) {
      // 리프레시도 만료면 로그인부터 다시
      useAuthStore.getState().clear();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(e);
    }
  },
);

// 실패 응답의 message를 화면에 보여줄 때 씀
export function errorMessage(error, fallback = '잠시 후 다시 시도해 주세요') {
  return error?.response?.data?.message || fallback;
}
