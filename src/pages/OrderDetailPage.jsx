import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { getOrder } from '../api/orders';
import OrderSection from '../components/order/OrderSection';
import OrderStatusBadge from '../components/order/OrderStatusBadge';
import { formatDateTime, formatMoney } from '../components/order/orderFormat';
import {
    DELIVERY_STATUS_LABELS,
    PAYMENT_STATUS_LABELS,
    REFUND_STATUS_LABELS,
    REFUND_TYPE_LABELS,
} from '../constants/orders';

export default function OrderDetailPage() {
    const { orderId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let ignore = false;
        getOrder(orderId)
            .then((result) => !ignore && setOrder(result))
            .catch((e) => !ignore && setError(errorMessage(e, '주문을 찾을 수 없어요')));
        return () => {
            ignore = true;
        };
    }, [orderId]);

    // 목록에서 왔으면 뒤로 가서 보던 페이지를 살리고, 주소로 바로 들어왔으면 목록으로
    function goBack() {
        if (location.key !== 'default') {
            navigate(-1);
        } else {
            navigate('/orders');
        }
    }

    const backButton = (
        <button type="button" onClick={goBack} className="self-start font-medium text-zelo-green hover:underline">
            ← 주문 내역
        </button>
    );

    if (error) {
        return (
            <div className="flex flex-col gap-4">
                {backButton}
                <p className="text-zelo-orange">{error}</p>
            </div>
        );
    }
    if (!order) {
        return <p className="text-zelo-sub">불러오는 중…</p>;
    }

    const { payment, delivery, refund, shippingAddress } = order;
    return (
        <div className="flex flex-col gap-6">
            {backButton}
            <header className="flex flex-wrap items-end gap-4">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <p className="font-label text-xs tracking-[.2em] text-zelo-orange">ORDER No. {order.orderId}</p>
                    <h1 className="font-display text-4xl text-zelo-green">{order.orderName}</h1>
                    <p className="text-sm text-zelo-sub">{formatDateTime(order.createdAt)} 주문</p>
                </div>
                <OrderStatusBadge status={order.status} />
            </header>

            <OrderSection title="주문 상품">
                <ul className="flex flex-col divide-y divide-zelo-line">
                    {order.items.map((item) => (
                        <li key={item.orderItemId} className="flex flex-wrap items-center gap-3 py-3">
                            <div className="flex min-w-0 flex-1 flex-col">
                                <span className="font-bold">{item.productName}</span>
                                <span className="text-sm text-zelo-sub">
                  {item.productUnit} · {formatMoney(item.unitPrice)} × {item.quantity}개
                </span>
                                {item.canceledQuantity > 0 && (
                                    <span className="text-sm text-zelo-orange">{item.canceledQuantity}개 환불됨</span>
                                )}
                            </div>
                            <span className="font-bold">{formatMoney(item.lineAmount)}</span>
                        </li>
                    ))}
                </ul>
            </OrderSection>

            <div className="grid gap-6 md:grid-cols-2">
                <OrderSection
                    title="결제"
                    rows={[
                        ['주문 금액', formatMoney(order.totalAmount)],
                        ['환불 금액', order.refundedAmount > 0 ? `- ${formatMoney(order.refundedAmount)}` : null],
                        ['결제 금액', order.paidAmount != null ? formatMoney(order.paidAmount) : null],
                        ['결제 상태', payment && (PAYMENT_STATUS_LABELS[payment.paymentStatus] ?? payment.paymentStatus)],
                        ['결제 수단', payment?.paymentMethodName],
                        ['결제 시각', formatDateTime(payment?.paidAt)],
                        ['실패 사유', payment?.failureReason],
                    ]}
                />

                <OrderSection
                    title="배송"
                    rows={[
                        ['배송 상태', delivery && (DELIVERY_STATUS_LABELS[delivery.deliveryStatus] ?? delivery.deliveryStatus)],
                        ['출고 시각', formatDateTime(delivery?.shippedAt)],
                        ['배송 완료', formatDateTime(delivery?.deliveredAt)],
                        ['받는 분', shippingAddress?.recipientName],
                        ['연락처', shippingAddress?.recipientPhone],
                        ['주소', shippingAddress && `(${shippingAddress.zipCode}) ${shippingAddress.address}`],
                    ]}
                >
                    {!delivery && order.status === 'PAYMENT_PENDING' && (
                        <p className="text-sm text-zelo-sub">결제가 끝나면 배송이 준비돼요.</p>
                    )}
                </OrderSection>

                {refund && (
                    <OrderSection
                        title="환불"
                        rows={[
                            ['환불 상태', REFUND_STATUS_LABELS[refund.refundStatus] ?? refund.refundStatus],
                            ['환불 종류', REFUND_TYPE_LABELS[refund.refundType] ?? refund.refundType],
                            ['환불 금액', formatMoney(refund.itemsAmount)],
                            ['환불 시각', formatDateTime(refund.refundedAt)],
                            ['사유', refund.reason],
                        ]}
                    />
                )}
            </div>
        </div>
    );
}