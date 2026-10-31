import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { socialSignup } from '../api/auth';
import { errorMessage } from '../api/client';
import { useAuthStore } from '../store/authStore';

const INPUT_CLASS =
  'h-11 rounded-xl border-2 border-zelo-line bg-zelo-card px-4 text-zelo-ink focus:border-zelo-green focus:outline-none';

// 소셜 로그인에서 처음 온 사용자가 전화번호와 배송지를 더 입력해 가입을 끝내는 화면
export default function SignupSocialPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [place, setPlace] = useState('집');
  const [addresses, setAddresses] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 티켓은 주소가 아니라 이동할 때 넘긴 state로만 받음. 새로고침하면 사라지니 로그인부터 다시
  const { signupTicket, email, name } = location.state ?? {};
  if (!signupTicket) return <Navigate to="/login" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      setAccessToken(await socialSignup({ signupTicket, phoneNumber, place, addresses, zipCode }));
      navigate(location.state?.from || '/chat', { replace: true });
    } catch (e) {
      setError(errorMessage(e, '가입에 실패했어요. 로그인부터 다시 시도해 주세요'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-label text-xs tracking-[.2em] text-zelo-orange">ONE MORE STEP</p>
        <h1 className="font-display text-5xl text-zelo-green">추가 정보 입력</h1>
        <p className="text-sm text-zelo-sub">
          {name ? `${name}님, ` : ''}배송에 필요한 정보만 입력하면 가입이 끝나요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-3xl bg-zelo-card p-6">
        {email && (
          <label className="flex flex-col gap-1 text-sm font-medium">
            이메일
            <input type="email" value={email} readOnly className={`${INPUT_CLASS} text-zelo-sub`} />
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm font-medium">
          전화번호
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="010-1234-5678"
            required
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          배송지 이름
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="집, 회사 등"
            maxLength={20}
            required
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          주소
          <input
            value={addresses}
            onChange={(e) => setAddresses(e.target.value)}
            placeholder="서울특별시 강남구 ..."
            minLength={2}
            maxLength={200}
            required
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          우편번호
          <input
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="12345"
            maxLength={10}
            required
            className={INPUT_CLASS}
          />
        </label>

        {error && <p className="text-sm text-zelo-orange">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="h-11 rounded-full border-2 border-zelo-green px-5 font-medium text-zelo-green disabled:opacity-50"
        >
          {submitting ? '가입 중…' : '가입 완료'}
        </button>
      </form>

      <p className="text-sm text-zelo-sub">
        <Link to="/login" className="text-zelo-green hover:underline">
          로그인으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
