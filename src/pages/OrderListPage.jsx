import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { getMyOrders } from '../api/orders';
import OrderStatusBadge from '../components/order/OrderStatusBadge';
import { formatDateTime, formatMoney } from '../components/order/orderFormat';

// 페이지 번호는 주소에 둬서 상세 갔다가 뒤로 와도 보던 페이지가 남음
export default function OrderListPage() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? 0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    getMyOrders({ page })
        .then((data) => {
          if (!ignore) {
            setResult(data);
            setError('');
          }
        })
        .catch((e) => !ignore && setError(errorMessage(e)));
    return () => {
      ignore = true;
    };
  }, [page]);

  function goToPage(nextPage) {
    setParams(nextPage > 0 ? { page: String(nextPage) } : {});
    window.scrollTo(0, 0);
  }

  return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="font-label text-xs tracking-[.2em] text-zelo-orange">MY ORDERS</p>
          <h1 className="font-display text-5xl text-zelo-green">주문 내역</h1>
        </div>

        {error && <p className="text-sm text-zelo-orange">{error}</p>}
        {!result && !error && <p className="text-zelo-sub">불러오는 중…</p>}
        {result && result.content.length === 0 && (
            <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-zelo-line py-16 text-center text-zelo-sub">
              <p>아직 주문 내역이 없어요</p>
              <Link
                  to="/chat"
                  className="inline-flex h-11 items-center rounded-full border-2 border-zelo-green px-5 font-medium text-zelo-green"
              >
                AI로 장보기
              </Link>
            </div>
        )}
        {result && result.content.length > 0 && (
            <ul className="flex flex-col gap-4">
              {result.content.map((order) => (
                  <li key={order.orderId}>
                    <Link
                        to={`/orders/${order.orderId}`}
                        className="flex flex-wrap items-center gap-4 rounded-3xl border-2 border-zelo-green bg-zelo-card px-6 py-5 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-sm text-zelo-sub">{formatDateTime(order.createdAt)}</span>
                        <span className="truncate text-lg font-bold">{order.orderName}</span>
                      </div>
                      <OrderStatusBadge status={order.status} />
                      <span className="font-logo text-2xl tracking-[.02em] text-zelo-green">{formatMoney(order.totalAmount)}</span>
                    </Link>
                  </li>
              ))}
            </ul>
        )}
        {result && result.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-4 font-medium">
              <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => goToPage(page - 1)}
                  className="h-11 rounded-full border-2 border-zelo-green px-5 text-zelo-green disabled:opacity-30"
              >
                이전
              </button>
              <span className="font-label text-sm text-zelo-green">
            {page + 1} / {result.totalPages}
          </span>
              <button
                  type="button"
                  disabled={page + 1 >= result.totalPages}
                  onClick={() => goToPage(page + 1)}
                  className="h-11 rounded-full border-2 border-zelo-green px-5 text-zelo-green disabled:opacity-30"
              >
                다음
              </button>
            </div>
        )}
      </div>
  );
}