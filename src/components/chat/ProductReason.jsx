export default function ProductReason({ reason }) {
  if (!reason) return null;

  const conditions = reason.matchedConditions || [];
  const mentions = (reason.keywordMentions || []).filter((mention) => mention.count > 0);
  const hasRating = reason.avgRating != null && reason.reviewCount >= 5;
  const hasBadges = conditions.length > 0 || hasRating || mentions.length > 0;

  return (
    <div className="chat-product-reason" aria-label="상품 추천 근거">
      {hasBadges && (
        <div className="chat-reason-badges">
          {conditions.length > 0 && (
            <span className="chat-reason-badge matched"><span aria-hidden="true">✓</span> 조건 맞음 · {conditions.join(' · ')}</span>
          )}
          {hasRating && (
            <span className="chat-reason-badge" aria-label={`평점 ${Number(reason.avgRating).toFixed(1)}점, 리뷰 ${reason.reviewCount}개`}>
              <span aria-hidden="true">☆</span> {Number(reason.avgRating).toFixed(1)} <span className="chat-reason-count">({reason.reviewCount.toLocaleString('ko-KR')})</span>
            </span>
          )}
          {mentions.map((mention) => (
            <span className="chat-reason-badge" key={mention.condition}>‘{mention.condition}’ 언급 {mention.count.toLocaleString('ko-KR')}건</span>
          ))}
        </div>
      )}
      {reason.conditionSoldOut && <p className="chat-reason-notice">요청 조건에 맞는 상품이 품절되어 다른 상품을 골랐어요.</p>}
      {reason.summary && (
        <p className="chat-reason-summary">
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M4 3.5h12a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H8l-4.5 3v-3A1.5 1.5 0 0 1 2 13V5a1.5 1.5 0 0 1 2-1.5Z" /></svg>
          <span><span className="chat-reason-summary-label">리뷰 요약</span>{reason.summary}</span>
        </p>
      )}
      {!hasRating && !reason.summary && <p className="chat-reason-empty">{reason.reviewCount != null && reason.reviewCount < 5 ? '아직 리뷰가 적어요.' : '아직 표시할 리뷰 근거가 없어요.'}</p>}
    </div>
  );
}
