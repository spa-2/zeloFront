import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { getProduct } from '../api/products';

export default function ProductDetailPage() {
  const { productCode } = useParams();
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

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }
  if (!product) {
    return <p className="text-sm text-stone-500">불러오는 중…</p>;
  }
  return (
    <div>
      <Link to="/products" className="text-sm text-stone-500">← 상품 목록</Link>
      <h1 className="mt-2 text-xl font-bold">{product.name}</h1>
      <p className="text-sm text-stone-500">{product.brand}</p>
      <p className="mt-4 text-lg font-semibold">{product.price.toLocaleString()}원</p>
      {/* 키워드·리뷰 근거 등 상세 항목은 화면 정할 때 채움 */}
      <pre className="mt-6 overflow-x-auto rounded bg-stone-100 p-3 text-xs">{JSON.stringify(product, null, 2)}</pre>
    </div>
  );
}
