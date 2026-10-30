// 회원 담당이 채움. 요청 필드는 api/auth.js의 signup 참고
export default function SignupPage() {
  return <Placeholder title="회원가입" owner="회원" />;
}

export function Placeholder({ title, owner }) {
  return (
    <div className="rounded border border-dashed border-stone-300 bg-white p-8 text-center">
      <h1 className="text-lg font-bold">{title}</h1>
      <p className="mt-2 text-sm text-stone-500">{owner} 담당이 붙일 화면이에요</p>
    </div>
  );
}
