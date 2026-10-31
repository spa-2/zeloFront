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

// 소셜 로그인 요청 필드: code, redirectUri, codeVerifier(PKCE를 쓰는 소셜만, 선택)
// 응답: 기존 회원이면 { signupRequired: false, accessToken }, 처음이면 { signupRequired: true, signupTicket, email, name }
export async function socialLogin(provider, request) {
  const res = await client.post(`/api/auth/social/${provider}/login`, request);
  return res.data.data;
}

// 요청 필드: signupTicket, phoneNumber, place, addresses, zipCode
export async function socialSignup(request) {
  const res = await client.post('/api/auth/social/signup', request);
  return res.data.data.accessToken;
}

export function isDevChatLoginEnabled() {
  return import.meta.env.DEV && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
}

export async function loginDevChat() {
  if (!isDevChatLoginEnabled()) throw new Error('개발 환경에서만 사용할 수 있습니다.');
  const data = await socialLogin('google', {
    code: 'fake-zelo-front-chat',
    redirectUri: `${window.location.origin}/login`,
  });
  if (!data.signupRequired) return data.accessToken;

  return socialSignup({
    signupTicket: data.signupTicket,
    phoneNumber: '010-0000-0000',
    place: '개발 테스트',
    addresses: '테스트용 주소 (배송 불가)',
    zipCode: '00000',
  });
}
