import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import { useAuthStore } from '../store/authStore';

const menus = [
  { to: '/chat', label: '장보기 채팅' },
  { to: '/products', label: '상품' },
  { to: '/orders', label: '주문 내역' },
];

export default function Layout() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const clear = useAuthStore((state) => state.clear);
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      // 서버 로그아웃이 실패해도 화면에선 로그아웃 처리
      clear();
      navigate('/login');
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <NavLink to="/" className="text-lg font-bold text-emerald-700">
            Zelo
          </NavLink>
          <nav className="flex gap-4 text-sm">
            {menus.map((menu) => (
              <NavLink
                key={menu.to}
                to={menu.to}
                className={({ isActive }) => (isActive ? 'font-semibold text-emerald-700' : 'text-stone-600')}
              >
                {menu.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto text-sm">
            {accessToken ? (
              <button type="button" onClick={handleLogout} className="text-stone-600 hover:text-stone-900">
                로그아웃
              </button>
            ) : (
              <NavLink to="/login" className="text-stone-600 hover:text-stone-900">
                로그인
              </NavLink>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
