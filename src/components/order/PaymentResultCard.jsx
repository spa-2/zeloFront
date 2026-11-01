import { Link } from 'react-router-dom';
import { formatDateTime, formatMoney } from './orderFormat';

// 채팅이 길어지지 않게 상품은 몇 개만 보여 주고 나머지는 개수로 줄임
const VISIBLE_ITEM_COUNT = 3;

// 안내 문구는 채팅 말풍선(content)으로 이미 보여서, 카드 제목은 결과만 짧게 보여 줌
function resultTitle(payment) {
    if (payment.status === 'PAID') {
        return '결제 완료';
    }
    if (payment.status === 'FAILED') {
        return '결제 실패';
    }
    return payment.paidAmount != null ? '환불 완료' : '결제 취소';
}

export default function PaymentResultCard({ message }) {
    const payment = message.payload;
    const paid = payment.status === 'PAID';
    const accent = paid ? 'text-zelo-green' : 'text-zelo-orange';
    const visibleItems = payment.items.slice(0, VISIBLE_ITEM_COUNT);
    const hiddenCount = payment.items.length - visibleItems.length;

    return (
        <article
            className={`flex max-w-md flex-col gap-3 rounded-3xl border-2 bg-zelo-card p-5 ${
                paid ? 'border-zelo-green' : 'border-zelo-orange'
            }`}
        >
            <div className="flex flex-col gap-1">
                <span className={`font-label text-xs tracking-[.2em] ${accent}`}>PAYMENT</span>
                <h3 className={`font-display text-2xl ${accent}`}>{resultTitle(payment)}</h3>
                {payment.failureReason && <p className="text-sm text-zelo-sub">{payment.failureReason}</p>}
            </div>

            <div className="flex flex-col gap-1">
                <p className="font-bold">{payment.orderName}</p>
                <ul className="flex flex-col text-sm">
                    {visibleItems.map((item, index) => (
                        <li key={`${item.productName}-${index}`} className="flex justify-between gap-3 py-0.5">
                            <span className="min-w-0 truncate">
                                {item.productName} {item.productUnit} × {item.quantity}
                            </span>
                            <span className="shrink-0">{formatMoney(item.lineAmount)}</span>
                        </li>
                    ))}
                </ul>
                {hiddenCount > 0 && <p className="text-xs text-zelo-sub">외 {hiddenCount}개 상품</p>}
            </div>

            {payment.paidAmount != null && (
                <div className="flex items-baseline justify-between border-t-2 border-zelo-line pt-3">
                    <span className="text-sm text-zelo-sub">{paid ? '결제 금액' : '환불 금액'}</span>
                    <span className="font-logo text-2xl tracking-[.02em] text-zelo-green">{formatMoney(payment.paidAmount)}</span>
                </div>
            )}
            {payment.paidAt && <p className="text-xs text-zelo-sub">{formatDateTime(payment.paidAt)}</p>}

            <Link
                to={`/orders/${payment.orderId}`}
                className="self-start rounded-full border-2 border-zelo-green px-4 py-1.5 text-sm font-medium text-zelo-green"
            >
                주문 상세 →
            </Link>
        </article>
    );
}