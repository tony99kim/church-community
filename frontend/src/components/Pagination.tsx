export default function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = buildPages(page, totalPages);

  const btn = (label: React.ReactNode, target: number, disabled: boolean, active = false) => (
    <button
      key={String(label) + target}
      onClick={() => !disabled && onChange(target)}
      disabled={disabled}
      className={`w-9 h-9 rounded-full text-sm font-medium transition flex items-center justify-center
        ${active
          ? 'bg-[#003478] text-white'
          : disabled
            ? 'border border-[#EDEFF1] text-gray-300 cursor-not-allowed'
            : 'border border-[#EDEFF1] bg-white text-gray-600 hover:bg-gray-50'
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex justify-center gap-1">
      {btn('«', 0, page === 0)}
      {btn('‹', page - 1, page === 0)}
      {pages.map((p, i) =>
        p === -1
          ? <span key={`dot-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
          : btn(p + 1, p, false, p === page)
      )}
      {btn('›', page + 1, page >= totalPages - 1)}
      {btn('»', totalPages - 1, page >= totalPages - 1)}
    </div>
  );
}

function buildPages(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);

  const pages = new Set<number>();
  pages.add(0);
  pages.add(total - 1);
  for (let i = Math.max(0, current - 2); i <= Math.min(total - 1, current + 2); i++) {
    pages.add(i);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push(-1); // ellipsis
    result.push(sorted[i]);
  }
  return result;
}
