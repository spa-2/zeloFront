import { client } from './client';

// items를 비우면 남은 상품 전부를 환불함
export async function createRefund(orderId, request) {
    const res = await client.post(`/api/orders/${orderId}/refund`, request);
    return res.data.data;
}