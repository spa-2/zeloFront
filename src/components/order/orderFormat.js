export function formatMoney(amount) {
    return `${(amount ?? 0).toLocaleString()}원`;
}

// 백엔드 LocalDateTime은 시간대 없이 오므로 브라우저 시간(한국) 기준으로 읽음
export function formatDateTime(value) {
    if (!value) {
        return null;
    }
    return new Date(value).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}