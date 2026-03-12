/**
 * Cross-tab synchronization via BroadcastChannel.
 * In dev mode (mock Supabase), notifies other tabs when data changes.
 * In production, Supabase Realtime handles this — this is a supplement.
 */

export type SyncEvent = {
  table: string
  action: 'insert' | 'update' | 'upsert' | 'delete'
  timestamp: number
}

type Listener = (event: SyncEvent) => void

const CHANNEL_NAME = 'nextli-sync'
let channel: BroadcastChannel | null = null
const listeners = new Set<Listener>()

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME)
    channel.onmessage = (e: MessageEvent<SyncEvent>) => {
      for (const fn of listeners) fn(e.data)
    }
  }
  return channel
}

/** Broadcast that a table was mutated (call from the tab that made the change) */
export function broadcastChange(table: string, action: SyncEvent['action']) {
  getChannel()?.postMessage({ table, action, timestamp: Date.now() } satisfies SyncEvent)
}

/** Subscribe to changes from other tabs. Returns unsubscribe function. */
export function onCrossTabChange(fn: Listener): () => void {
  getChannel() // ensure channel is initialized
  listeners.add(fn)
  return () => listeners.delete(fn)
}
