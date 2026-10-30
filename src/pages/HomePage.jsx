import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories, getPopularProducts, searchProducts } from '../api/products';
import IntroOverlay from '../components/IntroOverlay';
import ProductCard from '../components/ProductCard';
import '../styles/home.css';

// 첫 화면에 흐르는 예시 문장. 나중에 많이 들어온 요청(인기 검색어 API 등)으로 바꿀 자리
const SAYINGS = [
  '김치찌개 2인분 재료 준비해 줘', '아이 먹을 거라 안 맵게 해 줘', '3만 원 안으로 장보기',
  '오늘 저녁 파스타 해 먹을래', '다이어트 중이라 고단백으로', '된장찌개 재료 빠진 것만 채워 줘',
  '주말 캠핑 고기 4인분', '혈압 때문에 싱겁게 먹고 싶어', '비건 카레 재료 담아 줘', '바빠서 간단한 아침거리',
  '생일상 미역국 재료', '계란은 있으니까 나머지만',
];
// 줄 위치(첫 화면 높이 %)와 한 번 건너는 시간(초). 큰 글씨 뒤로도 흐르게 화면 전체에 깔음
const LANES = [
  { y: 9, dur: 44 }, { y: 24, dur: 56 }, { y: 39, dur: 48 },
  { y: 54, dur: 60 }, { y: 69, dur: 50 }, { y: 84, dur: 42 },
];
const BUBBLES = SAYINGS.map((text, i) => {
  const lane = LANES[i % LANES.length];
  const slot = Math.floor(i / LANES.length);
  const perLane = Math.ceil(SAYINGS.length / LANES.length);
  // 같은 줄 말풍선끼리 간격을 벌리고, 줄마다 출발 시점을 엇갈림
  const delay = (slot / perLane + (i % LANES.length) * 0.17) * lane.dur;
  return { text, style: { top: `${lane.y}%`, animationDuration: `${lane.dur}s`, animationDelay: `-${delay}s` } };
});
const BEST_COUNT = 8;

export default function HomePage() {
  const [introOpen, setIntroOpen] = useState(true);
  const [message, setMessage] = useState('');
  const [categories, setCategories] = useState([]);
  const [best, setBest] = useState([]);
  const chatInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    // 최근 7일 인기 상품이 아직 없으면(주문이 없을 때) 판매량순 상품으로 채움
    getPopularProducts()
      .then((items) =>
        items.length > 0
          ? items.slice(0, BEST_COUNT).map((item) => ({ rank: item.rank, product: item.product }))
          : searchProducts({ sort: 'SALES', size: BEST_COUNT }).then((page) => page.content.map((product) => ({ product }))),
      )
      .then(setBest)
      .catch(() => setBest([]));
  }, []);

  // 맨 위에서 위로 스크롤하면 로딩 화면을 처음 상태로 다시 보여 줌
  useEffect(() => {
    if (introOpen) {
      return undefined;
    }
    const reopen = () => scrollY <= 0 && setIntroOpen(true);
    const onWheel = (e) => e.deltaY < 0 && reopen();
    let pullY = null;
    const onTouchStart = (e) => {
      pullY = e.touches[0].clientY;
    };
    const onTouchMove = (e) => pullY !== null && e.touches[0].clientY - pullY > 40 && reopen();
    const onKey = (e) => ['ArrowUp', 'PageUp', 'Home'].includes(e.key) && reopen();
    addEventListener('wheel', onWheel, { passive: true });
    addEventListener('touchstart', onTouchStart, { passive: true });
    addEventListener('touchmove', onTouchMove, { passive: true });
    addEventListener('keydown', onKey);
    return () => {
      removeEventListener('wheel', onWheel);
      removeEventListener('touchstart', onTouchStart);
      removeEventListener('touchmove', onTouchMove);
      removeEventListener('keydown', onKey);
    };
  }, [introOpen]);

  // 첫 메시지를 들고 채팅 화면으로. 채팅 화면이 location.state.initialMessage로 받아서 보냄
  function startChat(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text) {
      chatInputRef.current.focus();
      return;
    }
    navigate('/chat', { state: { initialMessage: text } });
  }

  function pickSaying(text) {
    setMessage(text);
    chatInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    chatInputRef.current.focus({ preventScroll: true });
  }

  return (
    <div className="home">
      <IntroOverlay open={introOpen} onClose={() => setIntroOpen(false)} />

      <section className="stage" aria-label="이렇게 말해 보세요">
        <div className="marquee" aria-hidden="true">
          <div className="row green">먹고 싶은 메뉴만</div>
          <div className="row">말해 주세요</div>
          <div className="row green">재료는 ZELO가</div>
          <div className="row green">골라 담을게요.</div>
        </div>
        <div className="bubbles">
          {BUBBLES.map((bubble) => (
            <button key={bubble.text} type="button" className="bubble" style={bubble.style} onClick={() => pickSaying(bubble.text)}>
              {bubble.text}
            </button>
          ))}
        </div>
      </section>

      <nav className="links-band" aria-label="바로가기">
        <form className="chat-row" onSubmit={startChat}>
          <label className="chat-title" htmlFor="homeChatInput">AI 장보기 맡기기</label>
          <div className="chat-box">
            <input
              id="homeChatInput"
              ref={chatInputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="먹고 싶은 메뉴를 입력해 주세요"
              autoComplete="off"
            />
            <button type="submit" aria-label="보내기">
              <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
                <path d="M12 19V6 M6 11l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </form>
        <a href="#best">오늘 많이 팔린 상품<small>BEST</small><i>→</i></a>
        <a href="#categories">카테고리 둘러보기<small>CURATION</small><i>→</i></a>
      </nav>

      <main className="home-sections">
        <h2 id="categories">카테고리 <small>CATEGORY</small></h2>
        <div className="cats">
          <Link to="/products" className="cat on">전체</Link>
          {categories.map((category) => (
            <Link key={category.categoryId} to={`/products?categoryId=${category.categoryId}`} className="cat">
              {category.name}
            </Link>
          ))}
        </div>

        <h2 id="best">많이 팔린 상품 <small>BEST SELLER</small></h2>
        {best.length > 0 ? (
          <div className="product-grid">
            {best.map((item) => (
              <ProductCard key={item.product.productCode} product={item.product} rank={item.rank} />
            ))}
          </div>
        ) : (
          <p className="text-zelo-sub">상품을 불러오는 중이에요</p>
        )}
      </main>

      <footer className="home-footer">
        <div>
          <b>ZELO<span>.</span></b>
          <span>
            말하면 장바구니가 차고, 예 한 번이면 결제까지
            <br />
            ZERO CLICK COMMERCE · SEOUL
          </span>
        </div>
      </footer>
    </div>
  );
}
