import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isDevChatLoginEnabled, login, loginDevChat } from '../api/auth';
import { errorMessage } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      setAccessToken(await login(email, password));
      navigate(location.state?.from || '/chat', { replace: true, state: location.state?.fromState });
    } catch (e) {
      setError(errorMessage(e, '이메일이나 비밀번호를 확인해 주세요'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDevLogin() {
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      setAccessToken(await loginDevChat());
      navigate(location.state?.from || '/chat', { replace: true, state: location.state?.fromState });
    } catch (e) {
      setError(errorMessage(e, '개발 로그인에 실패했어요. 백엔드 SOCIAL_MODE=fake 설정을 확인해 주세요.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-xl font-bold">로그인</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          required
          className="rounded border border-stone-300 px-3 py-2"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          required
          className="rounded border border-stone-300 px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-emerald-700 py-2 font-semibold text-white disabled:opacity-50"
        >
          {submitting ? '로그인 중…' : '로그인'}
        </button>
      </form>
      {isDevChatLoginEnabled() && (
        <div className="mt-6 rounded-xl border border-zelo-line p-4">
          <button type="button" onClick={handleDevLogin} disabled={submitting} className="h-11 rounded-full border-2 border-zelo-green px-5 font-medium text-zelo-green disabled:opacity-50">
            {submitting ? '연결 중…' : '개발용 채팅 시작'}
          </button>
          <p className="mt-2 text-sm text-zelo-sub">테스트 계정으로 접속합니다. 최초 접속 시 테스트 계정과 배송용이 아닌 임시 주소가 생성됩니다. 백엔드 SOCIAL_MODE=fake가 필요합니다.</p>
        </div>
      )}
      <p className="mt-4 text-sm text-stone-600">
        처음이신가요? <Link to="/signup" className="text-emerald-700">회원가입</Link>
        {' · '}
        <Link to="/password/reset" className="text-emerald-700">비밀번호 찾기</Link>
      </p>
    </div>
  );
}
