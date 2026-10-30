import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { getProduct } from '../api/products';
import { KEYWORD_LABELS } from '../constants/keywords';
import '../styles/products.css';

function stockText(product) {
  if (product.status === 'STOP_SALE') {
    return '판매 중지된 상품이에요';
  }
  if ((product.availableQuantity ?? 0) <= 0) {
    return '품절';
  }
  return `재고 ${product.availableQuantity}개`;
}

export default function ProductDetailPage() {
  const { productCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    getProduct(productCode)
      .then((result) => !ignore && setProduct(result))
      .catch((e) => !ignore && setError(errorMessage(e, '상품을 찾을 수 없어요')));
    return () => {
      ignore = true;
    };
  }, [productCode]);

  // 목록에서 왔으면 뒤로 가서 검색 조건을 살리고, 주소로 바로 들어왔으면 목록으로
  function goBack() {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/products');
    }
  }

  const backButton = (
    <button type="button" onClick={goBack} className="self-start font-medium text-zelo-green hover:underline">
      ← 상품 목록
    </button>
  );

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        {backButton}
        <p className="text-zelo-orange">{error}</p>
      </div>
    );
  }
  if (!product) {
    return <p className="text-zelo-sub">불러오는 중…</p>;
  }
  const unavailable = product.status === 'STOP_SALE' || (product.availableQuantity ?? 0) <= 0;
  return (
    <div className="flex flex-col gap-6">
      {backButton}
      <article className="flex flex-wrap overflow-hidden rounded-[28px] border-2 border-zelo-green bg-zelo-card shadow-[8px_10px_0_rgba(4,106,56,.14)]">
        <div className={`product-thumb min-w-0 flex-[1_1_320px] !border-b-0 md:!border-r-2 ${unavailable ? 'grayscale' : ''}`}>
          <span className="!text-4xl">{product.categoryName}</span>
        </div>
        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4 p-8">
          <p className="font-label text-xs tracking-[.2em] text-zelo-orange">{product.categoryName}</p>
          <div>
            <h1 className="font-display text-4xl text-zelo-green">{product.name}</h1>
            <p className="mt-1 text-zelo-sub">{product.brand}</p>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-logo text-4xl tracking-[.02em] text-zelo-orange">{product.price.toLocaleString()}원</span>
            <span className="text-zelo-sub">/ {product.unitLabel}</span>
          </div>
          <p className={`font-medium ${unavailable ? 'text-zelo-orange' : 'text-zelo-green'}`}>{stockText(product)}</p>
          {product.keywords?.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {product.keywords.map((keyword) => (
                <li key={keyword} className="rounded-full border-2 border-zelo-green px-3 py-1 text-sm font-bold text-zelo-green">
                  {KEYWORD_LABELS[keyword] ?? keyword}
                </li>
              ))}
            </ul>
          )}
          {product.description && <p className="whitespace-pre-line leading-relaxed text-zelo-ink/80">{product.description}</p>}
          <p className="mt-auto rounded-2xl bg-zelo-ivory px-4 py-3 text-sm text-zelo-sub">
            장보기는 AI 채팅에서 메뉴를 말하면 이 상품도 골라 담아 드려요.
          </p>
        </div>
      </article>
    </div>
  );
}
