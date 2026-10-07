/**
 * 서버의 createdAt 등 기록 시각은 UTC 기준 LocalDateTime 이라 시간대 표시 없이 내려옴
 * (예: "2026-10-07T03:00:00"). 그대로 new Date() 하면 브라우저가 한국 시각으로 읽어 9시간 어긋나므로
 * 시간대가 없으면 UTC로 해석한다. 행사 일시처럼 사용자가 입력한 시각에는 쓰지 말 것.
 */
export function parseServerTime(value: string): Date {
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value);
  return new Date(hasZone || !value.includes('T') ? value : `${value}Z`);
}

/** "방금 전", "3분 전" … 7일이 지나면 "10월 7일" */
export function formatRelative(value: string): string {
  const date = parseServerTime(value);
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}
