import { client } from './client';

export async function startChat(text, idempotencyKey) {
  const res = await client.post('/api/chat/messages', { text }, { headers: { 'Idempotency-Key': idempotencyKey } });
  return res.data.data;
}

export async function getRooms() {
  const res = await client.get('/api/chat/rooms');
  return res.data.data;
}

export async function getMessages(roomId, params) {
  const res = await client.get(`/api/chat/rooms/${roomId}/messages`, { params });
  return res.data.data;
}

export async function sendMessage(roomId, text, idempotencyKey) {
  const res = await client.post(`/api/chat/rooms/${roomId}/messages`, { text }, { headers: { 'Idempotency-Key': idempotencyKey } });
  return res.data.data;
}

export async function chooseSubstitute(roomId, request) {
  const res = await client.post(`/api/chat/rooms/${roomId}/quote-substitutes`, request);
  return res.data.data;
}

export async function chooseBudgetOption(roomId, request) {
  const res = await client.post(`/api/chat/rooms/${roomId}/quote-budget-options`, request);
  return res.data.data;
}

export async function updateQuoteItem(roomId, request) {
  const res = await client.post(`/api/chat/rooms/${roomId}/quote-items`, request);
  return res.data.data;
}

export async function retryMessage(roomId, messageId) {
  const res = await client.post(`/api/chat/rooms/${roomId}/messages/${messageId}/retry`);
  return res.data.data;
}
