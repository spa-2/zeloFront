import { client } from './client';

// 채팅·견적 카드 화면은 채팅 담당이 채움. 여기는 호출 함수만 둠
export async function startChat(text) {
  const res = await client.post('/api/chat/messages', { text });
  return res.data.data;
}

export async function getRooms() {
  const res = await client.get('/api/chat/rooms');
  return res.data.data;
}

export async function getMessages(roomId) {
  const res = await client.get(`/api/chat/rooms/${roomId}/messages`);
  return res.data.data;
}

export async function sendMessage(roomId, text) {
  const res = await client.post(`/api/chat/rooms/${roomId}/messages`, { text });
  return res.data.data;
}
