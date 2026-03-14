import { createContext, useContext, useCallback, useRef, useEffect, useState } from 'react'

type DirtyContextType = {
  markDirty: (key: string) => void
  markClean: (key: string) => void
  isDirty: () => boolean
  confirmNavigation: (onConfirm: () => void) => void
  pendingAction: (() => void) | null
  setPendingAction: (action: (() => void) | null) => void
  showPrompt: boolean
  setShowPrompt: (show: boolean) => void
}

const DirtyContext = createContext<DirtyContextType | null>(null)

export function AdminDirtyProvider({ children }: { children: React.ReactNode }) {
  const dirtyKeys = useRef(new Set<string>())
  const [showPrompt, setShowPrompt] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const markDirty = useCallback((key: string) => {
    dirtyKeys.current.add(key)
  }, [])

  const markClean = useCallback((key: string) => {
    dirtyKeys.current.delete(key)
  }, [])

  const isDirty = useCallback(() => dirtyKeys.current.size > 0, [])

  const confirmNavigation = useCallback((onConfirm: () => void) => {
    if (dirtyKeys.current.size > 0) {
      setPendingAction(() => onConfirm)
      setShowPrompt(true)
    } else {
      onConfirm()
    }
  }, [])

  // Browser beforeunload
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (dirtyKeys.current.size > 0) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  return (
    <DirtyContext.Provider value={{ markDirty, markClean, isDirty, confirmNavigation, pendingAction, setPendingAction, showPrompt, setShowPrompt }}>
      {children}
    </DirtyContext.Provider>
  )
}

export function useAdminDirty(key?: string, dirty?: boolean) {
  const ctx = useContext(DirtyContext)
  if (!ctx) throw new Error('useAdminDirty must be inside AdminDirtyProvider')

  useEffect(() => {
    if (key == null || dirty == null) return
    if (dirty) {
      ctx.markDirty(key)
    } else {
      ctx.markClean(key)
    }
    return () => { ctx.markClean(key) }
  }, [key, dirty, ctx])

  return ctx
}

export function UnsavedChangesDialog() {
  const ctx = useContext(DirtyContext)
  if (!ctx || !ctx.showPrompt) return null

  function handleDiscard() {
    const action = ctx!.pendingAction
    ctx!.setShowPrompt(false)
    ctx!.setPendingAction(null)
    if (action) action()
  }

  function handleCancel() {
    ctx!.setShowPrompt(false)
    ctx!.setPendingAction(null)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-[#12121a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-white font-bold text-lg mb-2">שינויים לא שמורים</h3>
        <p className="text-gray-400 text-sm mb-5">יש לך שינויים שלא נשמרו. אם תעבור עכשיו הם יאבדו.</p>
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            חזור ושמור
          </button>
          <button
            onClick={handleDiscard}
            className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-xl font-medium text-sm transition-colors border border-white/10"
          >
            עזוב בלי לשמור
          </button>
        </div>
      </div>
    </div>
  )
}
