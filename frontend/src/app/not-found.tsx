import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f4f6f8] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl font-black text-[#003478] mb-2">404</div>
        <h1 className="text-lg font-bold text-gray-800 mb-2">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm text-gray-500 mb-6">주소를 다시 확인하거나 홈으로 돌아가세요.</p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-[#003478] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
