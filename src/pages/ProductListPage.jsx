import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { getCategories, searchProducts } from '../api/products';
import ProductCard from '../components/ProductCard';
import ProductSearchBox from '../components/ProductSearchBox';

const SORTS = [
  { value: 'SALES', label: '판매량순' },
  { value: 'PRICE_ASC', label: '낮은 가격순' },
  { value: 'PRICE_DESC', label: '높은 가격순' },
  { value: 'LATEST', label: '최신순' },
];

// 검색 조건은 주소에 둬서 상세 갔다가 뒤로 와도 그대로 남음
export default function ProductListPage() {
  const [params, setParams] = useSearchParams();
  const keyword = params.get('keyword') ?? '';
  const categoryId = params.get('categoryId') ?? '';
  const sort = params.get('sort') ?? 'SALES';
  const inStock = params.get('inStock') === 'true';
  const page = Number(params.get('page') ?? 0);

  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let ignore = false;
    searchProducts({ keyword, categoryId: categoryId || undefined, inStock, sort, page })
      .then((data) => {
        if (!ignore) {
          setResult(data);
          setError('');
        }
      })
      .catch((e) => !ignore && setError(errorMessage(e)));
    return () => {
      ignore = true;
    };
  }, [keyword, categoryId, sort, inStock, page]);

  // 조건을 바꾸면 첫 페이지로 돌아감. 빈 값은 주소에서 뺌
  function update(changes) {
    const next = new URLSearchParams(params);
    Object.entries({ page: '', ...changes }).forEach(([key, value]) => {
      if (value === '' || value === false) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    setParams(next);
  }

  // 페이지를 넘기면 맨 위부터 보이게
  function goToPage(nextPage) {
    update({ page: nextPage });
    window.scrollTo(0, 0);
  }

  // 지금 고른 카테고리가 속한 상위 카테고리 (하위 칩을 보여 줄 때 씀)
  const parent = categories.find(
    (c) => String(c.categoryId) === categoryId || c.children.some((child) => String(child.categoryId) === categoryId),
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="font-label text-xs tracking-[.2em] text-zelo-orange">SHOP ALL</p>
        <h1 className="font-display text-5xl text-zelo-green">{keyword ? `'${keyword}' 검색 결과` : '전체 상품'}</h1>
      </div>

      <ProductSearchBox key={keyword} initialKeyword={keyword} onSearch={(value) => update({ keyword: value })} />

      <section className="flex flex-col gap-3" aria-label="카테고리">
        <div className="cats">
          <button type="button" className={`cat${categoryId ? '' : ' on'}`} onClick={() => update({ categoryId: '' })}>
            전체
          </button>
          {categories.map((c) => (
            <button
              key={c.categoryId}
              type="button"
              className={`cat${parent?.categoryId === c.categoryId ? ' on' : ''}`}
              onClick={() => update({ categoryId: c.categoryId })}
            >
              {c.name}
            </button>
          ))}
        </div>
        {parent && parent.children.length > 0 && (
          <div className="flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={() => update({ categoryId: parent.categoryId })}
              className={`rounded-full px-3 py-1 font-medium ${String(parent.categoryId) === categoryId ? 'bg-zelo-orange text-zelo-ivory' : 'text-zelo-green hover:underline'}`}
            >
              {parent.name} 전체
            </button>
            {parent.children.map((child) => (
              <button
                key={child.categoryId}
                type="button"
                onClick={() => update({ categoryId: child.categoryId })}
                className={`rounded-full px-3 py-1 font-medium ${String(child.categoryId) === categoryId ? 'bg-zelo-orange text-zelo-ivory' : 'text-zelo-green hover:underline'}`}
              >
                {child.name}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4" aria-label="상품 목록">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {result && <span className="font-medium text-zelo-sub">{result.totalElements.toLocaleString()}개</span>}
          <label className="ml-auto flex items-center gap-2 font-medium">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => update({ inStock: e.target.checked })}
              className="size-4 accent-zelo-green"
            />
            재고 있는 상품만
          </label>
          <select
            value={sort}
            onChange={(e) => update({ sort: e.target.value })}
            aria-label="정렬"
            className="h-10 rounded-full border-2 border-zelo-green bg-zelo-card px-4 font-medium text-zelo-green"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-zelo-orange">{error}</p>}
        {result && result.content.length === 0 && (
          <p className="rounded-3xl border-2 border-dashed border-zelo-line py-16 text-center text-zelo-sub">찾는 상품이 없어요</p>
        )}
        {result && result.content.length > 0 && (
          <div className="product-grid">
            {result.content.map((product) => (
              <ProductCard key={product.productCode} product={product} />
            ))}
          </div>
        )}
        {result && result.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-4 font-medium">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => goToPage(page - 1)}
              className="h-11 rounded-full border-2 border-zelo-green px-5 text-zelo-green disabled:opacity-30"
            >
              이전
            </button>
            <span className="font-label text-sm text-zelo-green">
              {page + 1} / {result.totalPages}
            </span>
            <button
              type="button"
              disabled={page + 1 >= result.totalPages}
              onClick={() => goToPage(page + 1)}
              className="h-11 rounded-full border-2 border-zelo-green px-5 text-zelo-green disabled:opacity-30"
            >
              다음
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
