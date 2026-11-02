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
        // 포트원 창의 오류 문구는 영어 코드가 섞여 있어 사용자에게는 한글 안내만 보여 줌
        throw new Error('카드 등록이 완료되지 않았어요.');
    }
    return response.billingKey;
}

export async function confirmPayment(portoneId) {
    const res = await client.post(`/api/payments/${portoneId}/confirm`);
    return res.data.data;
}

export async function payWithPaymentMethod(portoneId, paymentMethodId) {
    const res = await client.post(`/api/payments/${portoneId}/payment-method`, { paymentMethodId });
    return res.data.data;
}

// 같은 견적으로는 주문을 다시 만들 수 없어서, 결제가 끝나지 않은 주문은 결제 ID만 새로 받음
export async function retryPayment(orderId) {
    const res = await client.post('/api/payments', { orderId });
    return res.data.data;
}

// 일반결제 창(KG이니시스)을 띄움. 결제 확정은 서버가 포트원에 다시 확인하고, 창 결과는 그만뒀는지 안내할 때만 씀
export async function requestCardPayment({ portoneId, orderName, totalAmount, customer }) {
    const storeId = import.meta.env.VITE_PORTONE_STORE_ID;
    const channelKey = import.meta.env.VITE_PORTONE_PAYMENT_CHANNEL_KEY;
    if (!storeId || !channelKey) {
        throw new Error('포트원 설정(.env)이 없어요');
    }
    return PortOne.requestPayment({
        storeId,
        channelKey,
        paymentId: portoneId,
        orderName,
        totalAmount,
        currency: 'CURRENCY_KRW',
        payMethod: 'CARD',
        customer: { customerId: currentUserId(), ...customer },
    });
}