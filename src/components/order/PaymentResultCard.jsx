import { useState } from 'react';
import { Link } from 'react-router-dom';
import { errorMessage } from '../../api/client';
import { getOrder } from '../../api/orders';
import PaymentStep from './PaymentStep';
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

// 결제 실패나 결제창 닫기는 주문이 결제 대기로 남아 있어 같은 주문으로 다시 결제할 수 있음
function isRetryable(payment) {
    return payment.status === 'FAILED' || (payment.status === 'CANCELED' && payment.reason === 'USER_CANCELED');
}

export default function PaymentResultCard({ message, onRetryDone }) {
    const [retryOrder, setRetryOrder] = useState(null);
    const [opening, setOpening] = useState(false);
    const [retryError, setRetryError] = useState('');
    const payment = message.payload;
    const paid = payment.status === 'PAID';
    const accent = paid ? 'text-zelo-green' : 'text-zelo-orange';
    const visibleItems = payment.items.slice(0, VISIBLE_ITEM_COUNT);
    const hiddenCount = payment.items.length - visibleItems.length;
    const canRetry = onRetryDone && isRetryable(payment);

    // 카드는 결제 당시 정보라, 지금도 결제 대기인지와 결제 기한을 알려고 주문을 새로 불러옴
    async function openRetry() {
        setRetryError('');
        setOpening(true);
        try {
            const order = await getOrder(payment.orderId);
            if (order.status !== 'PAYMENT_PENDING') {
                setRetryError('이미 결제됐거나 결제할 수 없는 주문이에요.');
                return;
            }
            setRetryOrder(order);
        } catch (e) {
            setRetryError(errorMessage(e));
        } finally {
            setOpening(false);
        }
    }

    function finishRetry() {
        setRetryOrder(null);
        onRetryDone();
    }

    return (
        <div className="flex flex-col gap-3">
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

                {canRetry && !retryOrder && (
                    <button
                        type="button"
                        disabled={opening}
                        onClick={openRetry}
                        className="h-11 rounded-full bg-zelo-green px-5 font-medium text-zelo-ivory disabled:opacity-50"
                    >
                        {opening ? '주문 확인 중…' : '다시 결제'}
                    </button>
                )}
                {retryError && <p className="text-sm text-zelo-orange">{retryError}</p>}
            </article>
            {retryOrder && <PaymentStep placedOrder={retryOrder} onDone={finishRetry} />}
        </div>
    );
}