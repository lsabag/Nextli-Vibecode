import { useEffect, useRef } from 'react'
import { Search, X, FileText, Zap, BookOpen } from 'lucide-react'
import { useSearch } from '@/hooks/useSearch'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import type { SearchResult } from '@/lib/supabase/queries/workspace'

interface Props {
  userId: string | undefined
  open: boolean
  onClose: () => void
  onNavigate: (sessionId: string | null, panel?: 'content' | 'prompts' | 'notes') => void
}

const typeConfig: Record<SearchResult['type'], { label: string; icon: typeof FileText; color: string }> = {
  content: { label: 'תוכן', icon: BookOpen, color: 'text-blue-400' },
  prompt: { label: 'פרומפט', icon: Zap, color: 'text-purple-400' },
  note: { label: 'הערה', icon: FileText, color: 'text-green-400' },
}

export function SearchModal({ userId, open, onClose, onNavigate }: Props) {
  const { query, results, searching, search, clear } = useSearch(userId)
  const inputRef = useRef<HTMLInputElement>(null)
  const trapRef = useFocusTrap<HTMLDivElement>(open)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      clear()
    }
  }, [open, clear])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) onClose()
        else onClose() // parent handles toggle
      }
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  function handleSelect(result: SearchResult) {
    const panel = result.type === 'prompt' ? 'prompts' : result.type === 'note' ? 'notes' : 'content'
    onNavigate(result.sessionId, panel)
    onClose()
  }

  return (
    <div
      ref={trapRef}
      className="fixed inset-0 z-[80] flex items-start justify-center pt-[15vh] bg-black/60 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="חיפוש"
    >
      <div className="bg-[#111118] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl" dir="rtl">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search size={18} className="text-gray-500 flex-shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => search(e.target.value)}
            placeholder="חפש בתוכן, פרומפטים והערות..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
            aria-label="שדה חיפוש"
          />
          {query && (
            <button onClick={clear} aria-label="נקה חיפוש" className="text-gray-500 hover:text-white transition-colors p-1">
              <X size={16} />
            </button>
          )}
          <kbd className="text-xs text-gray-600 bg-white/5 px-1.5 py-0.5 rounded border border-white/10" aria-hidden="true">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {searching && (
            <div className="flex items-center justify-center py-8 text-gray-500 text-sm gap-2">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              מחפש...
            </div>
          )}

          {!searching && query && results.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              לא נמצאו תוצאות עבור &ldquo;{query}&rdquo;
            </div>
          )}

          {!searching && results.length > 0 && (
            <ul role="listbox" aria-label="תוצאות חיפוש">
              {results.map(result => {
                const config = typeConfig[result.type]
                const Icon = config.icon
                return (
                  <li key={`${result.type}-${result.id}`}>
                    <button
                      onClick={() => handleSelect(result)}
                      role="option"
                      aria-selected={false}
                      className="w-full text-right px-4 py-3 hover:bg-white/5 transition-colors flex items-start gap-3"
                    >
                      <Icon size={16} className={`${config.color} flex-shrink-0 mt-0.5`} aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-white truncate">{result.title}</span>
                          <span className={`text-xs ${config.color} bg-white/5 px-1.5 py-0.5 rounded`}>{config.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{result.snippet}</p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {!query && (
            <div className="text-center py-8 text-gray-600 text-sm">
              הקלד לחיפוש בתוכן הקורס, פרומפטים והערות
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
