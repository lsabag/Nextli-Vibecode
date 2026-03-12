/**
 * Database client — replaces Supabase SDK with a backend-agnostic implementation.
 *
 * DEV_BYPASS=true  → mock data in localStorage (no server needed)
 * Production       → fetch-based client calling Cloudflare Worker API at /api/*
 */

import { broadcastChange, onCrossTabChange } from '@/lib/crossTabSync'

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS === 'true'

// ── Auth types (replaces @supabase/supabase-js User / Session) ──────────────

export type AuthUser = {
  id: string
  email: string
  aud: string
  role: string
  app_metadata: Record<string, unknown>
  user_metadata: Record<string, unknown>
  created_at: string
}

export type AuthSession = {
  user: AuthUser
  access_token: string
  expires_at?: number
}

// ── Mock seed data ──────────────────────────────────────────────────────────

const MOCK_STORAGE_KEY = 'nextli-mock-data'
const MOCK_COURSE_ID = 'course-001'

const seedData: Record<string, unknown[]> = {
  courses: [
    { id: MOCK_COURSE_ID, title: 'וייבקוד — פיתוח עם AI', description: 'קורס אינטנסיבי לבניית אתרים ואפליקציות בעזרת כלי AI', status: 'active', display_order: 0, created_at: '2026-01-01T00:00:00Z' },
  ],
  course_sessions: [
    { id: 'session-001', course_id: MOCK_COURSE_ID, session_number: 1, title: 'מפגש 1: הכרות עם AI Coding', description: 'סביבת עבודה, כלים בסיסיים, ופרויקט ראשון', status: 'open', reveal_index: 3, scheduled_at: null, created_at: '2026-01-01T00:00:00Z' },
    { id: 'session-002', course_id: MOCK_COURSE_ID, session_number: 2, title: 'מפגש 2: בניית אפליקציה מלאה', description: 'Frontend, Backend, ו-Database', status: 'open', reveal_index: 2, scheduled_at: null, created_at: '2026-01-02T00:00:00Z' },
    { id: 'session-003', course_id: MOCK_COURSE_ID, session_number: 3, title: 'מפגש 3: Deploy ו-Production', description: 'העלאה לאוויר, דומיין, ואופטימיזציה', status: 'locked', reveal_index: 0, scheduled_at: '2026-04-01T18:00:00Z', created_at: '2026-01-03T00:00:00Z' },
  ],
  session_content: [
    { id: 'content-001', session_id: 'session-001', content_type: 'rich_text', title: 'ברוכים הבאים!', content: '<p>ברוכים הבאים לקורס <strong>וייבקוד</strong>. בקורס זה נלמד איך לבנות אתרים ואפליקציות בעזרת כלי AI מתקדמים.</p>', language: null, display_order: 0, is_locked: false, file_url: null, created_at: '2026-01-01T00:00:00Z' },
    { id: 'content-002', session_id: 'session-001', content_type: 'video', title: 'סרטון הדגמה', content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', language: null, display_order: 1, is_locked: false, file_url: null, created_at: '2026-01-01T00:00:00Z' },
    { id: 'content-003', session_id: 'session-001', content_type: 'prompt', title: 'פרומפט ראשון', content: 'Build me a modern landing page with a hero section, features grid, and contact form. Use React, Tailwind CSS, and make it responsive.', language: null, display_order: 2, is_locked: false, file_url: null, created_at: '2026-01-01T00:00:00Z' },
    { id: 'content-004', session_id: 'session-001', content_type: 'code', title: 'דוגמת קוד', content: 'export default function App() {\n  return (\n    <div className="min-h-screen bg-gray-900 text-white">\n      <h1>Hello World</h1>\n    </div>\n  )\n}', language: 'typescript', display_order: 3, is_locked: false, file_url: null, created_at: '2026-01-01T00:00:00Z' },
    { id: 'content-005', session_id: 'session-001', content_type: 'file', title: 'חומרי עזר', content: 'קובץ PDF עם סיכום החומר', language: null, display_order: 4, is_locked: true, file_url: 'https://example.com/file.pdf', created_at: '2026-01-01T00:00:00Z' },
    { id: 'content-010', session_id: 'session-002', content_type: 'rich_text', title: 'מבנה אפליקציה', content: '<p>במפגש זה נבנה אפליקציה <strong>Full Stack</strong> מאפס.</p><ul><li>Frontend עם React</li><li>Backend עם Supabase</li><li>Database עם PostgreSQL</li></ul>', language: null, display_order: 0, is_locked: false, file_url: null, created_at: '2026-01-02T00:00:00Z' },
    { id: 'content-011', session_id: 'session-002', content_type: 'prompt', title: 'פרומפט לבניית DB', content: 'Create a Supabase database schema for a task management app with: users, projects, tasks (with status, priority, due_date), and comments. Include RLS policies.', language: null, display_order: 1, is_locked: false, file_url: null, created_at: '2026-01-02T00:00:00Z' },
    { id: 'content-012', session_id: 'session-002', content_type: 'rich_text', title: 'סיכום', content: '<p>כל הכבוד! סיימתם את המפגש השני.</p>', language: null, display_order: 2, is_locked: false, file_url: null, created_at: '2026-01-02T00:00:00Z' },
  ],
  system_settings: [
    { key: 'hero_headline', value: 'למד לבנות אתרים עם AI' },
    { key: 'hero_subheadline', value: 'קורס אינטנסיבי לפיתוח עם וייבקוד' },
    { key: 'hero_description', value: 'בנה אתרים ואפליקציות מלאים בעזרת כלי AI מתקדמים — ללא ניסיון קודם בתכנות.' },
    { key: 'contact_email', value: 'info@nextli.co.il' },
    { key: 'contact_phone', value: '050-1234567' },
    { key: 'fomo_banner_active', value: 'true' },
    { key: 'fomo_text', value: 'מקומות מוגבלים! המחיר עולה בקרוב — הצטרף עכשיו' },
    { key: 'fomo_cta_text', value: 'הצטרף עכשיו' },
    { key: 'fomo_cta_link', value: '/intake' },
    { key: 'fomo_variant', value: 'gradient' },
    { key: 'fomo_end_time', value: '' },
    { key: 'ai_mentor_active', value: 'false' },
  ],
  prompts_library: [
    { id: 'prompt-001', session_id: 'session-001', title: 'יצירת Landing Page', content: 'Build me a modern landing page with hero, features, and CTA sections using React and Tailwind.', category: 'פיתוח', display_order: 0, is_active: true, created_at: '2026-01-01T00:00:00Z' },
    { id: 'prompt-002', session_id: 'session-001', title: 'דיבאג קוד', content: 'I have this error: [paste error]. Here is my code: [paste code]. Help me fix it and explain what went wrong.', category: 'דיבאג', display_order: 1, is_active: true, created_at: '2026-01-01T00:00:00Z' },
  ],
  user_profiles: [],
  wizard_steps: [
    { id: 'wiz-001', question_text: 'מה רמת הניסיון שלך בתכנות?', field_type: 'select', options: ['אין לי ניסיון בכלל', 'ניסיתי קצת לבד (YouTube / קורסים)', 'יש לי ניסיון בסיסי (HTML/CSS)', 'אני מתכנת/ת עם ניסיון'], step_order: 1, is_active: true, created_at: '2026-01-01T00:00:00Z' },
    { id: 'wiz-002', question_text: 'האם השתמשת בעבר בכלי AI לפיתוח (כמו ChatGPT, Copilot, Lovable)?', field_type: 'select', options: ['לא, בכלל לא', 'ניסיתי ChatGPT לדברים כלליים', 'השתמשתי ב-AI לכתיבת קוד', 'אני משתמש/ת באופן קבוע'], step_order: 2, is_active: true, created_at: '2026-01-01T00:00:00Z' },
    { id: 'wiz-003', question_text: 'מה היית רוצה לבנות בקורס?', field_type: 'select', options: ['אתר אישי / תיק עבודות', 'דף נחיתה לעסק', 'אפליקציית ווב (SaaS / כלי)', 'חנות / מסחר אלקטרוני', 'עוד לא יודע/ת'], step_order: 3, is_active: true, created_at: '2026-01-01T00:00:00Z' },
    { id: 'wiz-004', question_text: 'למה נרשמת לקורס? מה הציפיות שלך?', field_type: 'textarea', options: null, step_order: 4, is_active: true, created_at: '2026-01-01T00:00:00Z' },
    { id: 'wiz-005', question_text: 'איך שמעת עלינו?', field_type: 'select', options: ['פייסבוק / אינסטגרם', 'חבר/ה המליץ/ה', 'חיפוש בגוגל', 'טיקטוק', 'אחר'], step_order: 5, is_active: true, created_at: '2026-01-01T00:00:00Z' },
  ],
  wizard_answers: [],
  student_notes: [],
  session_feedback: [],
  additional_courses: [],
  team_members: [],
  content_progress: [],
  notifications: [],
  waitlist: [],
  prep_checklist: [
    { id: 'prep-001', course_id: MOCK_COURSE_ID, session_id: 'session-001', title: 'פתיחת חשבון ב-Lovable', description: 'הירשמו דרך הקישור שלנו — שנינו מקבלים 10 קרדיטים בחינם. חשוב: אל תשתמשו בקרדיטים לפני הקורס!', link_url: 'https://lovable.dev/invite/NK2MOR2', link_label: 'הרשמה ל-Lovable', links: null, display_order: 0, is_required: true, is_active: true, created_at: '2026-01-01T00:00:00Z' },
    { id: 'prep-002', course_id: MOCK_COURSE_ID, session_id: 'session-001', title: 'דפדפן Chrome מעודכן', description: 'ודאו שמותקן לכם Google Chrome בגרסה העדכנית — זה הדפדפן הכי מתאים לעבודה.', link_url: 'https://www.google.com/chrome/', link_label: 'הורדת Chrome', links: null, display_order: 1, is_required: true, is_active: true, created_at: '2026-01-01T00:00:00Z' },
    { id: 'prep-003', course_id: MOCK_COURSE_ID, session_id: 'session-001', title: 'חשבון Google או GitHub', description: 'נדרש להתחברות ל-Lovable. אם יש לכם כבר — מצוין, אפשר לסמן V.', link_url: null, link_label: null, links: null, display_order: 2, is_required: true, is_active: true, created_at: '2026-01-01T00:00:00Z' },
    { id: 'prep-004', course_id: MOCK_COURSE_ID, session_id: 'session-001', title: 'חשבו מה תרצו לבנות', description: 'אתר אישי? תיק עבודות? דף עסקי? משחק? תביאו רעיון כללי למפגש הראשון.', link_url: null, link_label: null, links: null, display_order: 3, is_required: false, is_active: true, created_at: '2026-01-01T00:00:00Z' },
    { id: 'prep-005', course_id: MOCK_COURSE_ID, session_id: 'session-001', title: 'הכינו תוכן אישי', description: '2-3 משפטים על עצמכם, תמונת פרופיל אם יש, לוגו אם יש. נשתמש בזה בפרויקט הראשון.', link_url: null, link_label: null, links: null, display_order: 4, is_required: false, is_active: true, created_at: '2026-01-01T00:00:00Z' },
    { id: 'prep-006', course_id: MOCK_COURSE_ID, session_id: 'session-001', title: 'מצאו אתר שמעצב אתכם', description: 'צלמו מסך של אתר שאתם אוהבים את העיצוב שלו — נשתמש בזה כהשראה.', link_url: null, link_label: null, links: null, display_order: 5, is_required: false, is_active: true, created_at: '2026-01-01T00:00:00Z' },
  ],
}

// ── Mock data persistence ───────────────────────────────────────────────────

function loadMockData(): Record<string, unknown[]> {
  try {
    const stored = localStorage.getItem(MOCK_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, unknown[]>
      for (const key of Object.keys(seedData)) {
        if ((!parsed[key] || parsed[key].length === 0) && seedData[key].length > 0) {
          parsed[key] = structuredClone(seedData[key])
        }
      }
      return parsed
    }
  } catch { /* ignore parse errors */ }
  return structuredClone(seedData)
}

function persistMockData() {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockData))
  } catch { /* quota exceeded — silently ignore */ }
}

const mockData: Record<string, unknown[]> = DEV_BYPASS ? loadMockData() : {}

/** Reset mock data to seed defaults (call from dev console: resetMockData()) */
export function resetMockData() {
  Object.keys(mockData).forEach(k => delete mockData[k])
  Object.assign(mockData, structuredClone(seedData))
  localStorage.removeItem(MOCK_STORAGE_KEY)
  location.reload()
}

if (DEV_BYPASS && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).resetMockData = resetMockData
}

// ── Mock query builder ──────────────────────────────────────────────────────

type MockOp = 'select' | 'insert' | 'update' | 'upsert' | 'delete'

function createMockQueryBuilder(tableName: string, op: MockOp = 'select', payload?: unknown) {
  const filters: Array<(rows: Record<string, unknown>[]) => Record<string, unknown>[]> = []
  let resultOverride: { data: unknown; error: null } | null = null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: Record<string, any> = {}

  const noopChain = [
    'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
    'is', 'filter', 'match', 'not', 'contains', 'containedBy',
    'textSearch', 'range',
  ]
  for (const m of noopChain) builder[m] = () => builder

  builder.select = () => builder
  builder.insert = (d: unknown) => createMockQueryBuilder(tableName, 'insert', d)
  builder.update = (d: unknown) => createMockQueryBuilder(tableName, 'update', d)
  builder.upsert = (d: unknown) => createMockQueryBuilder(tableName, 'upsert', d)
  builder.delete = () => createMockQueryBuilder(tableName, 'delete')

  builder.eq = (col: string, val: unknown) => {
    filters.push(rows => rows.filter(r => r[col] === val))
    return builder
  }
  builder.in = (col: string, vals: unknown[]) => {
    filters.push(rows => rows.filter(r => vals.includes(r[col])))
    return builder
  }
  builder.or = () => builder
  builder.order = (col: string, opts?: { ascending?: boolean }) => {
    const asc = opts?.ascending ?? true
    filters.push(rows => [...rows].sort((a, b) => {
      if (a[col] < b[col]) return asc ? -1 : 1
      if (a[col] > b[col]) return asc ? 1 : -1
      return 0
    }))
    return builder
  }
  builder.limit = (n: number) => {
    filters.push(rows => rows.slice(0, n))
    return builder
  }
  builder.single = () => {
    resultOverride = { data: getResult()[0] ?? null, error: null }
    return builder
  }
  builder.maybeSingle = () => {
    resultOverride = { data: getResult()[0] ?? null, error: null }
    return builder
  }

  function matchesFilters(row: Record<string, unknown>) {
    let rows = [row]
    for (const f of filters) rows = f(rows)
    return rows.length > 0
  }

  function applyMutation() {
    if (!mockData[tableName]) mockData[tableName] = []
    const table = mockData[tableName] as Record<string, unknown>[]

    if (op === 'insert') {
      const items = Array.isArray(payload) ? payload : [payload]
      for (const item of items) table.push(item as Record<string, unknown>)
    }
    if (op === 'update' && payload) {
      for (const row of table) {
        if (matchesFilters(row)) Object.assign(row, payload)
      }
    }
    if (op === 'upsert') {
      const items = Array.isArray(payload) ? payload : [payload]
      for (const item of items as Record<string, unknown>[]) {
        const idx = table.findIndex(r =>
          (item.id && r.id === item.id) || (!item.id && item.key && r.key === item.key)
        )
        if (idx >= 0) Object.assign(table[idx], item)
        else table.push(item)
      }
    }
    if (op === 'delete') {
      mockData[tableName] = table.filter(row => !matchesFilters(row))
    }
  }

  function getResult() {
    let rows = [...(mockData[tableName] || [])] as Record<string, unknown>[]
    for (const f of filters) rows = f(rows)
    return rows
  }

  const resultPromise = () => {
    if (op !== 'select') {
      applyMutation()
      persistMockData()
      broadcastChange(tableName, op as 'insert' | 'update' | 'upsert' | 'delete')
    }
    return resultOverride ?? { data: getResult(), error: null }
  }

  builder.then = (
    onFulfilled?: ((v: { data: unknown; error: null }) => unknown) | null,
    onRejected?: ((reason: unknown) => unknown) | null,
  ) => {
    return Promise.resolve(resultPromise()).then(onFulfilled, onRejected)
  }

  builder.catch = (onRejected?: ((reason: unknown) => unknown) | null) => {
    return Promise.resolve(resultPromise()).catch(onRejected)
  }

  return builder
}

// ── API query builder (production — calls Cloudflare Worker) ────────────────

type FilterSpec = { type: string; column?: string; value?: unknown; expr?: string }

type QuerySpec = {
  table: string
  operation: string
  columns: string | null
  filters: FilterSpec[]
  orders: Array<{ column: string; ascending: boolean }>
  limit: number | null
  single: boolean
  maybeSingle: boolean
  payload: unknown | null
  upsertOptions: { onConflict?: string } | null
}

function freshSpec(table: string, operation = 'select', payload?: unknown): QuerySpec {
  return {
    table, operation,
    columns: null, filters: [], orders: [],
    limit: null, single: false, maybeSingle: false,
    payload: payload ?? null, upsertOptions: null,
  }
}

async function executeApiQuery(spec: QuerySpec): Promise<{ data: unknown; error: unknown }> {
  try {
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(spec),
    })
    const json = await res.json()
    if (!res.ok) return { data: null, error: json.error || 'Request failed' }
    if (spec.single || spec.maybeSingle) {
      return { data: Array.isArray(json.data) ? json.data[0] ?? null : json.data, error: null }
    }
    return { data: json.data, error: null }
  } catch (err) {
    return { data: null, error: err }
  }
}

function createApiQueryBuilder(spec: QuerySpec) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: Record<string, any> = {}

  // Noop chain methods (not used in production SQL but keep interface compatible)
  const noopChain = ['neq', 'gt', 'gte', 'lt', 'lte', 'like', 'contains', 'containedBy', 'textSearch', 'range', 'not', 'filter', 'match']
  for (const m of noopChain) builder[m] = () => builder

  builder.select = (columns?: string) => { spec.columns = columns ?? '*'; return builder }
  builder.insert = (d: unknown) => createApiQueryBuilder(freshSpec(spec.table, 'insert', d))
  builder.update = (d: unknown) => createApiQueryBuilder(freshSpec(spec.table, 'update', d))
  builder.upsert = (d: unknown, opts?: { onConflict?: string }) => {
    const s = freshSpec(spec.table, 'upsert', d)
    s.upsertOptions = opts ?? null
    return createApiQueryBuilder(s)
  }
  builder.delete = () => createApiQueryBuilder(freshSpec(spec.table, 'delete'))

  builder.eq = (col: string, val: unknown) => { spec.filters.push({ type: 'eq', column: col, value: val }); return builder }
  builder.in = (col: string, vals: unknown[]) => { spec.filters.push({ type: 'in', column: col, value: vals }); return builder }
  builder.or = (expr: string) => { spec.filters.push({ type: 'or', expr }); return builder }
  builder.ilike = (col: string, val: string) => { spec.filters.push({ type: 'ilike', column: col, value: val }); return builder }
  builder.is = (col: string, val: unknown) => { spec.filters.push({ type: 'is', column: col, value: val }); return builder }

  builder.order = (col: string, opts?: { ascending?: boolean }) => {
    spec.orders.push({ column: col, ascending: opts?.ascending ?? true })
    return builder
  }
  builder.limit = (n: number) => { spec.limit = n; return builder }
  builder.single = () => { spec.single = true; return builder }
  builder.maybeSingle = () => { spec.maybeSingle = true; return builder }

  builder.then = (
    onFulfilled?: ((v: unknown) => unknown) | null,
    onRejected?: ((reason: unknown) => unknown) | null,
  ) => executeApiQuery(spec).then(onFulfilled, onRejected)

  builder.catch = (onRejected?: ((reason: unknown) => unknown) | null) =>
    executeApiQuery(spec).catch(onRejected)

  return builder
}

// ── Auth clients ────────────────────────────────────────────────────────────

type AuthChangeCallback = (event: string, session: AuthSession | null) => void

function createMockAuth() {
  return {
    async signInWithPassword(_creds: { email: string; password: string }) {
      return { data: { user: null, session: null }, error: null }
    },
    async signOut() {
      return { error: null }
    },
    async getSession() {
      return { data: { session: null }, error: null }
    },
    async getUser() {
      return { data: { user: null }, error: null }
    },
    onAuthStateChange(_callback: AuthChangeCallback) {
      return { data: { subscription: { unsubscribe: () => {} } } }
    },
  }
}

function createApiAuth() {
  const listeners = new Set<AuthChangeCallback>()

  function notify(event: string, session: AuthSession | null) {
    for (const fn of listeners) fn(event, session)
  }

  return {
    async signInWithPassword(creds: { email: string; password: string }) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(creds),
      })
      const json = await res.json()
      if (!res.ok) return { data: { user: null, session: null }, error: { message: json.error } }
      notify('SIGNED_IN', json.session)
      return { data: { user: json.user, session: json.session }, error: null }
    },

    async signOut() {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      notify('SIGNED_OUT', null)
      return { error: null }
    },

    async getSession() {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' })
        if (!res.ok) return { data: { session: null }, error: null }
        const json = await res.json()
        return { data: { session: json.session }, error: null }
      } catch {
        return { data: { session: null }, error: null }
      }
    },

    async getUser() {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' })
        if (!res.ok) return { data: { user: null }, error: null }
        const json = await res.json()
        return { data: { user: json.session?.user ?? null }, error: null }
      } catch {
        return { data: { user: null }, error: null }
      }
    },

    onAuthStateChange(callback: AuthChangeCallback) {
      listeners.add(callback)
      // Check current session on init
      this.getSession().then(({ data }) => {
        callback('INITIAL_SESSION', data.session)
      })
      return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } }
    },
  }
}

// ── Channel stub (Realtime → future SSE/WebSocket) ──────────────────────────

function createChannelStub() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ch: Record<string, any> = {}
  ch.on = () => ch
  ch.subscribe = () => ch
  return ch
}

// ── Client factories ────────────────────────────────────────────────────────

function createMockClient() {
  return {
    from: (table: string) => createMockQueryBuilder(table),
    rpc: () => createMockQueryBuilder('_rpc'),
    auth: createMockAuth(),
    channel: () => createChannelStub(),
    removeChannel: () => {},
  }
}

function createApiClient() {
  return {
    from: (table: string) => createApiQueryBuilder(freshSpec(table)),
    rpc: (fn: string, args?: Record<string, unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const builder: Record<string, any> = {}
      const execute = async () => {
        try {
          const res = await fetch(`/api/rpc/${fn}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(args ?? {}),
          })
          const json = await res.json()
          if (!res.ok) return { data: null, error: json.error }
          return { data: json.data, error: null }
        } catch (err) {
          return { data: null, error: err }
        }
      }
      builder.then = (
        onFulfilled?: ((v: unknown) => unknown) | null,
        onRejected?: ((reason: unknown) => unknown) | null,
      ) => execute().then(onFulfilled, onRejected)
      builder.catch = (onRejected?: ((reason: unknown) => unknown) | null) => execute().catch(onRejected)
      return builder
    },
    auth: createApiAuth(),
    channel: () => createChannelStub(),
    removeChannel: () => {},
  }
}

// ── Export ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = DEV_BYPASS ? createMockClient() : createApiClient()

// In dev mode, reload in-memory mock data when another tab broadcasts changes
if (DEV_BYPASS) {
  onCrossTabChange(() => {
    const fresh = loadMockData()
    for (const key of Object.keys(fresh)) {
      mockData[key] = fresh[key]
    }
  })
}
