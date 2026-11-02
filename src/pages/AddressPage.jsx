import { useEffect, useState } from 'react';
import { createAddress, deleteAddress, getAddresses, updateAddress } from '../api/addresses';
import { errorMessage } from '../api/client';
import { joinAddress, useAddressSearch } from '../components/addressSearch';
import MyTabs from '../components/order/MyTabs';

const EMPTY_FORM = {
    place: '',
    recipientName: '',
    recipientPhone: '',
    zipCode: '',
    baseAddress: '',
    detailAddress: '',
    isDefault: false,
};

// 백엔드 검증과 같음: 하이픈을 모두 쓰거나(010-1234-5678) 아예 안 쓰거나(01012345678)
const PHONE_PATTERN = '01[016-9]-\\d{3,4}-\\d{4}|01[016-9]\\d{7,8}';
const INPUT_CLASS = 'rounded-full border-2 border-zelo-line bg-zelo-ivory px-4 py-2 read-only:text-zelo-sub';
const SMALL_BUTTON_CLASS = 'rounded-full border-2 border-zelo-green px-3 py-1 text-sm font-medium text-zelo-green disabled:opacity-50';

export default function AddressPage() {
    const searchAddress = useAddressSearch(({ zipCode, address }) =>
        setForm((prev) => ({ ...prev, zipCode, baseAddress: address })),
    );
    const [addresses, setAddresses] = useState(null);
    const [error, setError] = useState('');
    // null이면 폼을 닫은 상태, 'new'면 추가, 숫자면 그 배송지 수정
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {
        let ignore = false;
        getAddresses()
            .then((data) => !ignore && setAddresses(data))
            .catch((e) => !ignore && setError(errorMessage(e)));
        return () => {
            ignore = true;
        };
    }, []);

    // 기본 배송지를 바꾸면 다른 배송지도 같이 바뀌어서 변경 후에는 목록을 다시 받음
    async function reload() {
        setAddresses(await getAddresses());
    }

    function openNew() {
        setError('');
        // 주문은 기본 배송지로 배송되므로 첫 배송지는 기본으로 등록함
        setForm({ ...EMPTY_FORM, isDefault: addresses.length === 0 });
        setEditingId('new');
    }

    function openEdit(address) {
        setError('');
        setForm({
            place: address.place,
            recipientName: address.recipientName,
            recipientPhone: address.recipientPhone,
            zipCode: address.zipCode,
            baseAddress: address.address,
            detailAddress: '',
            isDefault: address.isDefault,
        });
        setEditingId(address.addressId);
    }

    function closeForm() {
        setEditingId(null);
        setForm(EMPTY_FORM);
    }

    function changeForm(event) {
        const { name, value, type, checked } = event.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    }

    async function handleSave(event) {
        event.preventDefault();
        const place = form.place.trim();
        // 우편번호 칸은 읽기 전용이라 브라우저의 required 검사가 적용되지 않아 직접 확인함
        if (!form.zipCode) {
            setError('주소 검색으로 우편번호를 넣어 주세요.');
            return;
        }
        if (addresses.some((address) => address.place === place && address.addressId !== editingId)) {
            setError('같은 이름의 배송지가 있어요. 회사2처럼 다른 이름을 써 주세요.');
            return;
        }
        const request = {
            place,
            recipientName: form.recipientName.trim(),
            recipientPhone: form.recipientPhone,
            zipCode: form.zipCode,
            address: joinAddress(form.baseAddress, form.detailAddress),
            isDefault: form.isDefault,
        };
        setError('');
        setSaving(true);
        try {
            if (editingId === 'new') {
                await createAddress(request);
            } else {
                await updateAddress(editingId, request);
            }
            await reload();
            closeForm();
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setSaving(false);
        }
    }

    // 기본 지정 API가 따로 없어서 기존 값 그대로 수정 요청을 보내고 isDefault만 바꿈
    async function handleMakeDefault(address) {
        setError('');
        setBusyId(address.addressId);
        try {
            const { addressId, ...fields } = address;
            await updateAddress(addressId, { ...fields, isDefault: true });
            await reload();
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setBusyId(null);
        }
    }

    async function handleDelete(address) {
        if (!window.confirm(`${address.place} 배송지를 삭제할까요?`)) {
            return;
        }
        setError('');
        setBusyId(address.addressId);
        try {
            await deleteAddress(address.addressId);
            await reload();
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setBusyId(null);
        }
    }

    const sorted = addresses && [...addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
    const editingAddress = addresses?.find((address) => address.addressId === editingId);
    let defaultLockReason = '';
    if (editingId === 'new' && addresses?.length === 0) {
        defaultLockReason = '첫 배송지는 기본 배송지로 등록돼요.';
    } else if (editingAddress?.isDefault) {
        defaultLockReason = '기본 배송지는 다른 배송지를 기본으로 지정하면 해제돼요.';
    }

    return (
        <div className="flex flex-col gap-8">
            <MyTabs />
            <div className="flex flex-col gap-2">
                <p className="font-label text-xs tracking-[.2em] text-zelo-orange">ADDRESS</p>
                <h1 className="font-display text-5xl text-zelo-green">배송지</h1>
                <p className="text-sm text-zelo-sub">주문하면 기본 배송지로 배송돼요.</p>
            </div>

            {error && <p className="text-sm text-zelo-orange">{error}</p>}
            {!addresses && !error && <p className="text-zelo-sub">불러오는 중…</p>}

            {addresses && addresses.length === 0 && editingId === null && (
                <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-zelo-line py-16 text-center text-zelo-sub">
                    <p>등록된 배송지가 없어요</p>
                    <button
                        type="button"
                        onClick={openNew}
                        className="h-11 rounded-full border-2 border-zelo-green px-5 font-medium text-zelo-green"
                    >
                        배송지 추가하기
                    </button>
                </div>
            )}

            {sorted && sorted.length > 0 && (
                <ul className="flex flex-col gap-4">
                    {sorted.map((address) => (
                        <li
                            key={address.addressId}
                            className="flex flex-wrap items-start gap-3 rounded-3xl border-2 border-zelo-green bg-zelo-card px-6 py-5"
                        >
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold">{address.place}</span>
                                    {address.isDefault && (
                                        <span className="rounded-full bg-zelo-green px-2.5 py-0.5 text-xs font-bold text-zelo-ivory">기본</span>
                                    )}
                                </div>
                                <span className="text-sm text-zelo-sub">
                  {address.recipientName} · {address.recipientPhone}
                </span>
                                <span className="text-sm text-zelo-sub">
                  ({address.zipCode}) {address.address}
                </span>
                            </div>
                            <div className="flex shrink-0 gap-2">
                                {!address.isDefault && (
                                    <button
                                        type="button"
                                        disabled={busyId === address.addressId || saving}
                                        onClick={() => handleMakeDefault(address)}
                                        className={SMALL_BUTTON_CLASS}
                                    >
                                        기본으로
                                    </button>
                                )}
                                <button
                                    type="button"
                                    disabled={busyId === address.addressId || saving}
                                    onClick={() => openEdit(address)}
                                    className={SMALL_BUTTON_CLASS}
                                >
                                    수정
                                </button>
                                {!address.isDefault && (
                                    <button
                                        type="button"
                                        disabled={busyId === address.addressId || saving}
                                        onClick={() => handleDelete(address)}
                                        className={SMALL_BUTTON_CLASS}
                                    >
                                        삭제
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                    {editingId === null && (
                        <li>
                            <button
                                type="button"
                                onClick={openNew}
                                className="w-full rounded-3xl border-2 border-dashed border-zelo-green py-5 font-medium text-zelo-green"
                            >
                                + 배송지 추가
                            </button>
                        </li>
                    )}
                </ul>
            )}

            {editingId !== null && (
                <form
                    onSubmit={handleSave}
                    className="flex max-w-2xl flex-col gap-3 rounded-3xl border-2 border-zelo-green bg-zelo-card p-6"
                >
                    <h2 className="font-display text-2xl text-zelo-green">{editingId === 'new' ? '배송지 추가' : '배송지 수정'}</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <input
                            name="place"
                            value={form.place}
                            onChange={changeForm}
                            placeholder="배송지 이름 (예: 집, 회사)"
                            maxLength={20}
                            required
                            className={INPUT_CLASS}
                        />
                        <input
                            name="recipientName"
                            value={form.recipientName}
                            onChange={changeForm}
                            placeholder="받는 분"
                            maxLength={50}
                            required
                            className={INPUT_CLASS}
                        />
                        <input
                            type="tel"
                            name="recipientPhone"
                            value={form.recipientPhone}
                            onChange={changeForm}
                            placeholder="휴대폰 번호"
                            pattern={PHONE_PATTERN}
                            title="010-1234-5678 또는 01012345678"
                            required
                            className={INPUT_CLASS}
                        />
                    </div>
                    <div className="flex gap-2">
                        <input
                            name="zipCode"
                            value={form.zipCode}
                            placeholder="우편번호"
                            readOnly
                            className={`${INPUT_CLASS} w-36`}
                        />
                        <button
                            type="button"
                            onClick={searchAddress}
                            className="h-11 rounded-full border-2 border-zelo-green px-4 font-medium text-zelo-green"
                        >
                            주소 검색
                        </button>
                    </div>
                    <input
                        name="baseAddress"
                        value={form.baseAddress}
                        onChange={changeForm}
                        placeholder="주소"
                        required
                        className={INPUT_CLASS}
                    />
                    <input
                        name="detailAddress"
                        value={form.detailAddress}
                        onChange={changeForm}
                        placeholder="상세 주소 (동, 호수)"
                        maxLength={100}
                        className={INPUT_CLASS}
                    />
                    <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                            type="checkbox"
                            name="isDefault"
                            checked={form.isDefault}
                            onChange={changeForm}
                            disabled={Boolean(defaultLockReason)}
                            className="size-4 accent-zelo-green"
                        />
                        기본 배송지로 설정
                    </label>
                    {defaultLockReason && <p className="text-xs text-zelo-sub">{defaultLockReason}</p>}
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="h-11 rounded-full bg-zelo-green px-5 font-medium text-zelo-ivory disabled:opacity-50"
                        >
                            {saving ? '저장 중…' : '저장'}
                        </button>
                        <button
                            type="button"
                            disabled={saving}
                            onClick={closeForm}
                            className="h-11 rounded-full border-2 border-zelo-green px-5 font-medium text-zelo-green disabled:opacity-50"
                        >
                            취소
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}