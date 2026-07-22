'use client';

import { useState, useEffect, useRef } from 'react';

interface Book { id: number; name: string; short: string; chapters: number; }
interface Verse { verse: number; text: string; }

const OT: Book[] = [
  { id: 1,  name: '창세기',      short: '창', chapters: 50 },
  { id: 2,  name: '출애굽기',    short: '출', chapters: 40 },
  { id: 3,  name: '레위기',      short: '레', chapters: 27 },
  { id: 4,  name: '민수기',      short: '민', chapters: 36 },
  { id: 5,  name: '신명기',      short: '신', chapters: 34 },
  { id: 6,  name: '여호수아',    short: '수', chapters: 24 },
  { id: 7,  name: '사사기',      short: '삿', chapters: 21 },
  { id: 8,  name: '룻기',        short: '룻', chapters: 4  },
  { id: 9,  name: '사무엘상',    short: '삼상', chapters: 31 },
  { id: 10, name: '사무엘하',    short: '삼하', chapters: 24 },
  { id: 11, name: '열왕기상',    short: '왕상', chapters: 22 },
  { id: 12, name: '열왕기하',    short: '왕하', chapters: 25 },
  { id: 13, name: '역대상',      short: '대상', chapters: 29 },
  { id: 14, name: '역대하',      short: '대하', chapters: 36 },
  { id: 15, name: '에스라',      short: '스', chapters: 10 },
  { id: 16, name: '느헤미야',    short: '느', chapters: 13 },
  { id: 17, name: '에스더',      short: '에', chapters: 10 },
  { id: 18, name: '욥기',        short: '욥', chapters: 42 },
  { id: 19, name: '시편',        short: '시', chapters: 150 },
  { id: 20, name: '잠언',        short: '잠', chapters: 31 },
  { id: 21, name: '전도서',      short: '전', chapters: 12 },
  { id: 22, name: '아가',        short: '아', chapters: 8  },
  { id: 23, name: '이사야',      short: '사', chapters: 66 },
  { id: 24, name: '예레미야',    short: '렘', chapters: 52 },
  { id: 25, name: '예레미야애가',short: '애', chapters: 5  },
  { id: 26, name: '에스겔',      short: '겔', chapters: 48 },
  { id: 27, name: '다니엘',      short: '단', chapters: 12 },
  { id: 28, name: '호세아',      short: '호', chapters: 14 },
  { id: 29, name: '요엘',        short: '욜', chapters: 3  },
  { id: 30, name: '아모스',      short: '암', chapters: 9  },
  { id: 31, name: '오바댜',      short: '옵', chapters: 1  },
  { id: 32, name: '요나',        short: '욘', chapters: 4  },
  { id: 33, name: '미가',        short: '미', chapters: 7  },
  { id: 34, name: '나훔',        short: '나', chapters: 3  },
  { id: 35, name: '하박국',      short: '합', chapters: 3  },
  { id: 36, name: '스바냐',      short: '습', chapters: 3  },
  { id: 37, name: '학개',        short: '학', chapters: 2  },
  { id: 38, name: '스가랴',      short: '슥', chapters: 14 },
  { id: 39, name: '말라기',      short: '말', chapters: 4  },
];

const NT: Book[] = [
  { id: 40, name: '마태복음',      short: '마',   chapters: 28 },
  { id: 41, name: '마가복음',      short: '막',   chapters: 16 },
  { id: 42, name: '누가복음',      short: '눅',   chapters: 24 },
  { id: 43, name: '요한복음',      short: '요',   chapters: 21 },
  { id: 44, name: '사도행전',      short: '행',   chapters: 28 },
  { id: 45, name: '로마서',        short: '롬',   chapters: 16 },
  { id: 46, name: '고린도전서',    short: '고전', chapters: 16 },
  { id: 47, name: '고린도후서',    short: '고후', chapters: 13 },
  { id: 48, name: '갈라디아서',    short: '갈',   chapters: 6  },
  { id: 49, name: '에베소서',      short: '엡',   chapters: 6  },
  { id: 50, name: '빌립보서',      short: '빌',   chapters: 4  },
  { id: 51, name: '골로새서',      short: '골',   chapters: 4  },
  { id: 52, name: '데살로니가전서',short: '살전', chapters: 5  },
  { id: 53, name: '데살로니가후서',short: '살후', chapters: 3  },
  { id: 54, name: '디모데전서',    short: '딤전', chapters: 6  },
  { id: 55, name: '디모데후서',    short: '딤후', chapters: 4  },
  { id: 56, name: '디도서',        short: '딛',   chapters: 3  },
  { id: 57, name: '빌레몬서',      short: '몬',   chapters: 1  },
  { id: 58, name: '히브리서',      short: '히',   chapters: 13 },
  { id: 59, name: '야고보서',      short: '약',   chapters: 5  },
  { id: 60, name: '베드로전서',    short: '벧전', chapters: 5  },
  { id: 61, name: '베드로후서',    short: '벧후', chapters: 3  },
  { id: 62, name: '요한일서',      short: '요일', chapters: 5  },
  { id: 63, name: '요한이서',      short: '요이', chapters: 1  },
  { id: 64, name: '요한삼서',      short: '요삼', chapters: 1  },
  { id: 65, name: '유다서',        short: '유',   chapters: 1  },
  { id: 66, name: '요한계시록',    short: '계',   chapters: 22 },
];

const ALL_BOOKS = [...OT, ...NT];

export default function BiblePage() {
  const [testament, setTestament] = useState<'OT' | 'NT'>('OT');
  const [book, setBook] = useState<Book | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [highlightVerse, setHighlightVerse] = useState<number | null>(null);

  // 빠른 이동
  const [jumpBookId, setJumpBookId] = useState(1);
  const [jumpChapter, setJumpChapter] = useState(1);
  const [jumpVerse, setJumpVerse] = useState(1);

  const verseRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const topRef = useRef<HTMLDivElement>(null);

  const books = testament === 'OT' ? OT : NT;

  useEffect(() => {
    if (chapter === null || book === null) return;
    setLoading(true);
    setError('');
    setVerses([]);
    fetch(`/api/bible/${book.id}/${chapter}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        const list: Verse[] = Object.values(data.verses as Record<string, { verse: number; text: string }>)
          .map((v) => ({ verse: v.verse, text: v.text.trim() }))
          .sort((a, b) => a.verse - b.verse);
        setVerses(list);
      })
      .catch(() => setError('본문을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'))
      .finally(() => setLoading(false));
  }, [book, chapter]);

  useEffect(() => {
    if (highlightVerse !== null && verseRefs.current[highlightVerse]) {
      verseRefs.current[highlightVerse]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightVerse, verses]);

  const selectBook = (b: Book) => {
    setBook(b);
    setChapter(null);
    setVerses([]);
    setHighlightVerse(null);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const selectChapter = (c: number) => {
    setChapter(c);
    setHighlightVerse(null);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const goChapter = (delta: number) => {
    if (!book || chapter === null) return;
    const next = chapter + delta;
    if (next < 1 || next > book.chapters) return;
    selectChapter(next);
  };

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const target = ALL_BOOKS.find((b) => b.id === jumpBookId);
    if (!target) return;
    const newTestament = target.id <= 39 ? 'OT' : 'NT';
    setTestament(newTestament);
    setBook(target);
    setChapter(Math.min(jumpChapter, target.chapters));
    setHighlightVerse(jumpVerse);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const jumpBookObj = ALL_BOOKS.find((b) => b.id === jumpBookId);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6" ref={topRef}>
      {/* 빠른 이동 */}
      <form onSubmit={handleJump} className="mb-6 bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-500 mb-3">빠른 이동</p>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[130px]">
            <label className="text-xs text-gray-400 mb-1 block">책</label>
            <select
              value={jumpBookId}
              onChange={(e) => { setJumpBookId(Number(e.target.value)); setJumpChapter(1); setJumpVerse(1); }}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
            >
              <optgroup label="구약">
                {OT.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </optgroup>
              <optgroup label="신약">
                {NT.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </optgroup>
            </select>
          </div>
          <div className="w-20">
            <label className="text-xs text-gray-400 mb-1 block">장</label>
            <input
              type="number" min={1} max={jumpBookObj?.chapters ?? 1}
              value={jumpChapter}
              onChange={(e) => setJumpChapter(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
            />
          </div>
          <div className="w-20">
            <label className="text-xs text-gray-400 mb-1 block">절 (선택)</label>
            <input
              type="number" min={1}
              value={jumpVerse}
              onChange={(e) => setJumpVerse(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
            />
          </div>
          <button type="submit" className="bg-[#003478] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-900 transition">
            이동
          </button>
        </div>
      </form>

      {/* 구약 / 신약 탭 */}
      <div className="flex gap-2 mb-4">
        {(['OT', 'NT'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTestament(t); setBook(null); setChapter(null); setVerses([]); }}
            className={`px-5 py-2 rounded-full text-sm font-bold transition ${
              testament === t ? 'bg-[#003478] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {t === 'OT' ? '구약' : '신약'}
          </button>
        ))}
      </div>

      {/* 책 목록 */}
      {!book && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-400 mb-3">{testament === 'OT' ? '구약 39권' : '신약 27권'}</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {books.map((b) => (
              <button
                key={b.id}
                onClick={() => selectBook(b)}
                className="flex flex-col items-center p-3 rounded-xl border border-gray-100 hover:border-[#003478] hover:bg-blue-50 transition text-center"
              >
                <span className="text-xs font-bold text-[#003478]">{b.short}</span>
                <span className="text-[11px] text-gray-500 mt-0.5 truncate w-full text-center">{b.name}</span>
                <span className="text-[10px] text-gray-300 mt-0.5">{b.chapters}장</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 장 목록 */}
      {book && chapter === null && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => setBook(null)} className="text-xs text-gray-400 hover:text-[#003478]">← 책 목록</button>
            <span className="text-xs text-gray-300">/</span>
            <span className="text-sm font-bold text-gray-900">{book.name}</span>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {Array.from({ length: book.chapters }, (_, i) => i + 1).map((c) => (
              <button
                key={c}
                onClick={() => selectChapter(c)}
                className="h-9 w-full rounded-xl border border-gray-100 text-sm font-medium text-gray-700 hover:border-[#003478] hover:bg-blue-50 hover:text-[#003478] transition"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 본문 */}
      {book && chapter !== null && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <button onClick={() => setChapter(null)} className="text-xs text-gray-400 hover:text-[#003478]">← {book.name}</button>
            <span className="text-xs text-gray-300">/</span>
            <span className="text-base font-bold text-gray-900">{book.name} {chapter}장</span>
            <span className="text-xs text-gray-400 ml-auto">개역한글</span>
          </div>

          {/* 본문 영역 */}
          <div className="px-5 py-5 min-h-[300px]">
            {loading && (
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${70 + (i % 3) * 10}%` }} />
                ))}
              </div>
            )}
            {error && <p className="text-sm text-red-500 text-center py-8">{error}</p>}
            {!loading && !error && verses.length > 0 && (
              <div className="space-y-3">
                {verses.map((v) => (
                  <div
                    key={v.verse}
                    ref={(el) => { verseRefs.current[v.verse] = el; }}
                    className={`flex gap-3 rounded-lg px-2 py-1 transition ${
                      highlightVerse === v.verse ? 'bg-yellow-50 border border-yellow-200' : ''
                    }`}
                  >
                    <span className="text-xs font-bold text-[#003478] shrink-0 w-6 pt-0.5 text-right">{v.verse}</span>
                    <p className="text-sm text-gray-800 leading-7">{v.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 이전 / 다음 장 */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <button
              onClick={() => goChapter(-1)}
              disabled={chapter <= 1}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#003478] disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              ← {chapter > 1 ? `${chapter - 1}장` : ''}
            </button>
            <span className="text-xs text-gray-400">{chapter} / {book.chapters}장</span>
            <button
              onClick={() => goChapter(1)}
              disabled={chapter >= book.chapters}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#003478] disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              {chapter < book.chapters ? `${chapter + 1}장` : ''} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
