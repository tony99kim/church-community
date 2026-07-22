import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ book: string; chapter: string }> }
) {
  const { book, chapter } = await params;

  // Try API subdomain first, fallback to main domain
  const urls = [
    `https://api.getbible.net/v2/korean/${book}/${chapter}.json`,
    `https://getbible.net/v2/korean/${book}/${chapter}.json`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ChurchHub/1.0' },
        cache: 'force-cache',
      });
      if (!res.ok) continue;
      const data = await res.json();
      return NextResponse.json(data);
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: '본문을 불러올 수 없습니다.' }, { status: 502 });
}
