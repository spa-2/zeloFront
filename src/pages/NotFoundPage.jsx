import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="py-16 text-center">
      <p className="text-lg font-bold">페이지를 찾을 수 없어요</p>
      <Link to="/" className="mt-2 inline-block text-sm text-emerald-700">처음으로</Link>
    </div>
  );
}
