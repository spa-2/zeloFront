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

// 서버가 응답을 안 주면 앱 시작 복구가 끝나지 않아 로그인 필요 화면이 계속 로딩에 멈춤
const REISSUE_TIMEOUT_MS = 5000;

// 401이 동시에 여러 개 와도 재발급은 한 번만 하고 나머지는 그 결과를 기다림
// 토큰 저장은 부르는 쪽이 정함: 복구는 그 사이 로그인했다면 저장하면 안 됨
let reissuing = null;

function reissue() {
  if (!reissuing) {
    reissuing = axios
      .post(`${client.defaults.baseURL}/api/auth/reissue`, null, {
        withCredentials: true,
        timeout: REISSUE_TIMEOUT_MS,
      })
      .then((res) => res.data.data.accessToken)
      .finally(() => {
        reissuing = null;
      });
  }
  return reissuing;
}

// 앱을 켤 때 한 번 부름. 토큰이 없으면(새 탭, 창을 닫았다 다시 연 경우) 리프레시 쿠키로 재발급을 시도해 로그인을 이어 줌
// 쿠키가 없거나 만료거나 시간이 초과되면 실패하는데, 그건 그냥 로그인 안 한 상태라서 조용히 넘어감
let restoring = null;

export function restoreSession() {
  if (!restoring) {
    const start = useAuthStore.getState().accessToken
      ? Promise.resolve()
      : reissue()
          .then((token) => {
            // 응답을 기다리는 사이 로그인했다면 쿠키에 남은 이전 로그인의 토큰으로 덮어쓰지 않음
            if (!useAuthStore.getState().accessToken) {
              useAuthStore.getState().setAccessToken(token);
            }
          })
          .catch(() => {});
    restoring = start.finally(() => useAuthStore.getState().setRestored());
  }
  return restoring;
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
      useAuthStore.getState().setAccessToken(token);
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
