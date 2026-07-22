import { NextResponse } from 'next/server';

// Supported translations (code → getbible.net version key)
const TRANSLATION_MAP: Record<string, string> = {
  korean: 'korean', // 개역한글
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ book: string; chapter: string }> }
) {
  const { book, chapter } = await params;
  const { searchParams } = new URL(req.url);
  const translationKey = TRANSLATION_MAP[searchParams.get('t') ?? 'korean'] ?? 'korean';

  const urls = [
    `https://api.getbible.net/v2/${translationKey}/${book}/${chapter}.json`,
    `https://getbible.net/v2/${translationKey}/${book}/${chapter}.json`,
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
