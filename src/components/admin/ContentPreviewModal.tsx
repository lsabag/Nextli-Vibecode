import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import { X, Lock, Download } from 'lucide-react'
import { getAdminSessionContent } from '@/lib/supabase/queries/admin'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import type { SessionContent, CourseSession } from '@/types'

interface Props {
  session: CourseSession
  onClose: () => void
}

function toEmbedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return url
}

export function ContentPreviewModal({ session, onClose }: Props) {
  const [content, setContent] = useState<SessionContent[]>([])
  const [loading, setLoading] = useState(true)
  const trapRef = useFocusTrap<HTMLDivElement>(true)

  useEffect(() => {
    getAdminSessionContent(session.id)
      .then(data => { setContent(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [session.id])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      ref={trapRef}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto" dir="rtl">
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0a0f] border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <span className="text-blue-400 text-xs font-semibold">תצוגה מקדימה</span>
            <h2 id="preview-title" className="text-lg font-bold text-white">{session.title}</h2>
          </div>
          <button onClick={onClose} aria-label="סגור תצוגה מקדימה" title="סגור" className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-gray-400">{session.description}</p>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : content.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>אין תוכן למפגש זה</p>
            </div>
          ) : (
            content.map(item => {
              if (item.is_locked) {
                return (
                  <div key={item.id} className="relative bg-white/3 border border-white/8 rounded-xl p-6 overflow-hidden select-none">
                    <div className="blur-sm opacity-30 space-y-2 pointer-events-none" aria-hidden="true">
                      <div className="h-4 bg-white/20 rounded w-3/4" />
                      <div className="h-4 bg-white/20 rounded w-full" />
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <Lock size={22} className="text-gray-500" />
                      <p className="text-gray-500 text-sm font-medium">{item.title} - נעול</p>
                    </div>
                  </div>
                )
              }

              if (item.content_type === 'video') {
                return (
                  <div key={item.id} className="rounded-xl overflow-hidden border border-white/10">
                    <div className="bg-white/5 px-4 py-2 text-sm text-gray-300 font-medium">{item.title}</div>
                    <div className="aspect-video bg-black">
                      <iframe src={toEmbedUrl(item.content)} className="w-full h-full" allowFullScreen title={item.title} sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation" referrerPolicy="no-referrer-when-downgrade" />
                    </div>
                  </div>
                )
              }

              if (item.content_type === 'code') {
                return (
                  <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 text-sm text-gray-300 font-medium bg-white/5">{item.title}</div>
                    <pre className="p-4 text-sm text-gray-300 overflow-x-auto" dir="ltr">
                      <code>{item.content}</code>
                    </pre>
                  </div>
                )
              }

              if (item.content_type === 'file') {
                return (
                  <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-4">
                    <Download size={18} className="text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm">{item.title}</h3>
                      {item.content && <p className="text-gray-400 text-xs mt-0.5">{item.content}</p>}
                    </div>
                  </div>
                )
              }

              if (item.content_type === 'rich_text') {
                return (
                  <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-white font-semibold mb-4">{item.title}</h3>
                    <div
                      className="prose prose-invert prose-sm max-w-none text-gray-300"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content) }}
                    />
                  </div>
                )
              }

              if (item.content_type === 'feedback') {
                return (
                  <div key={item.id} className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-6 text-center">
                    <p className="text-purple-400 text-sm font-medium">בלוק פידבק — התלמיד ימלא כאן</p>
                  </div>
                )
              }

              if (item.content_type === 'prep') {
                return (
                  <div key={item.id} className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6 text-center">
                    <p className="text-blue-400 text-sm font-medium">בלוק הכנה למפגש — צ'קליסט</p>
                  </div>
                )
              }

              return (
                <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-3">{item.title}</h3>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
