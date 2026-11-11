# AGENTS.md

Zelo 프론트. React 19 + Vite + Tailwind v4 + axios + zustand + react-router 7. JavaScript(JSX)만 쓰고 TypeScript는 쓰지 않는다.

## Commands

```bash
npm install
cp .env.example .env     # 로컬은 비워 둔 채로 사용 (/api를 vite 프록시로 백엔드 8080에 넘김)
npm run dev              # http://localhost:5173
npm run lint             # oxlint, 커밋 전에 통과시킨다
npm run build            # 빌드가 깨지지 않는지 확인
```

백엔드(8080)를 먼저 띄워야 API가 붙는다.

## 폴더 구조

```
src
├─ api          도메인별 백엔드 호출 함수 (client.js가 토큰·재발급 담당)
├─ components   여러 화면에서 같이 쓰는 컴포넌트
├─ constants    백엔드 enum → 화면 문구 매핑
├─ pages        화면 (XxxPage.jsx)
├─ store        전역 상태 (지금은 로그인만)
├─ styles       화면 전용 CSS (Tailwind로 표현하기 어려운 것만)
└─ three        메인 인트로 3D
```

## 담당 범위 (충돌 방지)

> ⚠️ 아직 없는 화면의 파일 이름은 임시로 정했다. 아래 `미정` 섹션을 보고 확정한다.

| 담당 | 화면 | 수정해도 되는 파일 |
|---|---|---|
| 유림 | 채팅 | `pages/Chat*`, `api/chat.js`, `components/chat/` |
| 강승규 | 주문 내역·상세, 배송지 등록, 결제 수단 등록 | `pages/Order*`, `pages/Address*`, `pages/PaymentMethod*`, `api/orders.js`, `api/payments.js`, `api/addresses.js`, `components/order/` |
| 정이 | 상품 | `pages/Product*`, `api/products.js`, `components/product/` |
| 원열 | 회원가입, 이메일 검증, 비밀번호 찾기 | `pages/Signup*`, `pages/Login*`, `pages/Password*`, `api/auth.js`, `components/auth/` |

- 자기 담당 파일만 수정한다. 다른 담당 파일은 고치지 않는다.
- 아래 **공용 파일**은 팀에 먼저 말하고 수정한다.
    - `api/client.js`, `store/authStore.js`, `components/Layout.jsx`, `components/RequireAuth.jsx`, `index.css`, `index.html`(폰트 링크), `vite.config.js`, `package.json`
- `App.jsx`에는 자기 화면의 `<Route>` 줄만 추가한다. 다른 줄의 순서나 모양은 바꾸지 않는다.

## 화면 (pages)

- 화면은 **페이지 단위**로 만든다. 처음부터 컴포넌트를 잘게 쪼개지 않는다.
- 같은 코드가 두 화면 이상에서 반복되면 그때 컴포넌트로 뺀다.
    - 자기 도메인 안에서만 쓰면 `components/<도메인>/`에 둔다.
    - 여러 도메인에서 쓰면 `components/`에 두고 팀에 알린다.
- 파일 하나에 컴포넌트 하나, `export default function XxxPage()`로 쓴다.
- 이름은 컴포넌트·파일 `PascalCase`, 함수·변수 `camelCase`, 상수 `UPPER_SNAKE_CASE`로 쓴다.
- 로그인이 필요한 화면은 `App.jsx`의 `<Route element={<RequireAuth />}>` 안에 넣는다.

## API 호출

- 백엔드 호출은 반드시 `src/api/<도메인>.js`에 함수로 만들고, 화면에서는 그 함수만 부른다.
- 화면에서 `axios`나 `fetch`를 직접 쓰지 않는다. 항상 `client`를 쓴다.
- `Authorization` 헤더를 직접 붙이지 않는다. `client.js`가 토큰 첨부와 401 재발급을 처리한다.
- 백엔드 응답은 `{ success, code, message, data }` 모양이다. API 함수는 `res.data.data`만 돌려준다.

```js
export async function getOrder(orderId) {
  const res = await client.get(`/api/orders/${orderId}`);
  return res.data.data;
}
```

- 페이지 응답은 `{ content, page, size, totalElements, totalPages }`이다. `page`는 0부터 시작한다.
- 함수 이름은 백엔드 동작에 맞춘다. 조회는 `get`/`search`, 생성은 `create`, 수정은 `update`, 삭제는 `delete`로 쓴다.
- 요청 필드와 URL은 백엔드 컨트롤러와 DTO를 보고 맞춘다. 추측해서 만들지 않는다.

## 데이터 불러오기와 에러

- 화면에는 **로딩, 에러, 빈 결과** 세 가지를 모두 보여 준다.
- 에러 문구는 `errorMessage(e, '기본 문구')`로 꺼낸다. 백엔드 `message`를 그대로 보여 준다.
- `useEffect`에서 불러올 때는 화면을 떠난 뒤 상태가 바뀌지 않도록 `ignore` 플래그를 쓴다 (`ProductListPage` 참고).
- 버튼을 누르는 요청(결제, 등록, 삭제)은 처리 중에 버튼을 `disabled`로 막아 연타를 막는다.

## 상태 관리

- 화면 상태는 `useState`로 화면 안에서 관리한다.
- 검색어, 필터, 페이지 번호처럼 뒤로 가기 시 남아야 하는 값은 URL 쿼리(`useSearchParams`)에 둔다.
- zustand 스토어는 로그인처럼 정말 전역인 것만 둔다. 새 스토어는 팀과 합의 후 만든다.
- `localStorage`/`sessionStorage`를 직접 쓰지 않는다.

## 스타일

- Tailwind 클래스로 스타일을 쓴다. 색과 글꼴은 `index.css`의 **Zelo 토큰만** 쓴다.

| 용도 | 클래스 |
|---|---|
| 기본 배경 | `bg-zelo-ivory` |
| 카드 배경 | `bg-zelo-card` |
| 메인 색 (버튼, 제목, 테두리) | `bg-zelo-green`, `text-zelo-green`, `border-zelo-green` |
| 진한 초록 | `zelo-green-deep` |
| 강조, 에러 | `text-zelo-orange`, `bg-zelo-orange` |
| 본문 글자 | `text-zelo-ink` |
| 보조 글자 | `text-zelo-sub` |
| 구분선 | `border-zelo-line` |
| 큰 제목 | `font-display` |
| 로고, 메뉴 | `font-logo` |
| 작은 영문 라벨 | `font-label` |

- Tailwind 기본 색(`stone-*`, `emerald-*`, `red-*`, `gray-*` 등)과 `#hex` 색을 직접 쓰지 않는다.
    - 지금 `LoginPage`와 `Placeholder`에 기본 색이 남아 있다. 따라 쓰지 말고, 각 담당이 화면을 만들 때 Zelo 토큰으로 바꾼다.
    - **예외:** 메인 3D(`three/`)의 재료 색과 일러스트 장식 색(점무늬 배경, 그림자 투명도 등 `styles/*.css`의 `#hex`, `rgba`)은 디자인 시안 값이다. 토큰으로 바꾸거나 임의로 수정하지 않는다.
- 새 색이나 글꼴이 필요하면 `index.css`의 `@theme`에 토큰을 추가하자고 팀에 먼저 말한다.
- 화면 전용 CSS가 꼭 필요하면 `styles/<도메인>.css`를 만들고, 색은 `var(--color-zelo-*)`로 쓴다.
- 자주 쓰는 모양은 기존 화면을 따른다.
    - 버튼: `h-11 rounded-full border-2 border-zelo-green px-5 font-medium text-zelo-green`
    - 화면 제목: `font-display text-5xl text-zelo-green`
- 내용 영역 너비와 여백은 `Layout`이 잡는다. 화면에서 다시 `max-w`, `mx-auto`를 감싸지 않는다.
    - **예외:** 홈(`/`)은 `Layout`이 폭을 잡지 않고 전체 화면으로 쓴다. 홈 안의 섹션은 각자 폭을 잡는다.

## 주석

- 주석은 "왜 이렇게 했는가"가 필요할 때만 `//`로 한국어로 쓴다.
- 코드가 무엇을 하는지 그대로 옮긴 주석은 쓰지 않는다.

## Git

- 기준 브랜치는 `dev`이다. `main`과 `dev`에 직접 커밋하지 않는다.
- 브랜치는 `feat/#이슈번호-설명`, `fix/#이슈번호-설명`으로 만든다.
- 커밋은 `type: 제목` (feat, fix, refactor, style, docs, chore) 형식으로 쓰고, 제목은 한글 50자 이내로 쓴다.
- 커밋 하나에는 목적 하나만 담는다.
- PR 전에 `dev`를 받아 합쳐 보고, `npm run lint`와 `npm run build`가 통과하는지 확인한다.

## Don't

- `.env`를 커밋하지 않는다. 새 환경변수는 `.env.example`에 키만 추가한다.
- 팀 합의 없이 npm 패키지를 추가하지 않는다 (`package-lock.json` 충돌의 주원인).
- 요청받지 않은 파일을 리팩터링하거나 포맷만 바꾸지 않는다.
- 다른 담당의 화면, API 파일을 수정하지 않는다.
- TypeScript, CSS-in-JS, UI 라이브러리(MUI 등)를 도입하지 않는다.

## 미정 (임의로 만들지 말고 먼저 물어볼 것)

정해지면 이 섹션에서 지우고 위 규칙에 반영한다.

- [ ] **담당 범위의 파일 이름**: 아직 없는 화면(배송지 `Address*`, 결제 수단 `PaymentMethod*`, 비밀번호 찾기 `Password*`)은 임시 이름이다. 각 담당이 확인하고 쓸 이름으로 고친다.
- [ ] **로그인 화면 담당**: 지금은 연결만 되어 있고 담당이 없다. 임시로 회원 담당(원열) 범위에 넣었다.
- [ ] **토큰 저장 방식**: 지금은 accessToken을 sessionStorage에 둔다. 창을 닫으면 토큰이 사라져서 매번 reissue가 돈다는 피드백을 받았다. 메모리 보관 + 앱 시작 시 reissue로 바꿀지 인증 담당이 정한다. 정해질 때까지 `client.js`, `authStore.js`는 건드리지 않는다.
- [ ] **공용 UI 컴포넌트**(버튼, 입력창, 모달): 중복이 보이면 그때 합의해서 만든다.
- [ ] **Swagger 사용 여부**: 프론트에서 API 명세를 볼 때 Swagger를 쓸지 정한다.
- [ ] **`.junie/` 폴더**: 지금은 비어 있어 git에 올라가지 않지만, AI 도구 설정이 생기면 커밋될 수 있다. `.gitignore`에 넣을지 정한다.