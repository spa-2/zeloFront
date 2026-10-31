// 백엔드 OrderStatus 이름 → 화면에 보여줄 말
export const ORDER_STATUS_LABELS = {
    PAYMENT_PENDING: '결제 대기',
    PAID: '결제 완료',
    PAYMENT_FAILED: '결제 실패',
    CANCELED: '주문 취소',
};

export const DELIVERY_STATUS_LABELS = {
    READY: '배송 준비',
    SHIPPING: '배송 중',
    DELIVERED: '배송 완료',
    CANCELED: '배송 취소',
};

export const REFUND_STATUS_LABELS = {
    REQUESTED: '환불 요청',
    COMPLETED: '환불 완료',
    FAILED: '환불 실패',
};

export const REFUND_TYPE_LABELS = {
    FULL: '전액 환불',
    PARTIAL: '부분 환불',
};