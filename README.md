# zelo-front

Zelo 프론트. React 19 + Vite + Tailwind + axios + zustand + react-router

## 실행

```bash
npm install
cp .env.example .env
npm run dev
```

백엔드(8080)를 먼저 띄워 두면 http://localhost:5173 에서 바로 붙음

- 로컬은 `/api`를 vite 프록시로 백엔드에 넘김 (백엔드에 CORS 설정이 없어서)
- 배포는 `VITE_API_BASE_URL`에 백엔드 주소를 넣고 `npm run build` → `dist`를 S3에 올림

## 구조

```
src
├─ api         백엔드 호출 함수 (client.js에 토큰 붙이기·재발급)
├─ store       로그인 상태 (accessToken)
├─ components  Layout, RequireAuth
└─ pages       화면
```

## 인증

- 로그인하면 accessToken은 sessionStorage, refreshToken은 백엔드가 httpOnly 쿠키로 줌
- 401이 오면 `/api/auth/reissue`로 한 번 재발급받고 다시 요청함. 재발급도 실패하면 로그인 화면으로

## 화면 담당 (임시지정)

| 화면 | 경로 | 담당 |
|---|---|---|
| 로그인 | /login | 연결됨 |
| 회원가입 | /signup | 회원 |
| 장보기 채팅·견적 카드 | /chat | 채팅 |
| 상품 목록·상세 | /products | 상품 (검색·목록 연결됨) |
| 주문 내역 | /orders | 주문 |
