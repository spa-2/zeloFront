import { ORDER_STATUS_LABELS } from '../../constants/orders';

// 결제 완료는 채워서, 결제 대기는 테두리로, 실패·취소는 흐리게 보여 줌
const STYLES = {
    PAYMENT_PENDING: 'border-zelo-green text-zelo-green',
    PAID: 'border-zelo-green bg-zelo-green text-zelo-ivory',
    PAYMENT_FAILED: 'border-zelo-orange text-zelo-orange',
    CANCELED: 'border-zelo-line text-zelo-sub',
};

export default function OrderStatusBadge({ status }) {
    return (
        <span className={`shrink-0 rounded-full border-2 px-3 py-1 text-sm font-bold ${STYLES[status] ?? STYLES.CANCELED}`}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
    );
}