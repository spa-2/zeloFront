import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// 로그인 안 했으면 로그인 화면으로 보내고, 로그인 뒤에 원래 가려던 곳으로 돌아오게 함
// fromState: 원래 화면에 들고 가던 값 (메인에서 쓴 첫 메시지 등)
export default function RequireAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const restored = useAuthStore((state) => state.restored);
  const location = useLocation();
  // 새 탭에서는 토큰이 비어 있으니, 쿠키로 복구해 보기 전에 로그인으로 보내지 않음
  if (!accessToken && !restored) {
    return <p className="py-10 text-center text-zelo-sub">불러오는 중…</p>;
  }
  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname, fromState: location.state }} />;
  }
  return <Outlet />;
}
