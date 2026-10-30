import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// 액세스 토큰은 sessionStorage, 리프레시 토큰은 백엔드가 httpOnly 쿠키로 따로 관리함
export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      setAccessToken: (accessToken) => set({ accessToken }),
      clear: () => set({ accessToken: null }),
    }),
    { name: 'zelo-auth', storage: createJSONStorage(() => sessionStorage) },
  ),
);
