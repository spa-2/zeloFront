// 소셜 로그인 창으로 보낼 주소를 만듦. 클라이언트 ID는 .env의 VITE_GOOGLE_CLIENT_ID, VITE_KAKAO_CLIENT_ID
// 카카오는 scope를 안 보내고 개발자 콘솔의 동의 항목 설정을 그대로 따름
export const SOCIAL_PROVIDERS = {
  google: {
    label: 'Google',
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'openid email profile',
    prompt: 'select_account',
  },
  kakao: {
    label: '카카오',
    clientId: import.meta.env.VITE_KAKAO_CLIENT_ID,
    authorizeUrl: 'https://kauth.kakao.com/oauth/authorize',
    prompt: 'select_account',
  },
};

// 소셜 콘솔에 등록한 redirect URI와 한 글자도 다르면 안 되고, 백엔드로 보내는 redirectUri와도 같아야 함
export function getRedirectUri(provider) {
  return `${window.location.origin}/auth/${provider}/callback`;
}

export function buildAuthorizeUrl(provider) {
  const { clientId, authorizeUrl, scope, prompt } = SOCIAL_PROVIDERS[provider];
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(provider),
    response_type: 'code',
  });
  if (scope) params.set('scope', scope);
  // 브라우저에 남은 소셜 로그인 세션으로 바로 로그인되지 않고, 다른 계정도 고를 수 있게 함
  if (prompt) params.set('prompt', prompt);
  return `${authorizeUrl}?${params}`;
}
