import Header from '@/components/Header';
import Link from 'next/link';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F6F7F8]">{children}</main>
      <footer className="bg-white border-t border-[#EDEFF1] py-6 mt-4">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <span>© 2026 ChurchHub. 지역 청년 커뮤니티</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-gray-600 transition">이용약관</Link>
            <Link href="/privacy" className="hover:text-gray-600 transition">개인정보처리방침</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
