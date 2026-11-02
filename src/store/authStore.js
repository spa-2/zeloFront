import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// 액세스 토큰은 sessionStorage, 리프레시 토큰은 백엔드가 httpOnly 쿠키로 따로 관리함
export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      // 앱을 켠 뒤 로그인 상태 복구 시도가 끝났는지. 저장하지 않아서 새로고침해도 매번 false로 시작함
      restored: false,
      setAccessToken: (accessToken) => set({ accessToken }),
      setRestored: () => set({ restored: true }),
      clear: () => set({ accessToken: null }),
    }),
    {
      name: 'zelo-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ accessToken: state.accessToken }),
    },
  ),
);
