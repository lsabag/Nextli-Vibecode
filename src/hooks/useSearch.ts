import { useState, useCallback, useRef } from 'react'
import { searchWorkspace, type SearchResult } from '@/lib/supabase/queries/workspace'

export function useSearch(userId: string | undefined) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(
    (q: string) => {
      setQuery(q)
      if (timerRef.current) clearTimeout(timerRef.current)

      if (!q.trim() || !userId) {
        setResults([])
        setSearching(false)
        return
      }

      setSearching(true)
      timerRef.current = setTimeout(async () => {
        const data = await searchWorkspace(q, userId)
        setResults(data)
        setSearching(false)
      }, 300)
    },
    [userId]
  )

  const clear = useCallback(() => {
    setQuery('')
    setResults([])
    setSearching(false)
  }, [])

  return { query, results, searching, search, clear }
}
