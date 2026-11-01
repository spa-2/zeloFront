import { NavLink } from 'react-router-dom';

// MY 화면들 위에 같이 붙이는 탭. 배송지 화면이 생기면 여기에 추가
const TABS = [
    { to: '/orders', label: '주문 내역' },
    { to: '/payment-methods', label: '결제 수단' },
    { to: '/addresses', label: '배송지' },
];

export default function MyTabs() {
    return (
        <nav className="flex flex-wrap gap-2" aria-label="MY 메뉴">
            {TABS.map((tab) => (
                <NavLink
                    key={tab.to}
                    to={tab.to}
                    className={({ isActive }) =>
                        `rounded-full border-2 border-zelo-green px-4 py-1.5 text-sm font-medium ${
                            isActive ? 'bg-zelo-green text-zelo-ivory' : 'text-zelo-green hover:bg-zelo-card'
                        }`
                    }
                >
                    {tab.label}
                </NavLink>
            ))}
        </nav>
    );
}