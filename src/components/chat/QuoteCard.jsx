import { useEffect, useState } from 'react';
import ProductReason from './ProductReason';

const money = (value) => `${Number(value ?? 0).toLocaleString('ko-KR')}원`;

function productLabel(item) {
  const name = (item.productName || '').trim();
  const unit = (item.productUnit || '').trim();
  const normalize = (value) => value.replace(/\s+/g, '').toLowerCase();
  if (!unit || normalize(name).endsWith(normalize(unit))) return name;
  return `${name} ${unit}`;
}

export default function QuoteCard({ message, disabled, onSubstitute, onBudgetOption, onUpdateItem }) {
  const quote = message.payload;
  const previous = message.quoteCardStatus !== 'ACTIVE';
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const remaining = Math.max(0, Math.ceil((new Date(quote.expiresAt).getTime() - now) / 1000));
  const countdown = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  const inactive = disabled || message.quoteCardStatus !== 'ACTIVE' || new Date(quote.expiresAt).getTime() <= now;
  return (
    <div className="chat-quote-container">
    {previous && <button type="button" className="chat-quote-toggle" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{quote.menuName} · 이전 견적 {expanded ? '접기 ↑' : '보기 ↓'}</button>}
    {(!previous || expanded) && <section className="chat-quote" aria-label={`${quote.menuName} 견적`}>
      <header className="chat-quote-heading">
        <div><small>견적</small><h2>{quote.menuName}</h2></div>
        <span className="chat-tag filled">{message.quoteCardStatus === 'ACTIVE' ? (remaining > 0 ? `진행 중 · ${countdown} 남음` : '만료된 견적') : '이전 견적'}</span>
      </header>
      <div className="chat-quote-body">
        <div className="chat-tags">{(quote.conditions || []).map((condition) => <span className="chat-tag" key={condition}>{condition}</span>)}{quote.budget != null && <span className="chat-tag">예산 {money(quote.budget)}</span>}</div>
        <ul className="chat-items">{quote.items.map((item) => (
          <li key={item.productId}>
            <div className="chat-item-heading">
              <strong>{productLabel(item)}</strong>
              <span>{money(item.unitPrice)} × {item.quantity}</span>
              <b>{money(item.lineAmount)}</b>
            </div>
            <div className="chat-item-actions" role="group" aria-label={`${item.productName} 수량 변경`}>
              <button type="button" disabled={inactive} aria-label={`${item.productName} ${item.quantity === 1 ? '삭제' : '수량 줄이기'}`} title={item.quantity === 1 ? '1개에서 줄이면 상품이 삭제됩니다' : '수량 줄이기'} onClick={() => onUpdateItem(quote.quoteId, item.productId, item.quantity - 1)}>−</button>
              <span aria-label={`현재 수량 ${item.quantity}개`}>{item.quantity}</span>
              <button type="button" disabled={inactive || item.quantity >= 10} aria-label={`${item.productName} 수량 늘리기`} title="최대 10개" onClick={() => onUpdateItem(quote.quoteId, item.productId, item.quantity + 1)}>+</button>
              <button type="button" className="chat-item-remove" disabled={inactive} aria-label={`${item.productName} 삭제`} onClick={() => onUpdateItem(quote.quoteId, item.productId, 0)}>삭제</button>
            </div>
            <ProductReason reason={item.reason} />
          </li>
        ))}</ul>
        {(quote.substitutes || []).map((item) => <div className="chat-substitute" key={item.ingredientName}><p>{item.soldOutProductName} 품절이에요. <b>{item.item.productName} ({money(item.item.lineAmount)})</b>으로 바꿔 담을까요?</p><button disabled={inactive} onClick={() => onSubstitute(quote.quoteId, item.ingredientName, true)} className="filled">좋아요</button><button disabled={inactive} onClick={() => onSubstitute(quote.quoteId, item.ingredientName, false)}>빼 주세요</button></div>)}
        {(quote.excludedItems || []).map((item) => <p className="chat-excluded" key={item.name}>ⓘ {item.name}은 이번 견적에서 제외됐어요.</p>)}
        {quote.overBudget && <div className="chat-budget"><h3>예산보다 {money(quote.totalAmount - quote.budget)} 많아요</h3>{!quote.budgetOptions?.length && <p className="chat-budget-empty">현재 조건과 재고에 맞는 더 저렴한 상품이 없어요. 상품 수량을 줄이거나 일부 상품을 빼서 예산을 맞춰 주세요.</p>}{(quote.budgetOptions || []).map((option) => <div key={option.productId}><p>{quote.items.find((item) => item.productId === option.productId)?.productName} → <b>{option.item.productName} {money(option.item.lineAmount)}</b> <span className="chat-saving">-{money(Math.max(0, (quote.items.find((item) => item.productId === option.productId)?.lineAmount || 0) - option.item.lineAmount))}</span></p><button disabled={inactive} onClick={() => onBudgetOption(quote.quoteId, option.productId)}>이걸로 바꾸기</button></div>)}</div>}
      </div>
      <footer className="chat-quote-total"><div><small>합계 · {quote.items.length}개 상품</small><strong>{money(quote.totalAmount)}</strong></div><button type="button" className="chat-order" disabled title="주문 기능 연결 준비 중">OK. 이대로 주문</button></footer>
    </section>}
    {!previous && <p className="chat-order-note">주문 기능은 준비 중이에요.</p>}
    </div>
  );
}
