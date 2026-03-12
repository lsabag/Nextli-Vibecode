import { useEffect, useState } from 'react'
import { getPromptsForSession } from '@/lib/supabase/queries/workspace'
import type { PromptLibraryItem } from '@/types'

type Props = { sessionId: string }

export function PromptLibrary({ sessionId }: Props) {
  const [prompts, setPrompts] = useState<PromptLibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    getPromptsForSession(sessionId)
      .then(data => { setPrompts(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [sessionId])

  async function handleCopy(content: string, id: string) {
    await navigator.clipboard.writeText(content)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div dir="rtl">
      <h2 className="text-2xl font-black text-white mb-6">ספריית פרומפטים</h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      ) : prompts.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-gray-400">אין פרומפטים למפגש זה עדיין</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prompts.map(prompt => (
            <div
              key={prompt.id}
              className="bg-white/5 border border-white/10 hover:border-white/20 rounded-xl p-5 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-600/30 text-blue-400 text-xs px-2 py-0.5 rounded-full">
                      {prompt.category}
                    </span>
                    <span className="text-white font-semibold text-sm">{prompt.title}</span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">{prompt.content}</p>
                </div>
                <button
                  onClick={() => handleCopy(prompt.content, prompt.id)}
                  className="flex-shrink-0 text-xs border border-white/20 hover:border-white/40 text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-all"
                >
                  {copied === prompt.id ? '✓' : 'העתק'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
