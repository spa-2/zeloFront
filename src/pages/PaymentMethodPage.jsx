import { useEffect, useState } from 'react';
import { errorMessage } from '../api/client';
import { createPaymentMethod, deletePaymentMethod, getPaymentMethods, issueBillingKey } from '../api/payments';
import MyTabs from '../components/order/MyTabs';

export default function PaymentMethodPage() {
    const [methods, setMethods] = useState(null);
    const [error, setError] = useState('');
    const [registering, setRegistering] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        let ignore = false;
        getPaymentMethods()
            .then((data) => !ignore && setMethods(data))
            .catch((e) => !ignore && setError(errorMessage(e)));
        return () => {
            ignore = true;
        };
    }, []);

    async function handleRegister() {
        setError('');
        setRegistering(true);
        try {
            const billingKey = await issueBillingKey();
            const created = await createPaymentMethod(billingKey);
            setMethods((prev) => [...(prev ?? []), created]);
        } catch (e) {
            // 포트원 등록창 오류는 서버 응답이 없어 에러 자체의 문구를 보여 줌
            setError(errorMessage(e, e.message));
        } finally {
            setRegistering(false);
        }
    }

    async function handleDelete(method) {
        if (!window.confirm(`${method.displayName}을(를) 삭제할까요?`)) {
            return;
        }
        setError('');
        setDeletingId(method.paymentMethodId);
        try {
            await deletePaymentMethod(method.paymentMethodId);
            setMethods((prev) => prev.filter((m) => m.paymentMethodId !== method.paymentMethodId));
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="flex flex-col gap-8">
            <MyTabs />
            <div className="flex flex-col gap-2">
                <p className="font-label text-xs tracking-[.2em] text-zelo-orange">PAYMENT</p>
                <h1 className="font-display text-5xl text-zelo-green">결제 수단</h1>
                <p className="text-sm text-zelo-sub">등록한 카드는 주문할 때 결제창 없이 바로 결제할 수 있어요.</p>
            </div>

            {error && <p className="text-sm text-zelo-orange">{error}</p>}
            {!methods && !error && <p className="text-zelo-sub">불러오는 중…</p>}

            {methods && methods.length === 0 && (
                <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-zelo-line py-16 text-center text-zelo-sub">
                    <p>등록된 카드가 없어요</p>
                    <button
                        type="button"
                        disabled={registering}
                        onClick={handleRegister}
                        className="h-11 rounded-full border-2 border-zelo-green px-5 font-medium text-zelo-green disabled:opacity-50"
                    >
                        {registering ? '등록 중…' : '카드 등록하기'}
                    </button>
                </div>
            )}

            {methods && methods.length > 0 && (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {methods.map((method) => (
                        <li
                            key={method.paymentMethodId}
                            className="flex min-h-36 flex-col justify-between rounded-3xl border-2 border-zelo-green bg-zelo-green p-5 text-zelo-ivory"
                        >
                            <span className="font-label text-xs tracking-[.15em]">{method.type}</span>
                            <span className="font-display text-2xl">{method.displayName}</span>
                            <button
                                type="button"
                                disabled={deletingId === method.paymentMethodId}
                                onClick={() => handleDelete(method)}
                                className="self-end rounded-full border-2 border-zelo-ivory px-3 py-1 text-sm font-medium disabled:opacity-50"
                            >
                                {deletingId === method.paymentMethodId ? '삭제 중…' : '삭제'}
                            </button>
                        </li>
                    ))}
                    <li>
                        <button
                            type="button"
                            disabled={registering}
                            onClick={handleRegister}
                            className="flex h-full min-h-36 w-full flex-col items-center justify-center gap-1 rounded-3xl border-2 border-dashed border-zelo-green font-medium text-zelo-green disabled:opacity-50"
                        >
                            <span className="text-2xl">+</span>
                            {registering ? '등록 중…' : '카드 등록'}
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
}