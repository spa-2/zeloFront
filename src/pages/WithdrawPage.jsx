import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout, sendWithdrawalCode, verifyWithdrawalCode } from '../api/auth';
import { errorMessage } from '../api/client';
import { useAuthStore } from '../store/authStore';

// 정보 보관 기간과 재가입 정책이 정해지면 여기에 안내를 추가
const NOTICES = [
  '진행 중인 주문이나 결제가 있으면 탈퇴할 수 없어요.',
  '탈퇴하면 이 계정으로 로그인할 수 없고, 주문 내역과 배송지, 결제 수단을 더 볼 수 없어요.',
  '탈퇴는 가입한 이메일로 받은 인증 코드를 입력해야 완료돼요.',
];

const INPUT_CLASS =
  'h-11 rounded-xl border-2 border-zelo-line bg-zelo-card px-4 text-zelo-ink focus:border-zelo-green focus:outline-none';
const DANGER_BUTTON_CLASS = 'h-11 rounded-full border-2 border-zelo-orange px-5 font-medium text-zelo-orange disabled:opacity-50';

// 안내 확인 → 이메일 코드 입력 두 단계. 코드가 맞으면 바로 탈퇴 처리됨
export default function WithdrawPage() {
  const navigate = useNavigate();
  const clear = useAuthStore((state) => state.clear);
  const [step, setStep] = useState('notice');
  const [agreed, setAgreed] = useState(false);
  const [code, setCode] = useState('');
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
      await sendWithdrawalCode();
      setStep('code');
      setNotice('가입한 이메일로 6자리 인증 코드를 보냈어요');
    }, '인증 메일을 보내지 못했어요');
  }

  function handleResend() {
    return run(async () => {
      await sendWithdrawalCode();
      setCode('');
      setNotice('인증 코드를 다시 보냈어요');
    }, '인증 메일을 보내지 못했어요');
  }

  function handleWithdraw(event) {
    event.preventDefault();
    return run(async () => {
      await verifyWithdrawalCode(code);
      try {
        // 리프레시 쿠키는 httpOnly라 화면에서 못 지움. 서버에 지워 달라고 요청하되 실패해도 넘어감
        await logout();
      } catch {
        // 이미 탈퇴 처리돼 토큰이 무효일 수 있음
      }
      clear();
      navigate('/login', { replace: true, state: { notice: '회원 탈퇴가 완료됐어요' } });
    }, '탈퇴하지 못했어요. 인증 코드를 확인해 주세요');
  }

  function handleBack() {
    setStep('notice');
    setCode('');
    setError('');
    setNotice('');
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-label text-xs tracking-[.2em] text-zelo-orange">WITHDRAWAL</p>
        <h1 className="font-display text-5xl text-zelo-green">회원 탈퇴</h1>
      </div>

      <form onSubmit={step === 'notice' ? handleSend : handleWithdraw} className="flex flex-col gap-4 rounded-3xl bg-zelo-card p-6">
        {step === 'notice' ? (
          <>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
              {NOTICES.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="size-4 accent-zelo-orange"
              />
              위 내용을 확인했어요
            </label>
          </>
        ) : (
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

        {notice && <p className="text-sm text-zelo-green">{notice}</p>}
        {error && <p className="text-sm text-zelo-orange">{error}</p>}

        <button type="submit" disabled={submitting || (step === 'notice' && !agreed)} className={DANGER_BUTTON_CLASS}>
          {step === 'notice' ? '인증 코드 받기' : submitting ? '처리 중…' : '탈퇴하기'}
        </button>
        {step === 'code' && (
          <>
            <button type="button" onClick={handleResend} disabled={submitting} className="text-sm text-zelo-green hover:underline disabled:opacity-50">
              코드를 못 받았어요. 다시 보내기
            </button>
            <button type="button" onClick={handleBack} disabled={submitting} className="text-sm text-zelo-sub hover:underline disabled:opacity-50">
              처음으로 돌아가기
            </button>
          </>
        )}
      </form>

      <p className="text-sm text-zelo-sub">
        <Link to="/orders" className="text-zelo-green hover:underline">
          탈퇴하지 않고 돌아가기
        </Link>
      </p>
    </div>
  );
}
