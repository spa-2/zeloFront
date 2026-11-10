import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAutocomplete from './useAutocomplete';

// 헤더 검색창. 상품 목록 화면에는 큰 검색창이 있어서 Layout이 거기서는 이걸 숨김
export default function HeaderSearch() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const suggestions = useAutocomplete(text, open);

  function search(value) {
    setOpen(false);
    const keyword = value.trim();
    navigate(keyword ? `/products?keyword=${encodeURIComponent(keyword)}` : '/products');
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        search(text);
      }}
      className="relative min-w-0 flex-1"
    >
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        placeholder="상품명이나 브랜드로 찾기"
        aria-label="상품 검색"
        autoComplete="off"
        className="w-full rounded-full border-2 border-current bg-transparent px-3.5 py-2 text-sm outline-none placeholder:text-current placeholder:opacity-60"
      />
      {suggestions.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-2xl border-2 border-zelo-green bg-zelo-card text-sm text-zelo-green shadow-[6px_8px_0_rgba(4,106,56,.14)]">
          {suggestions.map((name) => (
            <li key={name}>
              {/* 누르는 순간 input blur로 목록이 닫히지 않게 mousedown 기본 동작을 막음 */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => search(name)}
                className="block w-full px-4 py-2.5 text-left hover:bg-zelo-green hover:text-zelo-ivory"
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
