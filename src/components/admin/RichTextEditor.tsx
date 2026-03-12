import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Heading2, Heading3,
  AlignRight, AlignCenter, AlignLeft, Link as LinkIcon, Undo, Redo,
} from 'lucide-react'

type Props = {
  content: string
  onChange: (html: string) => void
}

function ToolbarBtn({
  onClick, active, title, children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({ content, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'כתוב את התוכן כאן...' }),
    ],
    content: content || '<p></p>',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'outline-none',
      },
    },
  })

  if (!editor) return (
    <div className="border border-white/20 rounded-xl bg-[#0a0a0f] min-h-[160px] flex items-center justify-center">
      <span className="text-gray-600 text-sm">טוען עורך...</span>
    </div>
  )

  function addLink() {
    const url = window.prompt('הזן URL:')
    if (!url) return
    try {
      const parsed = new URL(url, window.location.origin)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        alert('רק קישורי http/https מותרים')
        return
      }
    } catch {
      alert('URL לא תקף')
      return
    }
    editor!.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div className="border border-white/20 rounded-xl overflow-hidden bg-[#0a0a0f]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-white/10 bg-white/5">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="מודגש">
          <Bold size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="נטוי">
          <Italic size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="קו תחתון">
          <UnderlineIcon size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="קו חוצה">
          <Strikethrough size={14} />
        </ToolbarBtn>

        <span className="w-px h-5 bg-white/10 mx-1" />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="כותרת 2">
          <Heading2 size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="כותרת 3">
          <Heading3 size={14} />
        </ToolbarBtn>

        <span className="w-px h-5 bg-white/10 mx-1" />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="רשימת נקודות">
          <List size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="רשימה ממוספרת">
          <ListOrdered size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="ציטוט">
          <Quote size={14} />
        </ToolbarBtn>

        <span className="w-px h-5 bg-white/10 mx-1" />

        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="יישור לימין">
          <AlignRight size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="מרכז">
          <AlignCenter size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="יישור לשמאל">
          <AlignLeft size={14} />
        </ToolbarBtn>

        <span className="w-px h-5 bg-white/10 mx-1" />

        <ToolbarBtn onClick={addLink} active={editor.isActive('link')} title="קישור">
          <LinkIcon size={14} />
        </ToolbarBtn>

        <span className="w-px h-5 bg-white/10 mx-1" />

        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="בטל">
          <Undo size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="חזור">
          <Redo size={14} />
        </ToolbarBtn>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  )
}
