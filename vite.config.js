import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// 로컬에선 /api를 백엔드로 넘겨서 같은 주소처럼 씀 (백엔드에 CORS 설정이 없고, 리프레시 쿠키도 그대로 붙음)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: env.VITE_API_PROXY_TARGET || 'http://localhost:8080', changeOrigin: true },
      },
    },
  };
});
