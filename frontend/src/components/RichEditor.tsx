'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useRef } from 'react';
import { uploadImage } from '@/lib/supabase';

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichEditor({ content, onChange, placeholder }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'min-h-[320px] px-6 py-4 text-sm text-gray-800 leading-loose focus:outline-none prose prose-sm max-w-none',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      alert('이미지 업로드에 실패했습니다.');
    }
    e.target.value = '';
  };

  if (!editor) return null;

  const btn = (active: boolean, onClick: () => void, children: React.ReactNode) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`px-2 py-1 rounded text-xs font-bold transition ${active ? 'bg-[#003478] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="border-0">
      {/* 툴바 */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 flex-wrap">
        {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'B')}
        {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'I')}
        <div className="w-px h-4 bg-gray-200 mx-1" />
        {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2')}
        {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3')}
        <div className="w-px h-4 bg-gray-200 mx-1" />
        {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), '•목록')}
        {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), '1.목록')}
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); fileRef.current?.click(); }}
          className="px-2 py-1 rounded text-xs font-bold text-gray-500 hover:bg-gray-100 transition flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          이미지
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>

      {/* 에디터 영역 */}
      <div className="relative">
        {editor.isEmpty && placeholder && (
          <p className="absolute top-4 left-6 text-sm text-gray-300 pointer-events-none select-none">{placeholder}</p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
