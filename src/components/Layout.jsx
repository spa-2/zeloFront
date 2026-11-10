import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import HeaderSearch from './product/HeaderSearch';
import { useAuthStore } from '../store/authStore';

const menus = [
  { to: '/products', label: 'SHOP ALL' },
  { to: '/chat', label: 'AI 장보기' },
];

// MY 탭에 속한 화면. 이 화면들에 있으면 헤더의 MY에 밑줄을 그음
const MY_PATHS = ['/orders', '/payment-methods', '/addresses'];

// 메인 첫 화면 위에서는 아이보리, 첫 화면을 지나거나 다른 화면이면 초록
function useSolidHeader(isHome) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!isHome) {
      return undefined;
    }
    const onScroll = () => setScrolled(scrollY > innerHeight * 0.4);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, [isHome]);
  return !isHome || scrolled;
}

export default function Layout() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const clear = useAuthStore((state) => state.clear);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const solid = useSolidHeader(isHome);
  const isMyPage = MY_PATHS.some((path) => pathname.startsWith(path));
  // 상품 목록 화면에는 큰 검색창이 따로 있어서 검색창이 두 개로 보이지 않게 헤더 검색창을 숨김
  const showHeaderSearch = pathname !== '/products';

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
      <header
        className={`sticky top-0 z-[5] border-b-[3px] border-zelo-green transition-colors duration-300 ${
          solid ? 'bg-zelo-green text-zelo-ivory' : 'bg-zelo-ivory text-zelo-green'
        }`}
      >
        <div className="mx-auto flex max-w-[1180px] items-center gap-[22px] px-6 py-3.5">
          <NavLink to="/" className="font-logo text-[28px] tracking-[.02em]">
            ZELO<span className="text-zelo-orange">.</span>
          </NavLink>
          <nav className="hidden gap-[22px] font-logo text-[13px] tracking-[.08em] md:flex">
            {menus.map((menu) => (
              <NavLink
                key={menu.to}
                to={menu.to}
                className={({ isActive }) =>
                  `border-b-2 pb-0.5 ${isActive ? 'border-zelo-orange' : 'border-transparent hover:border-zelo-orange'}`
                }
              >
                {menu.label}
              </NavLink>
            ))}
          </nav>
          {/* 검색창이 없을 때도 MY·로그인이 오른쪽 끝에 붙게 빈 칸을 둠 */}
          {showHeaderSearch ? <HeaderSearch /> : <div className="flex-1" />}
          <NavLink
            to="/orders"
            className={`border-b-2 pb-0.5 font-logo text-[13px] tracking-[.08em] ${
              isMyPage ? 'border-zelo-orange' : 'border-transparent hover:border-zelo-orange'
            }`}
          >
            MY
          </NavLink>
          {accessToken ? (
            <button type="button" onClick={handleLogout} className="text-sm font-medium">
              로그아웃
            </button>
          ) : (
            <NavLink to="/login" className="text-sm font-medium">
              로그인
            </NavLink>
          )}
        </div>
      </header>
      {isHome ? (
        <Outlet />
      ) : (
        <main className="mx-auto max-w-[1180px] px-6 py-8">
          <Outlet />
        </main>
      )}
    </div>
  );
}
