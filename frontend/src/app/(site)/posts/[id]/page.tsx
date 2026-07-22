import type { Metadata } from 'next';
import PostDetailClient from './PostDetail';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API}/posts/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return {};
    const { data } = await res.json();
    const description = (data.content as string)
      ?.replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);
    const images = data.thumbnailUrl ? [{ url: data.thumbnailUrl }] : [];
    return {
      title: `${data.title} | ChurchHub`,
      description,
      openGraph: { title: data.title, description, images, type: 'article' },
      twitter: { card: 'summary_large_image', title: data.title, description },
    };
  } catch {
    return {};
  }
}

export default function PostDetailPage() {
  return <PostDetailClient />;
}
