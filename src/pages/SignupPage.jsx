import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { confirmEmailVerification, sendEmailVerification, signup } from '../api/auth';
import { errorMessage } from '../api/client';
import { joinAddress, MAX_ADDRESS_LENGTH, useAddressSearch } from '../components/addressSearch';
import useCooldown from '../components/auth/useCooldown';

const RESEND_SECONDS = 5;

// 백엔드 비밀번호 규칙과 같음 (PasswordResetPage와 같은 기준)
const PASSWORD_RULES = [
  { label: '8자 이상', test: (password) => password.length >= 8 },
  { label: '영문·숫자·특수문자 섞기', test: (password) => /[A-Za-z]/.test(password) && /\d/.test(password) && /[^A-Za-z\d]/.test(password) },
];
const PLACES = ['집', '회사'];
// 백엔드 검증과 같음: 영문·숫자·특수문자만 쓰는 공백 없는 문자열
const PASSWORD_CHARS = /^[\x21-\x7E]+$/;


const FOCUS_CLASS = 'focus:border-zelo-orange focus:ring-3 focus:ring-zelo-orange/25 focus:outline-none';
const INPUT_CLASS = `h-[54px] min-w-0 rounded-2xl border-2 border-zelo-line bg-zelo-ivory/40 px-[18px] text-base text-zelo-ink ${FOCUS_CLASS}`;
const LINE_BUTTON_CLASS =
  'h-[54px] shrink-0 rounded-full border-2 border-zelo-green px-[22px] text-[15px] font-bold text-zelo-green disabled:opacity-50';
const LEGEND_CLASS = 'mb-3.5 flex items-center gap-2.5 font-display text-2xl text-zelo-green';
const STEP_NUMBER_CLASS = 'inline-grid size-8 place-items-center rounded-full bg-zelo-green font-logo text-base text-zelo-ivory';
const FIELD_CLASS = 'flex min-w-0 flex-col gap-2';
const LABEL_CLASS = 'text-sm font-medium';

export default function SignupPage() {
  const navigate = useNavigate();
  const detailRef = useRef(null);
  const searchAddress = useAddressSearch(({ zipCode, address }) => {
    setZipCode(zipCode);
    setBaseAddress(address);
    detailRef.current?.focus();
  });
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  // 인증이 끝나면 받는 티켓. 이 티켓이 있어야 가입할 수 있음
  const [ticket, setTicket] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendWait, startResendWait] = useCooldown(RESEND_SECONDS);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [place, setPlace] = useState('집');
  const [zipCode, setZipCode] = useState('');
  const [baseAddress, setBaseAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');

  const rules = [
    ...PASSWORD_RULES.map((rule) => ({ label: rule.label, ok: rule.test(password) })),
    { label: '두 칸이 같아요', ok: password !== '' && password === passwordConfirm },
  ];

  async function run(action, failMessage) {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setError(errorMessage(e, failMessage));
    } finally {
      setBusy(false);
    }
  }

  // 이메일을 고치면 지난 인증은 무효라서 처음부터 다시 받게 함
  function changeEmail(value) {
    setEmail(value);
    setTicket('');
    setCode('');
    setCodeSent(false);
    setNotice('');
  }

  function handleSendCode() {
    if (!email) {
      setError('이메일을 입력해 주세요');
      return;
    }
    return run(async () => {
      await sendEmailVerification(email, 'SIGNUP');
      setCodeSent(true);
      startResendWait();
      setNotice('메일로 6자리 인증 코드를 보냈어요');
    }, '인증 메일을 보내지 못했어요');
  }

  function handleConfirmCode() {
    if (!/^\d{6}$/.test(code)) {
      setError('인증 코드 6자리를 입력해 주세요');
      return;
    }
    return run(async () => {
      setTicket(await confirmEmailVerification(email, 'SIGNUP', code));
      setNotice('이메일 인증이 완료됐어요');
    }, '인증 코드를 확인해 주세요');
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!ticket) {
      setError('이메일 인증을 먼저 완료해 주세요');
      return;
    }
    if (!PASSWORD_RULES.every((rule) => rule.test(password)) || !PASSWORD_CHARS.test(password)) {
      setError('비밀번호는 공백 없이 영문, 숫자, 특수문자를 모두 포함해 8자 이상이어야 해요');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 서로 달라요');
      return;
    }
    // 우편번호 칸은 읽기 전용이라 브라우저의 required 검사가 적용되지 않아 직접 확인함
    if (!zipCode) {
      setError('주소 찾기로 우편번호를 넣어 주세요');
      return;
    }
    const address = joinAddress(baseAddress, detailAddress);
    if (address.length > MAX_ADDRESS_LENGTH) {
      setError('주소가 너무 길어요. 주소와 상세 주소를 줄여 주세요');
      return;
    }
    return run(async () => {
      await signup({
        email,
        emailVerificationTicket: ticket,
        password,
        passwordConfirm,
        name: name.trim(),
        phoneNumber,
        place: place.trim(),
        addresses: address,
        zipCode,
      });
      navigate('/login', { replace: true, state: { notice: '가입이 완료됐어요. 로그인해 주세요' } });
    }, '가입하지 못했어요. 입력한 내용을 확인해 주세요');
  }

  return (
    <div className="mx-auto flex max-w-[672px] flex-col gap-7 pt-6 pb-10">
      <div className="flex flex-col gap-2.5">
        <p className="font-label text-[13px] tracking-[.2em] text-zelo-green">JOIN ZELO</p>
        <h1 className="font-display text-[40px] leading-[1.05] break-keep sm:text-[52px]">
          <span className="text-zelo-green">한 번만 적어 두면</span>
          <br />
          <span className="text-zelo-orange">다음부턴 말만 하세요</span>
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-8 rounded-[28px] border-2 border-zelo-green bg-zelo-card p-6 shadow-[8px_10px_0] shadow-zelo-green/15 sm:px-10 sm:py-9"
      >
        <fieldset className="flex flex-col gap-3.5">
          <legend className={LEGEND_CLASS}>
            <span className={STEP_NUMBER_CLASS}>1</span>이메일 인증
          </legend>
          <label htmlFor="signupEmail" className={LABEL_CLASS}>
            이메일
          </label>
          <div className="flex flex-wrap gap-2.5">
            <input
              id="signupEmail"
              type="email"
              value={email}
              onChange={(e) => changeEmail(e.target.value)}
              placeholder="you@example.com"
              maxLength={50}
              required
              className={`${INPUT_CLASS} flex-[1_1_260px]`}
            />
            <button type="button" onClick={handleSendCode} disabled={busy || !!ticket || resendWait > 0} className={LINE_BUTTON_CLASS}>
              {resendWait > 0 ? `다시 보내기 (${resendWait})` : codeSent ? '다시 보내기' : '인증 코드 받기'}
            </button>
          </div>
          <label htmlFor="signupCode" className={LABEL_CLASS}>
            인증 코드
          </label>
          <div className="flex flex-wrap gap-2.5">
            <input
              id="signupCode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="메일로 받은 6자리"
              inputMode="numeric"
              maxLength={6}
              disabled={!codeSent || !!ticket}
              className={`${INPUT_CLASS} flex-[1_1_260px] tracking-[.1em] disabled:opacity-60`}
            />
            <button
              type="button"
              onClick={handleConfirmCode}
              disabled={busy || !codeSent || !!ticket}
              className="h-[54px] shrink-0 rounded-full bg-zelo-green px-[26px] text-[15px] font-bold text-zelo-ivory disabled:opacity-50"
            >
              {ticket ? '인증 완료' : '확인'}
            </button>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3.5">
          <legend className={LEGEND_CLASS}>
            <span className={STEP_NUMBER_CLASS}>2</span>비밀번호
          </legend>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className={FIELD_CLASS}>
              <label htmlFor="signupPassword" className={LABEL_CLASS}>
                비밀번호
              </label>
              <input
                id="signupPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={72}
                required
                className={INPUT_CLASS}
              />
            </div>
            <div className={FIELD_CLASS}>
              <label htmlFor="signupPasswordConfirm" className={LABEL_CLASS}>
                비밀번호 확인
              </label>
              <input
                id="signupPasswordConfirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                maxLength={72}
                required
                className={INPUT_CLASS}
              />
            </div>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {rules.map((rule) => (
              <li key={rule.label} className={`flex items-center gap-1.5 ${rule.ok ? 'text-zelo-green' : 'text-zelo-sub'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12l5 5L19 8" />
                </svg>
                {rule.label}
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset className="flex flex-col gap-3.5">
          <legend className={LEGEND_CLASS}>
            <span className={STEP_NUMBER_CLASS}>3</span>내 정보
          </legend>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className={FIELD_CLASS}>
              <label htmlFor="signupName" className={LABEL_CLASS}>
                이름
              </label>
              <input id="signupName" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" required className={INPUT_CLASS} />
            </div>
            <div className={FIELD_CLASS}>
              <label htmlFor="signupPhone" className={LABEL_CLASS}>
                휴대폰 번호 <span className="font-normal text-zelo-sub">(- 없이도 돼요)</span>
              </label>
              <input
                id="signupPhone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="010-1234-5678"
                required
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3.5">
          <legend className={LEGEND_CLASS}>
            <span className={STEP_NUMBER_CLASS}>4</span>기본 배송지
          </legend>
          <label htmlFor="signupPlace" className={LABEL_CLASS}>
            배송지 이름
          </label>
          <div className="flex flex-wrap gap-2">
            {PLACES.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-pressed={place === preset}
                onClick={() => setPlace(preset)}
                className={`h-11 rounded-full border-2 px-5 text-[15px] ${
                  place === preset ? 'border-zelo-green bg-zelo-green font-bold text-zelo-ivory' : 'border-zelo-line bg-zelo-ivory/40 font-medium'
                }`}
              >
                {preset}
              </button>
            ))}
            <input
              id="signupPlace"
              value={PLACES.includes(place) ? '' : place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="직접 입력"
              maxLength={20}
              className={`h-11 min-w-0 flex-[1_1_160px] rounded-full border-2 border-zelo-line bg-zelo-ivory/40 px-[18px] text-[15px] ${FOCUS_CLASS}`}
            />
          </div>
          <label htmlFor="signupZip" className={LABEL_CLASS}>
            주소
          </label>
          <div className="flex flex-wrap gap-2.5">
            <input id="signupZip" value={zipCode} placeholder="우편번호" readOnly required className="h-[54px] min-w-0 flex-[0_1_180px] rounded-2xl border-2 border-zelo-line bg-zelo-line/40 px-[18px] text-base focus:outline-none" />
            <button type="button" onClick={searchAddress} className={LINE_BUTTON_CLASS}>
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
            className={INPUT_CLASS}
          />
          <input
            ref={detailRef}
            value={detailAddress}
            onChange={(e) => setDetailAddress(e.target.value)}
            placeholder="상세 주소 (동, 호수)"
            aria-label="상세 주소"
            maxLength={100}
            className={INPUT_CLASS}
          />
        </fieldset>

        {notice && <p className="text-sm font-medium text-zelo-green">{notice}</p>}
        {error && <p className="text-sm font-medium text-zelo-orange">{error}</p>}

        <button type="submit" disabled={busy} className="h-16 rounded-full bg-zelo-green font-display text-2xl text-zelo-ivory disabled:opacity-50">
          {busy ? '처리 중…' : '가입하고 장보기 시작'}
        </button>
      </form>

      <p className="text-center text-[15px] text-zelo-sub">
        이미 가입했나요?{' '}
        <Link to="/login" className="font-bold text-zelo-green hover:text-zelo-green-deep">
          로그인
        </Link>
      </p>
    </div>
  );
}
