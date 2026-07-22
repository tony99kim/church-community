import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ book: string; chapter: string }> }
) {
  const { book, chapter } = await params;
  const url = `https://getbible.net/v2/korean/${book}/${chapter}.json`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: '본문을 불러올 수 없습니다.' }, { status: 502 });
  }
}
