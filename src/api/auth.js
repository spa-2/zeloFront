import { client } from './client';

export async function login(email, password) {
  const res = await client.post('/api/users/login', { email, password });
  return res.data.data.accessToken;
}

export async function logout() {
  await client.post('/api/auth/logout');
}

// 가입 요청 필드: email, password, passwordConfirm, name, phoneNumber, place, addresses, zipCode
export async function signup(request) {
  const res = await client.post('/api/users', request);
  return res.data.data;
}
