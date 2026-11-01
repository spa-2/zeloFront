import { useState } from 'react';
import { errorMessage } from '../../api/client';
import { createRefund } from '../../api/refunds';
import { formatMoney } from './orderFormat';

const REASON_MAX_LENGTH = 50;
const STEP_BUTTON =
    'flex h-7 w-7 items-center justify-center rounded-full border-2 border-zelo-green font-bold text-zelo-green disabled:opacity-30';

// 처음엔 남은 수량을 전부 골라 둬서, 그대로 요청하면 전액 환불이 됨
function initialQuantities(items) {
    return Object.fromEntries(items.map((item) => [item.orderItemId, item.cancelableQuantity]));
}

// 서버도 같은 조건을 검사하지만, 안 되는 주문에는 버튼을 아예 보여 주지 않음
function isRefundable(order) {
    return (
        order.payment?.paymentStatus === 'PAID' &&
        order.delivery?.deliveryStatus === 'READY' &&
        order.refund?.refundStatus !== 'REQUESTED' &&
        order.items.some((item) => item.cancelableQuantity > 0)
    );
}

export default function RefundForm({ order, onDone }) {
    const [open, setOpen] = useState(false);
    const [quantities, setQuantities] = useState({});
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const items = order.items.filter((item) => item.cancelableQuantity > 0);
    const selected = items.filter((item) => quantities[item.orderItemId] > 0);
    const amount = selected.reduce((sum, item) => sum + item.unitPrice * quantities[item.orderItemId], 0);

    function openForm() {
        setQuantities(initialQuantities(items));
        setReason('');
        setError('');
        setNotice('');
        setOpen(true);
    }

    function changeQuantity(item, diff) {
        setQuantities((prev) => {
            const next = Math.min(item.cancelableQuantity, Math.max(0, prev[item.orderItemId] + diff));
            return { ...prev, [item.orderItemId]: next };
        });
    }

    function selectAll(all) {
        setQuantities(all ? initialQuantities(items) : Object.fromEntries(items.map((item) => [item.orderItemId, 0])));
    }

    async function submit(event) {
        event.preventDefault();
        setError('');
        setBusy(true);
        try {
            const result = await createRefund(order.orderId, {
                reason: reason.trim(),
                items: selected.map((item) => ({ orderItemId: item.orderItemId, quantity: quantities[item.orderItemId] })),
            });
            if (result.status === 'FAILED') {
                setError(result.message);
                return;
            }
            // 처리 중(REQUESTED)이어도 웹훅이 마저 반영하므로 폼은 닫고 상세를 다시 불러옴
            setNotice(result.message);
            setOpen(false);
            onDone();
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setBusy(false);
        }
    }

    if (!open) {
        return (
            <div className="flex flex-col gap-2">
                {notice && <p className="text-sm text-zelo-green">{notice}</p>}
                {isRefundable(order) && (
                    <button
                        type="button"
                        onClick={openForm}
                        className="self-start rounded-full border-2 border-zelo-orange px-4 py-1.5 text-sm font-medium text-zelo-orange"
                    >
                        환불 요청
                    </button>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl border-2 border-zelo-orange p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-zelo-orange">환불 요청</h3>
                <div className="flex gap-2 text-xs font-medium text-zelo-green">
                    <button type="button" disabled={busy} onClick={() => selectAll(true)} className="hover:underline">
                        전체 선택
                    </button>
                    <button type="button" disabled={busy} onClick={() => selectAll(false)} className="hover:underline">
                        전체 해제
                    </button>
                </div>
            </div>
            <p className="text-sm text-zelo-sub">환불할 상품과 수량을 골라 주세요. 출고 전에만 할 수 있어요.</p>

            <ul className="flex flex-col divide-y divide-zelo-line">
                {items.map((item) => {
                    const quantity = quantities[item.orderItemId] ?? 0;
                    return (
                        <li key={item.orderItemId} className="flex items-center gap-3 py-2 text-sm">
                            <div className={`flex min-w-0 flex-1 flex-col ${quantity === 0 ? 'text-zelo-sub' : ''}`}>
                                <span className="truncate font-medium">{item.productName}</span>
                                <span className="text-xs text-zelo-sub">남은 수량 {item.cancelableQuantity}개</span>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <button
                                    type="button"
                                    aria-label={`${item.productName} 환불 수량 줄이기`}
                                    disabled={busy || quantity === 0}
                                    onClick={() => changeQuantity(item, -1)}
                                    className={STEP_BUTTON}
                                >
                                    −
                                </button>
                                <span className="w-6 text-center font-bold">{quantity}</span>
                                <button
                                    type="button"
                                    aria-label={`${item.productName} 환불 수량 늘리기`}
                                    disabled={busy || quantity >= item.cancelableQuantity}
                                    onClick={() => changeQuantity(item, 1)}
                                    className={STEP_BUTTON}
                                >
                                    +
                                </button>
                            </div>
                            <span className="w-20 shrink-0 text-right">{formatMoney(item.unitPrice * quantity)}</span>
                        </li>
                    );
                })}
            </ul>

            <label className="flex flex-col gap-1 text-sm">
                <span className="text-zelo-sub">
                    환불 사유 ({reason.length}/{REASON_MAX_LENGTH})
                </span>
                <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={REASON_MAX_LENGTH}
                    placeholder="예: 단순 변심"
                    className="rounded-xl border-2 border-zelo-line bg-transparent px-3 py-2 outline-none focus:border-zelo-green"
                />
            </label>

            <div className="flex items-baseline justify-between border-t-2 border-zelo-green pt-3">
                <span className="text-sm text-zelo-sub">예상 환불 금액 · {selected.length}개 상품</span>
                <span className="font-logo text-2xl tracking-[.02em] text-zelo-green">{formatMoney(amount)}</span>
            </div>

            {error && <p className="text-sm text-zelo-orange">{error}</p>}

            <div className="flex gap-2">
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => setOpen(false)}
                    className="h-11 rounded-full border-2 border-zelo-green px-5 font-medium text-zelo-green disabled:opacity-50"
                >
                    취소
                </button>
                <button
                    type="submit"
                    disabled={busy || selected.length === 0 || !reason.trim()}
                    className="h-11 flex-1 rounded-full bg-zelo-orange px-5 font-medium text-zelo-ivory disabled:opacity-50"
                >
                    {busy ? '요청 중…' : '환불 요청'}
                </button>
            </div>
        </form>
    );
}