import Header from '@/components/Header';
import Link from 'next/link';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">{children}</main>
      <footer className="bg-white border-t border-border mt-8">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
            {/* 브랜드 */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-extrabold">C</span>
                </div>
                <span className="font-extrabold text-primary text-base">ChurchHub</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                염리동 12개 교회 청년들이 함께 만들어가는<br />따뜻한 동네 공동체 플랫폼입니다.
              </p>
            </div>
            {/* 링크 */}
            <div className="flex gap-12">
              <div>
                <h4 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">커뮤니티</h4>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li><Link href="/community" className="hover:text-primary transition">자유 게시판</Link></li>
                  <li><Link href="/events" className="hover:text-primary transition">행사 안내</Link></li>
                  <li><Link href="/churches" className="hover:text-primary transition">함께하는 교회</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">서비스</h4>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li><Link href="/spaces" className="hover:text-primary transition">공간 대여</Link></li>
                  <li><Link href="/items" className="hover:text-primary transition">물품 대여</Link></li>
                  <li><Link href="/faith" className="hover:text-primary transition">신앙 Q&A</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>© 2026 ChurchHub. 지역 청년 커뮤니티</span>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-primary transition">이용약관</Link>
              <Link href="/privacy" className="hover:text-primary transition">개인정보처리방침</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
