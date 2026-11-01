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

// 채팅 화면의 roomId는 주소에서 꺼낸 문자열이라 숫자로 바꿔 보냄
export async function createConfirmation(roomId, quoteId) {
  const res = await client.post('/api/orders/confirmations', { roomId: Number(roomId), quoteId });
  return res.data.data;
}

export async function createOrder(quoteId, confirmationId) {
  const res = await client.post('/api/orders', { quoteId, confirmationId });
  return res.data.data;
}
