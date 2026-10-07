import type { Metadata } from 'next';
import { Inter, Nanum_Myeongjo } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });
// 제목용 세리프체: next/font로 자체 호스팅해 화면 표시를 막지 않음
const nanumMyeongjo = Nanum_Myeongjo({
  weight: ['400', '700', '800'],
  display: 'swap',
  preload: false,
  variable: '--font-nanum-myeongjo',
});

const SITE_URL = 'https://church-community-zeta.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ChurchHub - 지역 청년 커뮤니티',
    template: '%s | ChurchHub',
  },
  description: '우리 지역 청년들을 위한 교회 커뮤니티 — 소식, 행사, 자유로운 소통',
  openGraph: {
    siteName: 'ChurchHub',
    locale: 'ko_KR',
    type: 'website',
    url: SITE_URL,
    title: 'ChurchHub - 지역 청년 커뮤니티',
    description: '우리 지역 청년들을 위한 교회 커뮤니티 — 소식, 행사, 자유로운 소통',
  },
  twitter: {
    card: 'summary',
    title: 'ChurchHub - 지역 청년 커뮤니티',
    description: '우리 지역 청년들을 위한 교회 커뮤니티 — 소식, 행사, 자유로운 소통',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={nanumMyeongjo.variable}>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
