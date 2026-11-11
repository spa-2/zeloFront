import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { socialLogin } from '../api/auth';
import { errorMessage } from '../api/client';
import { getRedirectUri, SOCIAL_PROVIDERS } from '../components/auth/socialProviders';
import { useAuthStore } from '../store/authStore';

// 소셜 로그인이 끝나고 돌아오는 화면. 주소의 code를 백엔드에 넘겨 로그인하거나, 처음이면 소셜 가입으로 보냄
export default function LoginCallbackPage() {
  const { provider } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const [error, setError] = useState('');
  // code는 한 번만 쓸 수 있는데 개발 모드(StrictMode)는 효과를 두 번 실행함. 요청은 한 번만 보내고 결과만 두 번 받음
  const requestRef = useRef(null);

  const code = params.get('code');
  const denied = params.get('error');
  const valid = Boolean(SOCIAL_PROVIDERS[provider]);

  useEffect(() => {
    if (!valid || !code) return;
    let ignore = false;
    requestRef.current ??= socialLogin(provider, { code, redirectUri: getRedirectUri(provider) });
    requestRef.current
      .then((data) => {
        if (ignore) return;
        if (data.signupRequired) {
          navigate('/signup/social', {
            replace: true,
            state: { signupTicket: data.signupTicket, email: data.email, name: data.name },
          });
        } else {
          setAccessToken(data.accessToken);
          navigate('/chat', { replace: true });
        }
      })
      .catch((e) => !ignore && setError(errorMessage(e, '소셜 로그인에 실패했어요')));
    return () => {
      ignore = true;
    };
  }, [valid, provider, code, navigate, setAccessToken]);

  if (!valid) return <Navigate to="/login" replace />;

  const failure = denied ? '소셜 로그인을 취소했어요' : !code ? '로그인 정보를 받지 못했어요' : error;

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 py-10 text-center">
      {failure ? (
        <>
          <p className="text-zelo-orange">{failure}</p>
          <Link to="/login" className="text-sm text-zelo-green hover:underline">
            로그인으로 돌아가기
          </Link>
        </>
      ) : (
        <p className="text-zelo-sub">{SOCIAL_PROVIDERS[provider].label}로 로그인하는 중…</p>
      )}
    </div>
  );
}
