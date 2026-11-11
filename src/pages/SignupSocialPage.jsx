import { useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { socialSignup } from '../api/auth';
import { errorMessage } from '../api/client';
import { joinAddress, MAX_ADDRESS_LENGTH, useAddressSearch } from '../components/addressSearch';
import { useAuthStore } from '../store/authStore';

const PLACES = ['집', '회사'];

const INPUT_CLASS =
  'h-11 min-w-0 rounded-xl border-2 border-zelo-line bg-zelo-card px-4 text-zelo-ink focus:border-zelo-green focus:outline-none';

// 소셜 로그인에서 처음 온 사용자가 전화번호와 배송지를 더 입력해 가입을 끝내는 화면
export default function SignupSocialPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [place, setPlace] = useState('집');
  const [zipCode, setZipCode] = useState('');
  const [baseAddress, setBaseAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const detailRef = useRef(null);
  const searchAddress = useAddressSearch(({ zipCode, address }) => {
    setZipCode(zipCode);
    setBaseAddress(address);
    detailRef.current?.focus();
  });

  // 티켓은 주소가 아니라 이동할 때 넘긴 state로만 받음. 새로고침하면 사라지니 로그인부터 다시
  const { signupTicket, email, name } = location.state ?? {};
  if (!signupTicket) return <Navigate to="/login" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    // 우편번호 칸은 읽기 전용이라 브라우저의 required 검사가 적용되지 않아 직접 확인함
    if (!zipCode) {
      setError('주소 찾기로 우편번호를 넣어 주세요');
      return;
    }
    const addresses = joinAddress(baseAddress, detailAddress);
    if (addresses.length > MAX_ADDRESS_LENGTH) {
      setError('주소가 너무 길어요. 주소와 상세 주소를 줄여 주세요');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      setAccessToken(await socialSignup({ signupTicket, phoneNumber, place: place.trim(), addresses, zipCode }));
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
          <span>
            전화번호 <span className="font-normal text-zelo-sub">(- 없이도 돼요)</span>
          </span>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="010-1234-5678"
            required
            className={INPUT_CLASS}
          />
        </label>
        <div className="flex flex-col gap-1 text-sm font-medium">
          배송지 이름
          <div className="flex flex-wrap gap-2">
            {PLACES.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-pressed={place === preset}
                onClick={() => setPlace(preset)}
                className={`h-11 rounded-full border-2 px-5 ${
                  place === preset ? 'border-zelo-green bg-zelo-green font-bold text-zelo-ivory' : 'border-zelo-line font-medium'
                }`}
              >
                {preset}
              </button>
            ))}
            <input
              value={PLACES.includes(place) ? '' : place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="직접 입력"
              aria-label="배송지 이름 직접 입력"
              maxLength={20}
              className="h-11 min-w-0 flex-[1_1_120px] rounded-full border-2 border-zelo-line bg-zelo-card px-4 font-normal focus:border-zelo-green focus:outline-none"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 text-sm font-medium">
          주소
          <div className="flex flex-wrap gap-2">
            <input
              value={zipCode}
              placeholder="우편번호"
              aria-label="우편번호"
              readOnly
              className={`${INPUT_CLASS} w-36 bg-zelo-line/40 font-normal`}
            />
            <button
              type="button"
              onClick={searchAddress}
              className="h-11 rounded-full border-2 border-zelo-green px-4 font-medium text-zelo-green"
            >
              주소 찾기
            </button>
          </div>
          <input
            value={baseAddress}
            onChange={(e) => setBaseAddress(e.target.value)}
            placeholder="주소"
            aria-label="주소"
            minLength={2}
            maxLength={200}
            required
            className={`${INPUT_CLASS} font-normal`}
          />
          <input
            ref={detailRef}
            value={detailAddress}
            onChange={(e) => setDetailAddress(e.target.value)}
            placeholder="상세 주소 (동, 호수)"
            aria-label="상세 주소"
            maxLength={100}
            className={`${INPUT_CLASS} font-normal`}
          />
        </div>

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
