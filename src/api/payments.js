import * as PortOne from '@portone/browser-sdk/v2';
import { useAuthStore } from '../store/authStore';
import { client } from './client';

export async function getPaymentMethods() {
    const res = await client.get('/api/payment-methods');
    return res.data.data;
}

export async function createPaymentMethod(billingKey) {
    const res = await client.post('/api/payment-methods', { billingKey });
    return res.data.data;
}

export async function deletePaymentMethod(paymentMethodId) {
    await client.delete(`/api/payment-methods/${paymentMethodId}`);
}

// 서버가 빌링키를 발급받은 고객과 로그인 사용자를 비교하므로 토큰의 사용자 ID를 customerId로 넣음
function currentUserId() {
    const { accessToken } = useAuthStore.getState();
    const payload = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return String(JSON.parse(atob(payload)).sub);
}

// 포트원 카드 등록창을 띄워 빌링키를 받음. 본인 정보는 등록창이 직접 받고, 창을 닫거나 실패하면 에러를 던짐
export async function issueBillingKey() {
    const storeId = import.meta.env.VITE_PORTONE_STORE_ID;
    const channelKey = import.meta.env.VITE_PORTONE_BILLING_CHANNEL_KEY;
    if (!storeId || !channelKey) {
        throw new Error('포트원 설정(.env)이 없어요');
    }
    const response = await PortOne.requestIssueBillingKey({
        storeId,
        channelKey,
        billingKeyMethod: 'CARD',
        issueId: `issue-${Date.now()}`,
        issueName: 'zelo 카드 등록',
        customer: { customerId: currentUserId() },
    });
    if (!response || response.code) {
        throw new Error(response?.message || '카드 등록이 취소됐어요');
    }
    return response.billingKey;
}