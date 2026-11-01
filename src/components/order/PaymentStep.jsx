import { useEffect, useState } from 'react';
import { getAddresses } from '../../api/addresses';
import { errorMessage } from '../../api/client';
import { createConfirmation, createOrder } from '../../api/orders';
import {
    confirmPayment,
    createPaymentMethod,
    getPaymentMethods,
    issueBillingKey,
    payWithPaymentMethod,
    requestCardPayment,
    retryPayment,
} from '../../api/payments';
import { formatMoney } from './orderFormat';

// 백엔드는 주문 생성 30분 뒤까지만 재결제를 받음 (Order.PAYMENT_EXPIRATION_MINUTES)
const ORDER_PAYMENT_MINUTES = 30;
const BUTTON_BASE = 'h-11 w-full rounded-full border-2 border-zelo-green px-5 font-medium disabled:opacity-50';

function formatRemaining(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
}

// KG이니시스 결제창이 구매자 이름과 연락처를 요구해서 기본 배송지의 받는 분 정보를 넘김
async function loadCustomer() {
    const addresses = await getAddresses();
    const address = addresses.find((item) => item.isDefault);
    return address ? { fullName: address.recipientName, phoneNumber: address.recipientPhone } : {};
}

// 견적에서 처음 결제하면 quote를, 결제 실패 카드에서 다시 결제하면 이미 만든 주문(placedOrder)을 받음
export default function PaymentStep({ roomId, quote, placedOrder, onDone }) {
    const [methods, setMethods] = useState(null);
    const [order, setOrder] = useState(placedOrder ?? null);
    const [now, setNow] = useState(() => Date.now());
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [loadFailed, setLoadFailed] = useState(false);

    // 주문 전에는 견적 만료 시각까지, 주문 후에는 주문 결제 기한까지 결제할 수 있음
    const deadline = order
        ? new Date(order.createdAt).getTime() + ORDER_PAYMENT_MINUTES * 60 * 1000
        : new Date(quote.expiresAt).getTime();
    const expired = now >= deadline;
    const totalAmount = order?.totalAmount ?? quote.totalAmount;

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let ignore = false;
        getPaymentMethods()
            // 백엔드는 등록 순서대로 주므로 뒤집어서 최근 등록 카드를 맨 위에 둠
            .then((data) => !ignore && setMethods([...data].reverse()))
            .catch(() => !ignore && setLoadFailed(true));
        return () => {
            ignore = true;
        };
    }, []);

    async function reloadMethods() {
        setLoadFailed(false);
        try {
            const data = await getPaymentMethods();
            setMethods([...data].reverse());
        } catch {
            setLoadFailed(true);
        }
    }

    // 같은 견적으로는 주문을 한 번만 만들 수 있어서, 이미 만든 주문은 재결제 API로 결제 ID만 새로 받음
    async function preparePayment() {
        if (!order) {
            const confirmation = await createConfirmation(roomId, quote.quoteId);
            const created = await createOrder(quote.quoteId, confirmation.confirmationId);
            setOrder(created);
            return created;
        }
        const retry = await retryPayment(order.orderId);
        return { ...order, portoneId: retry.portoneId, paymentStatus: retry.status };
    }

    // 결제창 결과는 믿지 않고, 창이 닫히면 성공·실패와 관계없이 서버에 확인을 맡김
    async function payWithWindow(target) {
        const response = await requestCardPayment({
            portoneId: target.portoneId,
            orderName: target.orderName,
            totalAmount: target.totalAmount,
            customer: await loadCustomer(),
        });
        const result = await confirmPayment(target.portoneId);
        // 창을 그냥 닫으면 서버가 확인 대기를 줄 수 있어서, 창에서 오류가 왔으면 완료로 보지 않음
        if (response?.code && result.status !== 'PAID') {
            return { ...result, status: 'NOT_COMPLETED', message: response.message ?? '결제가 완료되지 않았어요.' };
        }
        return result;
    }

    async function pay(method) {
        setError('');
        setBusy(true);
        try {
            const target = await preparePayment();
            if (target.paymentStatus === 'PAID') {
                onDone();
                return;
            }
            const result = method
                ? await payWithPaymentMethod(target.portoneId, method.paymentMethodId)
                : await payWithWindow(target);
            // 확인 대기(CONFIRM_PENDING)는 웹훅이 마저 반영하므로 결제 단계는 여기서 끝냄
            if (result.status === 'PAID' || result.status === 'CONFIRM_PENDING') {
                onDone();
                return;
            }
            setError(result.message);
        } catch (e) {
            // 포트원 창 오류는 서버 응답이 없어 에러 자체의 문구를 보여 줌
            setError(errorMessage(e, e.message));
        } finally {
            setBusy(false);
        }
    }

    async function registerCard() {
        setError('');
        setBusy(true);
        try {
            const created = await createPaymentMethod(await issueBillingKey());
            setMethods((prev) => [created, ...(prev ?? [])]);
        } catch (e) {
            setError(errorMessage(e, e.message));
        } finally {
            setBusy(false);
        }
    }

    if (expired) {
        return (
            <section className="flex max-w-md flex-col gap-2 rounded-3xl border-2 border-zelo-line bg-zelo-card p-5">
                <p className="font-medium text-zelo-orange">시간이 초과됐어요. 새 견적을 받아 주세요.</p>
            </section>
        );
    }

    return (
        <section className="flex max-w-md flex-col gap-3 rounded-3xl border-2 border-zelo-green bg-zelo-card p-5">
            <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-xl text-zelo-green">결제 · {formatMoney(totalAmount)}</h3>
                <span className="font-label text-xs text-zelo-sub">{formatRemaining(deadline - now)}</span>
            </div>

            {/* 목록을 못 불러왔을 때만 다시 불러오기가 의미 있음. 결제 실패는 결제 수단을 다시 고르면 재결제됨 */}
            {loadFailed && (
                <div className="flex flex-col gap-2 text-sm text-zelo-orange">
                    <p>카드 목록을 불러오지 못했어요.</p>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={reloadMethods}
                        className="self-start rounded-full border-2 border-zelo-green px-3 py-1 font-medium text-zelo-green disabled:opacity-50"
                    >
                        다시 시도
                    </button>
                </div>
            )}
            {error && (
                <div className="text-sm text-zelo-orange">
                    <p>{error}</p>
                    {order && <p>결제 수단을 다시 골라 주세요.</p>}
                </div>
            )}
            {!methods && !loadFailed && <p className="text-sm text-zelo-sub">카드를 불러오는 중…</p>}

            {methods && methods.length === 0 && (
                <p className="rounded-2xl border-2 border-dashed border-zelo-orange p-3 text-sm text-zelo-orange">
                    등록된 카드가 없어요. 카드를 등록하거나 일반결제를 골라 주세요.
                </p>
            )}

            {methods?.map((method, index) => (
                <button
                    key={method.paymentMethodId}
                    type="button"
                    disabled={busy}
                    onClick={() => pay(method)}
                    className={`${BUTTON_BASE} ${index === 0 ? 'bg-zelo-green text-zelo-ivory' : 'text-zelo-green'}`}
                >
                    {method.displayName}로 결제
                </button>
            ))}
            <button type="button" disabled={busy} onClick={() => pay(null)} className={`${BUTTON_BASE} text-zelo-green`}>
                다른 카드로 결제
            </button>
            <button
                type="button"
                disabled={busy}
                onClick={registerCard}
                className={`${BUTTON_BASE} border-dashed text-zelo-green`}
            >
                + 새 카드 등록
            </button>
            {busy && <p className="text-sm text-zelo-sub">처리 중이에요…</p>}
        </section>
    );
}