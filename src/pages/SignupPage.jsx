import { useState } from 'react';
import { Link } from 'react-router-dom';

// 백엔드 비밀번호 규칙과 같음 (PasswordResetPage와 같은 기준)
const PASSWORD_RULES = [
  { label: '8자 이상', test: (password) => password.length >= 8 },
  { label: '영문·숫자·특수문자 섞기', test: (password) => /[A-Za-z]/.test(password) && /\d/.test(password) && /[^A-Za-z\d]/.test(password) },
];
const PLACES = ['집', '회사'];

const FOCUS_CLASS = 'focus:border-zelo-orange focus:ring-3 focus:ring-zelo-orange/25 focus:outline-none';
const INPUT_CLASS = `h-[54px] min-w-0 rounded-2xl border-2 border-zelo-line bg-zelo-ivory/40 px-[18px] text-base text-zelo-ink ${FOCUS_CLASS}`;
const LINE_BUTTON_CLASS =
  'h-[54px] shrink-0 rounded-full border-2 border-zelo-green px-[22px] text-[15px] font-bold text-zelo-green disabled:opacity-50';
const LEGEND_CLASS = 'mb-3.5 flex items-center gap-2.5 font-display text-2xl text-zelo-green';
const STEP_NUMBER_CLASS = 'inline-grid size-8 place-items-center rounded-full bg-zelo-green font-logo text-base text-zelo-ivory';
const FIELD_CLASS = 'flex min-w-0 flex-col gap-2';
const LABEL_CLASS = 'text-sm font-medium';

// 화면만 먼저 만들어 둠. 인증 메일, 주소 찾기, 가입 요청은 회원 담당이 api/auth.js의 함수로 붙임
export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [place, setPlace] = useState('집');
  const [zipCode] = useState('');
  const [addresses, setAddresses] = useState('');

  const rules = [
    ...PASSWORD_RULES.map((rule) => ({ label: rule.label, ok: rule.test(password) })),
    { label: '두 칸이 같아요', ok: password !== '' && password === passwordConfirm },
  ];

  function handleSubmit(event) {
    event.preventDefault();
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
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              maxLength={50}
              required
              className={`${INPUT_CLASS} flex-[1_1_260px]`}
            />
            <button type="button" className={LINE_BUTTON_CLASS}>
              인증 코드 받기
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
              pattern="\d{6}"
              maxLength={6}
              required
              className={`${INPUT_CLASS} flex-[1_1_260px] tracking-[.1em]`}
            />
            <button type="button" className="h-[54px] shrink-0 rounded-full bg-zelo-green px-[26px] text-[15px] font-bold text-zelo-ivory disabled:opacity-50">
              확인
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
            <span className={STEP_NUMBER_CLASS}>3</span>받는 분
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
                휴대폰 번호
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
            <button type="button" className={LINE_BUTTON_CLASS}>
              주소 찾기
            </button>
          </div>
          <input
            value={addresses}
            onChange={(e) => setAddresses(e.target.value)}
            placeholder="도로명 주소와 상세 주소 (동·호수)"
            aria-label="상세 주소"
            minLength={2}
            maxLength={200}
            required
            className={INPUT_CLASS}
          />
        </fieldset>

        <button type="submit" className="h-16 rounded-full bg-zelo-green font-display text-2xl text-zelo-ivory disabled:opacity-50">
          가입하고 장보기 시작
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
