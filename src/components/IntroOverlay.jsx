import { useEffect, useRef, useState } from 'react';
import '../styles/intro.css';

const COLLECT_KEYS = ['ArrowDown', 'PageDown', ' '];

// 로딩 화면: 스크롤을 한 번 내리면 3D 재료가 카트에 담기고, 카트가 출동하면서 그 자리에서 빛이 커지며 닫힘
// open이 다시 true가 되면 재료를 제자리로 돌려 처음부터 보여 줌
export default function IntroOverlay({ open, onClose }) {
  const frameRef = useRef(null);
  const floatsRef = useRef(null);
  const flashRef = useRef(null);
  const sceneRef = useRef(null);
  const leavingRef = useRef(false);
  const [leaving, setLeaving] = useState(false);
  const openRef = useRef(open);
  openRef.current = open;

  // 가운데에서(또는 카트 자리에서) 빛이 화면을 덮을 만큼 커진 뒤 닫힘
  function flashAndClose() {
    if (leavingRef.current) {
      return;
    }
    leavingRef.current = true;
    const flash = flashRef.current;
    // 빛이 한쪽에서 시작해도 반대편 구석까지 덮이게 대각선 길이만큼 키움
    flash.style.setProperty('--cover', (Math.hypot(innerWidth, innerHeight) / 24) * 2);
    flash.classList.add('grow');
    setTimeout(() => {
      setLeaving(true);
      setTimeout(onClose, 500);
    }, 1050);
  }

  // 3D는 한 번만 띄우고, 닫혀 있는 동안은 그리지 않음
  // three.js가 커서 첫 화면 번들과 따로 받아 옴 (받는 동안은 포스터만 보임)
  useEffect(() => {
    let disposed = false;
    import('../three/introScene')
      .then(({ mountIntroScene }) => {
        if (disposed) {
          return;
        }
        sceneRef.current = mountIntroScene({
          area: frameRef.current,
          host: floatsRef.current,
          paused: () => !openRef.current,
          onFlash: (p, first) => {
            flashRef.current.style.left = `${p.x}px`;
            flashRef.current.style.top = `${p.y}px`;
            if (first) {
              flashAndClose();
            }
          },
        });
      })
      .catch((e) => {
        // WebGL을 못 띄우는 브라우저면 포스터만 보여 주고, 스크롤하면 바로 넘어감
        console.warn('3D 재료를 띄우지 못했어요', e);
      });
    return () => {
      disposed = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
    // flashAndClose는 ref만 써서 처음 것으로 충분함
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 다시 열리면 처음 상태로
  useEffect(() => {
    if (!open) {
      return;
    }
    leavingRef.current = false;
    setLeaving(false);
    flashRef.current.classList.remove('grow');
    flashRef.current.style.left = '';
    flashRef.current.style.top = '';
    sceneRef.current?.reset();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // 휠·터치로 위로 쓸기·아래 방향키 중 하나면 담기 시작
  useEffect(() => {
    if (!open) {
      return;
    }
    const collect = () => (sceneRef.current ? sceneRef.current.collect() : flashAndClose());
    const onWheel = (e) => e.deltaY > 0 && collect();
    let touchY = null;
    const onTouchStart = (e) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchMove = (e) => touchY !== null && touchY - e.touches[0].clientY > 30 && collect();
    const onKey = (e) => COLLECT_KEYS.includes(e.key) && collect();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className={`intro${leaving ? ' done' : ''}`} hidden={!open} aria-label="ZELO 로딩 화면">
      <nav className="poster-nav">
        <span className="burger" />
        <span className="intro-logo">
          ZELO<b>.</b>
        </span>
      </nav>

      <div className="halftone-blob" />

      <div className="headline">
        <span className="big reveal-up" style={{ animationDelay: '.6s' }}>말하면</span>
        <span className="big reveal-up" style={{ animationDelay: '.75s' }}>장바구니가</span>
        <span className="mid reveal-up" style={{ animationDelay: '.9s' }}>알아서 차요</span>
        <div className="tags reveal-up" style={{ animationDelay: '1.1s' }}>
          <span>AI 장보기 / 견적</span>
          <span>OK 한 번이면 결제</span>
        </div>
      </div>

      <div className="footnote reveal-up" style={{ animationDelay: '1.3s' }}>
        <b>
          MENU / INGREDIENT
          <br />
          QUOTE / ORDER
        </b>
        저녁 메뉴부터
        <br />
        장보기 결제까지
        <br />
        말 한마디로.
        <button type="button" className="arrow" aria-label="메인으로" onClick={flashAndClose}>
          <svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true">
            <path d="M5 14 H20 V5 L36 20 L20 35 V26 H5 Z" fill="currentColor" />
          </svg>
        </button>
      </div>

      <div className="bigdate reveal-up" style={{ animationDelay: '1s' }}>
        ZERO
        <br />
        CLICK
        <br />
        2026
        <small>
          ZELO COMMERCE,
          <br />
          SEOUL, KR
        </small>
      </div>

      <div className="intro-frame" ref={frameRef}>
        <svg className="orbits" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
          <g className="spin">
            <ellipse cx="460" cy="520" rx="390" ry="150" transform="rotate(-24 460 520)" />
          </g>
          <g className="spin rev">
            <ellipse cx="460" cy="520" rx="330" ry="410" transform="rotate(18 460 520)" />
          </g>
          <path className="star" d="M560 147.4 l8 44.2 l34 10.4 l-34 10.4 l-8 44.2 l-8 -44.2 l-34 -10.4 l34 -10.4z" />
          <path className="star" d="M446 815.4 l6 33.8 l26 7.8 l-26 7.8 l-6 33.8 l-6 -33.8 l-26 -7.8 l26 -7.8z" style={{ animationDelay: '.6s' }} />
          <path className="star" d="M247 474.4 l8 44.2 l34 10.4 l-34 10.4 l-8 44.2 l-8 -44.2 l-34 -10.4 l34 -10.4z" style={{ animationDelay: '1.2s' }} />
          <path className="star" d="M760 602.5 l5 26 l20 6.5 l-20 6.5 l-5 26 l-5 -26 l-20 -6.5 l20 -6.5z" style={{ animationDelay: '1.8s' }} />
        </svg>
        <div className="intro-floats" ref={floatsRef} />
      </div>

      <div className="grain" />
      <div className="flash" ref={flashRef} />
    </div>
  );
}
