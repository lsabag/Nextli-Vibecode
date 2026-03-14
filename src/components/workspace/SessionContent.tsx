import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import { CodeBlock } from './CodeBlock'
import { getSessionContent } from '@/lib/supabase/queries/workspace'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { FeedbackBlock } from './FeedbackBlock'
import { PrepBlock } from './PrepBlock'
import { Check, Lock, Download, Copy, CheckCheck } from 'lucide-react'
import type { Course, CourseSession, SessionContent as SessionContentType } from '@/types'
import type { useProgress } from '@/hooks/useProgress'

type Props = {
  session: CourseSession
  course?: Course | null
  userId?: string
  progress: ReturnType<typeof useProgress>
}

function toEmbedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return url
}

/** Convert share URLs from Google Drive / Dropbox to direct download links */
function toDirectDownloadUrl(url: string): string {
  // Google Drive: /file/d/FILE_ID/view → /uc?export=download&id=FILE_ID
  const gdriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (gdriveMatch) return `https://drive.google.com/uc?export=download&id=${gdriveMatch[1]}`
  // Google Drive: open?id=FILE_ID
  const gdriveOpen = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/)
  if (gdriveOpen) return `https://drive.google.com/uc?export=download&id=${gdriveOpen[1]}`
  // Dropbox: ?dl=0 → ?dl=1
  if (url.includes('dropbox.com') && url.includes('dl=0')) return url.replace('dl=0', 'dl=1')
  if (url.includes('dropbox.com') && !url.includes('dl=')) return url + (url.includes('?') ? '&dl=1' : '?dl=1')
  return url
}

function LockedBlock({ title, message }: { title: string; message?: string }) {
  return (
    <div className="relative bg-white/3 border border-white/8 rounded-xl p-6 overflow-hidden select-none" role="region" aria-label={`${title || 'תוכן נעול'} - נעול`}>
      <div className="blur-sm opacity-30 space-y-2 pointer-events-none" aria-hidden="true">
        <div className="h-4 bg-white/20 rounded w-3/4" />
        <div className="h-4 bg-white/20 rounded w-full" />
        <div className="h-4 bg-white/20 rounded w-1/2" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <Lock size={22} className="text-gray-500" aria-hidden="true" />
        <p className="text-gray-500 text-sm font-medium">{title || 'תוכן נעול'}</p>
        <p className="text-gray-600 text-xs">{message || 'יפתח בהמשך הקורס'}</p>
      </div>
    </div>
  )
}

function ContentCheckbox({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      onClick={onToggle}
      aria-label={checked ? `סמן ${label} כלא הושלם` : `סמן ${label} כהושלם`}
      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        checked
          ? 'bg-green-500 border-green-500 text-white'
          : 'border-white/20 hover:border-blue-400 text-transparent hover:text-blue-400/30'
      }`}
    >
      <Check size={14} />
    </button>
  )
}

function parsePromptContent(content: string): { he: string; en: string } {
  if (!content) return { he: '', en: '' }
  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === 'object' && ('he' in parsed || 'en' in parsed)) {
      return { he: parsed.he || '', en: parsed.en || '' }
    }
  } catch { /* not JSON — legacy plain text */ }
  return { he: '', en: content }
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
        copied
          ? 'bg-green-500/20 text-green-400'
          : 'bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white'
      }`}
    >
      {copied ? <><CheckCheck size={13} /> הועתק!</> : <><Copy size={13} /> {label || 'העתק'}</>}
    </button>
  )
}

function PromptBlock({ title, content, checkbox }: { title: string; content: string; checkbox: React.ReactNode }) {
  const { he, en } = parsePromptContent(content)
  const hasBoth = !!he && !!en

  return (
    <div className="flex items-start gap-3">
      {checkbox}
      <div className="flex-1 bg-purple-500/5 border border-purple-500/20 rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-3">{title}</h3>

        {hasBoth ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Hebrew — right side (first in RTL) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-purple-400 font-medium">עברית</span>
                <CopyButton text={he} />
              </div>
              <pre className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-mono bg-black/20 rounded-lg p-3" dir="rtl">
                {he}
              </pre>
            </div>
            {/* English — left side (second in RTL) */}
            <div dir="ltr" style={{ unicodeBidi: 'isolate' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-blue-400 font-medium">English</span>
                <CopyButton text={en} />
              </div>
              <pre className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-mono bg-black/20 rounded-lg p-3" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'plaintext', textAlign: 'left' }}>
                {en}
              </pre>
            </div>
          </div>
        ) : he ? (
          <>
            <div className="flex justify-end mb-2">
              <CopyButton text={he} />
            </div>
            <pre className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-mono bg-black/20 rounded-lg p-3" dir="rtl">
              {he}
            </pre>
          </>
        ) : (
          <div dir="ltr" style={{ unicodeBidi: 'isolate', textAlign: 'left' }}>
            <div className="flex justify-end mb-2">
              <CopyButton text={en} />
            </div>
            <pre className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-mono bg-black/20 rounded-lg p-3" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'plaintext', textAlign: 'left' }}>
              {en}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export function SessionContent({ session, course, userId, progress }: Props) {
  const [content, setContent] = useState<SessionContentType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getSessionContent(session.id)
      .then(data => { setContent(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [session.id])

  // Progressive reveal logic
  const courseCompleted = course?.status === 'completed'

  function isItemVisible(idx: number, item: SessionContentType): boolean {
    // Admin-locked items are always locked
    if (item.is_locked) return false
    // Course completed → everything visible
    if (courseCompleted) return true
    // Active course: check reveal_index
    // Items beyond reveal_index are not yet revealed by admin
    if (idx >= session.reveal_index && session.reveal_index > 0) return false
    if (session.reveal_index === 0) return false
    // For async students: must complete previous items to see next
    // (items up to reveal_index are visible, but only if previous are completed)
    for (let i = 0; i < idx; i++) {
      const prevItem = content[i]
      if (!prevItem.is_locked && !progress.isCompleted(prevItem.id)) {
        // Previous unlocked item not completed → this one is locked for async students
        // But we show it as "complete previous first" not fully locked
        return false
      }
    }
    return true
  }

  // When reveal_index is 0 and course is not completed, check if we should show all
  // (backwards compat: if reveal_index was never set, show all non-locked items)
  const useRevealLogic = session.reveal_index > 0 || courseCompleted

  const visibleItems = content.filter((item, idx) => {
    if (!useRevealLogic) return !item.is_locked
    return isItemVisible(idx, item)
  })
  const completedCount = visibleItems.filter(c => progress.isCompleted(c.id)).length
  const percent = visibleItems.length > 0 ? Math.round((completedCount / visibleItems.length) * 100) : 0

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <article dir="rtl" aria-label={`מפגש ${session.session_number}: ${session.title}`}>
      <div className="mb-8">
        <div className="text-blue-400 text-sm font-semibold mb-2">
          מפגש {session.session_number}
        </div>
        <h1 className="text-3xl font-black text-white mb-3">{session.title}</h1>
        <p className="text-gray-400 mb-4">{session.description}</p>
        {visibleItems.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-xs">
              <ProgressBar percent={percent} size="md" label={`התקדמות במפגש ${session.session_number}`} />
            </div>
            <span className="text-sm text-gray-500">{completedCount}/{visibleItems.length} פריטים</span>
          </div>
        )}
      </div>

      {content.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-4" aria-hidden="true">&#x1F4DA;</div>
          <p className="text-gray-400">התוכן יתווסף בקרוב</p>
        </div>
      ) : (
        <div className="space-y-6">
          {content.map((item, idx) => {
            // Admin-locked
            if (item.is_locked) {
              return <LockedBlock key={item.id} title={item.title} />
            }

            // Not yet revealed or needs previous completion
            if (useRevealLogic && !isItemVisible(idx, item)) {
              // Check if it's beyond reveal_index (not yet shown in class)
              if (idx >= session.reveal_index && !courseCompleted) {
                return <LockedBlock key={item.id} title={item.title} message="יחשף בהמשך השיעור" />
              }
              // Previous items not completed
              return <LockedBlock key={item.id} title={item.title} message="השלם את הפריטים הקודמים כדי לפתוח" />
            }

            const completed = progress.isCompleted(item.id)
            const checkbox = userId ? (
              <ContentCheckbox
                checked={completed}
                onToggle={() => progress.toggle(item.id, session.id)}
                label={item.title}
              />
            ) : null

            if (item.content_type === 'prompt') {
              return <PromptBlock key={item.id} title={item.title} content={item.content} checkbox={checkbox} />
            }

            if (item.content_type === 'code') {
              return (
                <div key={item.id} className="flex items-start gap-3">
                  {checkbox}
                  <div className="flex-1 min-w-0">
                    <CodeBlock title={item.title} content={item.content} language={item.language} />
                  </div>
                </div>
              )
            }

            if (item.content_type === 'video') {
              return (
                <div key={item.id} className="flex items-start gap-3">
                  {checkbox}
                  <div className="flex-1 min-w-0 rounded-xl overflow-hidden border border-white/10">
                    <div className="bg-white/5 px-4 py-2 text-sm text-gray-300 font-medium">
                      {item.title}
                    </div>
                    <div className="aspect-video bg-black">
                      <iframe
                        src={toEmbedUrl(item.content)}
                        className="w-full h-full"
                        allowFullScreen
                        title={item.title}
                        sandbox="allow-same-origin allow-scripts allow-popups"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                </div>
              )
            }

            if (item.content_type === 'file') {
              return (
                <div key={item.id} className="flex items-center gap-3">
                  {checkbox}
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Download size={18} className="text-blue-400" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm">{item.title}</h3>
                      {item.content && <p className="text-gray-400 text-xs mt-0.5 truncate">{item.content}</p>}
                    </div>
                    {item.file_url && (
                      <a
                        href={toDirectDownloadUrl(item.file_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`הורד ${item.title}`}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Download size={13} aria-hidden="true" />
                        הורד
                      </a>
                    )}
                  </div>
                </div>
              )
            }

            if (item.content_type === 'rich_text') {
              return (
                <div key={item.id} className="flex items-start gap-3">
                  {checkbox}
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-white font-semibold mb-4">{item.title}</h3>
                    <div
                      className="prose prose-invert prose-sm max-w-none text-gray-300"
                      dir="rtl"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content) }}
                    />
                  </div>
                </div>
              )
            }

            if (item.content_type === 'feedback') {
              return userId ? (
                <div key={item.id} className="flex items-start gap-3">
                  {checkbox}
                  <div className="flex-1 min-w-0">
                    <FeedbackBlock userId={userId} sessionId={session.id} />
                  </div>
                </div>
              ) : null
            }

            if (item.content_type === 'prep') {
              return (
                <div key={item.id} className="flex items-start gap-3">
                  {checkbox}
                  <div className="flex-1 min-w-0">
                    <PrepBlock courseId={session.course_id} sessionId={session.id} />
                  </div>
                </div>
              )
            }

            // plain text fallback
            return (
              <div key={item.id} className="flex items-start gap-3">
                {checkbox}
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-3">{item.title}</h3>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </article>
  )
}
