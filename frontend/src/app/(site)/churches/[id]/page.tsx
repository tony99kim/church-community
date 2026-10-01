'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Church } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ChurchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/churches/${id}`)
      .then(r => setChurch(r.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound || !church) return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">⛪</div>
        <p className="text-muted-foreground mb-4">교회 정보를 찾을 수 없습니다.</p>
        <Link href="/churches" className="text-sm text-primary hover:underline">← 교회 목록</Link>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/churches" className="text-sm text-muted-foreground hover:text-primary mb-6 flex items-center gap-1 transition">
          ← 교회 목록
        </Link>

        <Card className="overflow-hidden">
          {church.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={church.imageUrl} alt={church.name} className="w-full h-56 object-cover" />
          ) : (
            <div className="w-full h-36 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-6xl">⛪</div>
          )}
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <h1 className="text-2xl font-extrabold text-gray-900">{church.name}</h1>
              {church.hasYouthGroup && (
                <Badge className="bg-primary/10 text-primary border-0 shrink-0 ml-3">청년부</Badge>
              )}
            </div>

            {church.introduction && (
              <p className="text-muted-foreground mb-6 leading-relaxed">{church.introduction}</p>
            )}

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 bg-accent rounded-xl">
                <span className="text-lg shrink-0">📍</span>
                <div>
                  <div className="text-xs text-muted-foreground font-medium mb-0.5">주소</div>
                  <div className="text-gray-800">{church.address}</div>
                </div>
              </div>
              {church.sundayServiceTime && (
                <div className="flex items-start gap-3 p-3 bg-accent rounded-xl">
                  <span className="text-lg shrink-0">🕐</span>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium mb-0.5">주일예배</div>
                    <div className="text-gray-800">{church.sundayServiceTime}</div>
                  </div>
                </div>
              )}
              {church.contactInfo && (
                <div className="flex items-start gap-3 p-3 bg-accent rounded-xl">
                  <span className="text-lg shrink-0">📞</span>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium mb-0.5">연락처</div>
                    <div className="text-gray-800">{church.contactInfo}</div>
                  </div>
                </div>
              )}
            </div>

            {(church.websiteUrl || church.instagramUrl) && (
              <div className="flex gap-2 mt-6 pt-5 border-t border-border">
                {church.websiteUrl && (
                  <a href={church.websiteUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-center text-sm px-4 py-2.5 border border-border rounded-xl hover:border-primary hover:text-primary transition font-medium">
                    🌐 홈페이지
                  </a>
                )}
                {church.instagramUrl && (
                  <a href={church.instagramUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-center text-sm px-4 py-2.5 border border-border rounded-xl hover:border-primary hover:text-primary transition font-medium">
                    📷 인스타그램
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
