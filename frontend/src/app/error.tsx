'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#f4f6f8] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">오류가 발생했습니다</h1>
        <p className="text-sm text-gray-500 mb-6">일시적인 문제입니다. 잠시 후 다시 시도해 주세요.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2 bg-[#003478] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="px-5 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}
