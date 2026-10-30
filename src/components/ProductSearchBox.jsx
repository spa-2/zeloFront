import { useEffect, useState } from 'react';
import { autocomplete, getPopularKeywords } from '../api/products';

// 입력하면 자동완성 목록, 아래엔 인기 검색어
export default function ProductSearchBox({ initialKeyword, onSearch }) {
  const [text, setText] = useState(initialKeyword);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    getPopularKeywords()
      .then(setPopular)
      .catch(() => setPopular([]));
  }, []);

  // 글자 칠 때마다 부르지 않게 0.2초 멈추면 요청
  useEffect(() => {
    const value = text.trim();
    if (!open || !value) {
      return undefined;
    }
    let ignore = false;
    const timer = setTimeout(() => {
      autocomplete(value)
        .then((names) => !ignore && setSuggestions(names))
        .catch(() => !ignore && setSuggestions([]));
    }, 200);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [text, open]);

  function search(value) {
    setText(value);
    setOpen(false);
    onSearch(value.trim());
  }

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          search(text);
        }}
        className="flex gap-2"
      >
        <div className="relative min-w-0 flex-1">
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setOpen(true);
            }}
            onBlur={() => setOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            placeholder="상품 검색 (예: 김치)"
            aria-label="상품 검색"
            className="h-14 w-full rounded-full border-2 border-zelo-green bg-zelo-card px-6 text-base outline-none focus:shadow-[0_0_0_3px_rgba(227,66,34,.3)] focus:border-zelo-orange"
          />
          {open && text.trim() && suggestions.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-3xl border-2 border-zelo-green bg-zelo-card shadow-[6px_8px_0_rgba(4,106,56,.14)]">
              {suggestions.map((name) => (
                <li key={name}>
                  {/* 누르는 순간 input blur로 목록이 닫히지 않게 mousedown 기본 동작을 막음 */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => search(name)}
                    className="block w-full px-6 py-3 text-left hover:bg-zelo-green hover:text-zelo-ivory"
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" className="h-14 rounded-full bg-zelo-green px-8 font-display text-lg text-zelo-ivory">
          검색
        </button>
      </form>
      {popular.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-label text-xs tracking-[.16em] text-zelo-green">HOT</span>
          {popular.map((item) => (
            <button
              key={item.keyword}
              type="button"
              onClick={() => search(item.keyword)}
              className="rounded-full border-2 border-zelo-line px-3 py-1 font-medium hover:border-zelo-green hover:text-zelo-green"
            >
              {item.rank}. {item.keyword}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
