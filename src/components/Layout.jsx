import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import { useAuthStore } from '../store/authStore';

const menus = [
  { to: '/products', label: 'SHOP ALL' },
  { to: '/chat', label: 'AI 장보기' },
  { to: '/orders', label: '주문 내역' },
];

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
  const [keyword, setKeyword] = useState('');

  async function handleLogout() {
    try {
      await logout();
    } finally {
      // 서버 로그아웃이 실패해도 화면에선 로그아웃 처리
      clear();
      navigate('/login');
    }
  }

  function search(event) {
    event.preventDefault();
    const value = keyword.trim();
    navigate(value ? `/products?keyword=${encodeURIComponent(value)}` : '/products');
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
          <form onSubmit={search} className="min-w-0 flex-1">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="상품명이나 브랜드로 찾기"
              aria-label="상품 검색"
              className="w-full rounded-full border-2 border-current bg-transparent px-3.5 py-2 text-sm outline-none placeholder:text-current placeholder:opacity-60"
            />
          </form>
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
