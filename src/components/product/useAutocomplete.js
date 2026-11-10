import { useEffect, useState } from 'react';
import { autocomplete } from '../../api/products';

// 상품 목록 검색창과 헤더 검색창이 같이 씀. 글자 칠 때마다 부르지 않게 0.2초 멈추면 요청
export default function useAutocomplete(text, open) {
  const [suggestions, setSuggestions] = useState([]);

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

  return open && text.trim() ? suggestions : [];
}
