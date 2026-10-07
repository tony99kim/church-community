import { cn } from '@/lib/utils';

interface Props {
  src?: string | null;
  name?: string | null;
  className?: string;
}

/** 프로필 사진이 있으면 사진, 없으면 닉네임 첫 글자 */
export default function UserAvatar({ src, name, className }: Props) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? ''} className={cn('w-7 h-7 rounded-full object-cover shrink-0', className)} />;
  }
  return (
    <div className={cn('w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0', className)}>
      {name?.[0] ?? '?'}
    </div>
  );
}
