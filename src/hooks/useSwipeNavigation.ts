import { useRef, useCallback, useEffect } from 'react'

interface SwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
  enabled?: boolean
}

export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  enabled = true,
}: SwipeOptions) {
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const touchEnd = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = useCallback((e: TouchEvent) => {
    touchEnd.current = null
    touchStart.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY }
  }, [])

  const onTouchMove = useCallback((e: TouchEvent) => {
    touchEnd.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY }
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return
    const dx = touchStart.current.x - touchEnd.current.x
    const dy = touchStart.current.y - touchEnd.current.y
    // Only trigger if horizontal movement is dominant
    if (Math.abs(dx) < threshold || Math.abs(dy) > Math.abs(dx)) return

    if (dx > 0) {
      // Swiped left (RTL: next session)
      onSwipeLeft?.()
    } else {
      // Swiped right (RTL: previous session)
      onSwipeRight?.()
    }
  }, [onSwipeLeft, onSwipeRight, threshold])

  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [onTouchStart, onTouchMove, onTouchEnd, enabled])

  return ref
}
