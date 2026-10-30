import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { searchProducts } from '../api/products';

// 상품 API 연결 확인용으로 검색·목록만 붙여둠. 화면 디자인은 나중에 채움
export default function ProductListPage() {
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    searchProducts({ keyword: query })
      .then((result) => !ignore && setPage(result))
      .catch((e) => !ignore && setError(errorMessage(e)));
    return () => {
      ignore = true;
    };
  }, [query]);

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError('');
          setQuery(keyword.trim());
        }}
        className="mb-4 flex gap-2"
      >
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="상품 검색 (예: 김치)"
          className="flex-1 rounded border border-stone-300 px-3 py-2"
        />
        <button type="submit" className="rounded bg-emerald-700 px-4 font-semibold text-white">
          검색
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {page && (
        <>
          <p className="mb-2 text-sm text-stone-500">{page.totalElements}개</p>
          <ul className="divide-y divide-stone-200 rounded border border-stone-200 bg-white">
            {page.content.map((product) => (
              <li key={product.productCode}>
                <Link to={`/products/${product.productCode}`} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50">
                  <span className="flex-1">
                    <span className="block font-medium">{product.name}</span>
                    <span className="text-xs text-stone-500">
                      {product.brand} · {product.categoryName}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-semibold">{product.price.toLocaleString()}원</span>
                    <span className="text-xs text-stone-500">
                      {product.availableQuantity > 0 ? `재고 ${product.availableQuantity}` : '품절'}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
