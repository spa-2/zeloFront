import { useState } from 'react';
import { Link } from 'react-router-dom';
import { confirmEmailVerification, resetPassword, sendEmailVerification } from '../api/auth';
import { errorMessage } from '../api/client';

const PURPOSE = 'PASSWORD_RESET';
// 백엔드 비밀번호 규칙과 같음: 영문·숫자·특수문자 모두 포함, 공백 없이 8~72자
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d])[\x21-\x7E]{8,72}$/;

const INPUT_CLASS =
  'h-11 rounded-xl border-2 border-zelo-line bg-zelo-card px-4 text-zelo-ink focus:border-zelo-green focus:outline-none';
const BUTTON_CLASS = 'h-11 rounded-full border-2 border-zelo-green px-5 font-medium text-zelo-green disabled:opacity-50';

// 이메일 입력 → 메일 코드 확인 → 새 비밀번호 입력, 세 단계를 한 화면에서 진행
export default function PasswordResetPage() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [ticket, setTicket] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function run(action, failMessage) {
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      await action();
    } catch (e) {
      setError(errorMessage(e, failMessage));
    } finally {
      setSubmitting(false);
    }
  }

  function handleSend(event) {
    event.preventDefault();
    return run(async () => {
      await sendEmailVerification(email, PURPOSE);
      setStep('code');
      setNotice('메일로 6자리 인증 코드를 보냈어요');
    }, '인증 메일을 보내지 못했어요');
  }

  function handleResend() {
    return run(async () => {
      await sendEmailVerification(email, PURPOSE);
      setNotice('인증 코드를 다시 보냈어요');
    }, '인증 메일을 보내지 못했어요');
  }

  function handleConfirm(event) {
    event.preventDefault();
    return run(async () => {
      setTicket(await confirmEmailVerification(email, PURPOSE, code));
      setStep('password');
    }, '인증 코드를 확인해 주세요');
  }

  function handleReset(event) {
    event.preventDefault();
    if (!PASSWORD_PATTERN.test(password)) {
      setError('비밀번호는 영문, 숫자, 특수문자를 모두 포함해 8자 이상이어야 해요');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 서로 달라요');
      return;
    }
    return run(async () => {
      await resetPassword({ email, emailVerificationTicket: ticket, password, passwordConfirm });
      setStep('done');
    }, '비밀번호를 바꾸지 못했어요. 처음부터 다시 시도해 주세요');
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-label text-xs tracking-[.2em] text-zelo-orange">RESET PASSWORD</p>
        <h1 className="font-display text-5xl text-zelo-green">비밀번호 찾기</h1>
      </div>

      {step === 'done' ? (
        <div className="flex flex-col gap-4 rounded-3xl bg-zelo-card p-6">
          <p className="font-medium">비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요.</p>
          <Link to="/login" className={`${BUTTON_CLASS} flex items-center justify-center`}>
            로그인하러 가기
          </Link>
        </div>
      ) : (
        <form
          onSubmit={{ email: handleSend, code: handleConfirm, password: handleReset }[step]}
          className="flex flex-col gap-4 rounded-3xl bg-zelo-card p-6"
        >
          <label className="flex flex-col gap-1 text-sm font-medium">
            이메일
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="가입한 이메일"
              maxLength={50}
              readOnly={step !== 'email'}
              required
              className={`${INPUT_CLASS} ${step !== 'email' ? 'text-zelo-sub' : ''}`}
            />
          </label>

          {step === 'code' && (
            <label className="flex flex-col gap-1 text-sm font-medium">
              인증 코드
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="숫자 6자리"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                className={INPUT_CLASS}
              />
            </label>
          )}

          {step === 'password' && (
            <>
              <label className="flex flex-col gap-1 text-sm font-medium">
                새 비밀번호
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                  maxLength={72}
                  required
                  className={INPUT_CLASS}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium">
                새 비밀번호 확인
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  maxLength={72}
                  required
                  className={INPUT_CLASS}
                />
              </label>
            </>
          )}

          {notice && <p className="text-sm text-zelo-green">{notice}</p>}
          {error && <p className="text-sm text-zelo-orange">{error}</p>}

          <button type="submit" disabled={submitting} className={BUTTON_CLASS}>
            {{ email: '인증 코드 받기', code: '코드 확인', password: '비밀번호 바꾸기' }[step]}
          </button>
          {step === 'code' && (
            <button type="button" onClick={handleResend} disabled={submitting} className="text-sm text-zelo-green hover:underline disabled:opacity-50">
              코드를 못 받았어요. 다시 보내기
            </button>
          )}
        </form>
      )}

      <p className="text-sm text-zelo-sub">
        <Link to="/login" className="text-zelo-green hover:underline">
          로그인으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
