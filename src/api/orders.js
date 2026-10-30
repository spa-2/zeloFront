import { client } from './client';

// 주문·결제 화면은 주문 담당이 채움. 여기는 호출 함수만 둠
export async function getMyOrders(params = {}) {
  const res = await client.get('/api/orders', { params });
  return res.data.data;
}

export async function getOrder(orderId) {
  const res = await client.get(`/api/orders/${orderId}`);
  return res.data.data;
}
