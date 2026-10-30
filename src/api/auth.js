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

export function isDevChatLoginEnabled() {
  return import.meta.env.DEV && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
}

export async function loginDevChat() {
  if (!isDevChatLoginEnabled()) throw new Error('개발 환경에서만 사용할 수 있습니다.');
  const res = await client.post('/api/auth/social/google/login', {
    code: 'fake-zelo-front-chat',
    redirectUri: `${window.location.origin}/login`,
  });
  const data = res.data.data;
  if (!data.signupRequired) return data.accessToken;

  const signupRes = await client.post('/api/auth/social/signup', {
    signupToken: data.signupToken,
    phoneNumber: '010-0000-0000',
    place: '개발 테스트',
    addresses: '테스트용 주소 (배송 불가)',
    zipCode: '00000',
  });
  return signupRes.data.data.accessToken;
}
