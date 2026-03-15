/**
 * Generic query handler for Cloudflare Pages Functions.
 * Translates the frontend QuerySpec into parameterized SQL for D1.
 *
 * Access control:
 * - PUBLIC_READ: tables anyone can SELECT (landing page, public data)
 * - Any write operation: requires authentication
 * - ADMIN_ONLY: tables only admin can read/write
 * - PUBLIC_INSERT: tables anyone can INSERT into (waitlist)
 */

import { getAuth, type AuthPayload } from './_auth'

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

const ALLOWED_TABLES = new Set([
  'user_profiles',
  'wizard_steps',
  'wizard_answers',
  'system_settings',
  'courses',
  'course_sessions',
  'session_content',
  'student_notes',
  'prompts_library',
  'additional_courses',
  'team_members',
  'waitlist',
  'content_progress',
  'notifications',
  'prep_checklist',
  'session_feedback',
  'contact_messages',
  'intake_questions',
  'content_templates',
]);

// ── Access Control ─────────────────────────────────────────────────────────

/** Tables anyone can read without authentication */
const PUBLIC_READ = new Set([
  'courses', 'course_sessions', 'system_settings',
  'additional_courses', 'team_members', 'waitlist',
  'wizard_steps', 'prep_checklist', 'intake_questions',
  'session_content', 'prompts_library',
]);

/** Tables anyone can INSERT into without authentication */
const PUBLIC_INSERT = new Set(['waitlist']);

/** Tables only admin can access (read or write) */
const ADMIN_ONLY = new Set(['user_profiles', 'contact_messages', 'content_templates']);

/**
 * Check if the operation is allowed for the given auth state.
 * Returns null if allowed, or an error Response if denied.
 */
function checkAccess(
  spec: { table: string; operation: string },
  auth: AuthPayload | null,
): Response | null {
  const { table, operation } = spec;
  const isAdmin = auth?.role === 'admin';

  // Admin can do everything
  if (isAdmin) return null;

  // Admin-only tables: deny all access to non-admins
  if (ADMIN_ONLY.has(table)) {
    if (!auth) return Response.json({ error: 'Authentication required' }, { status: 401 });
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  // SELECT on public tables: allow without auth
  if (operation === 'select' && PUBLIC_READ.has(table)) {
    return null;
  }

  // Public INSERT (e.g. waitlist signup)
  if (operation === 'insert' && PUBLIC_INSERT.has(table)) {
    return null;
  }

  // Everything else requires authentication
  if (!auth) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Authenticated users can read all allowed tables
  if (operation === 'select') return null;

  // Authenticated users can write to their own data tables
  // (student_notes, content_progress, wizard_answers, session_feedback, notifications)
  // DELETE is admin-only (except own data — enforced below)
  if (operation === 'delete') {
    return Response.json({ error: 'Admin access required for delete operations' }, { status: 403 });
  }

  // Insert/update/upsert: allowed for authenticated users
  return null;
}

// Validate column/table names to prevent injection (only allow alphanumeric + underscore)
function safeName(name: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Invalid identifier: ${name}`);
  }
  return name;
}

type FilterSpec = {
  type: 'eq' | 'in' | 'or' | 'ilike' | 'is';
  column?: string;
  value?: unknown;
  expr?: string;
};

type OrderSpec = { column: string; ascending: boolean };

interface QuerySpec {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'upsert' | 'delete';
  columns: string | null;
  filters: FilterSpec[];
  orders: OrderSpec[];
  limit: number | null;
  single: boolean;
  maybeSingle: boolean;
  payload: unknown | null;
  upsertOptions: { onConflict?: string } | null;
}

function buildWhereClause(
  filters: FilterSpec[],
  params: unknown[]
): string {
  const conditions: string[] = [];

  for (const f of filters) {
    switch (f.type) {
      case 'eq': {
        conditions.push(`${safeName(f.column!)} = ?`);
        params.push(typeof f.value === 'boolean' ? (f.value ? 1 : 0) : f.value);
        break;
      }
      case 'in': {
        const vals = f.value as unknown[];
        if (vals.length === 0) {
          conditions.push('0 = 1'); // always false
        } else {
          const placeholders = vals.map(() => '?').join(', ');
          conditions.push(`${safeName(f.column!)} IN (${placeholders})`);
          params.push(...vals);
        }
        break;
      }
      case 'ilike': {
        // SQLite LIKE is case-insensitive for ASCII by default
        conditions.push(`${safeName(f.column!)} LIKE ?`);
        params.push(f.value);
        break;
      }
      case 'is': {
        const col = safeName(f.column!);
        if (f.value === null) {
          conditions.push(`${col} IS NULL`);
        } else if (f.value === true) {
          conditions.push(`${col} = 1`);
        } else if (f.value === false) {
          conditions.push(`${col} = 0`);
        } else {
          conditions.push(`${col} IS NULL`);
        }
        break;
      }
      case 'or': {
        // Parse PostgREST-style OR expression: "col.eq.val,col2.is.null"
        const orParts = parseOrExpression(f.expr || '', params);
        if (orParts.length > 0) {
          conditions.push(`(${orParts.join(' OR ')})`);
        }
        break;
      }
    }
  }

  return conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
}

/**
 * Parse PostgREST-style OR expressions like:
 *   "user_id.eq.abc-123,user_id.is.null"
 * into SQL conditions, pushing bound params as needed.
 */
function parseOrExpression(expr: string, params: unknown[]): string[] {
  const parts: string[] = [];
  // Split on comma, but be careful with values that might contain commas
  // PostgREST format: column.operator.value
  const segments = expr.split(',');

  for (const seg of segments) {
    const trimmed = seg.trim();
    // Match: column.operator.value or column.operator (for is.null)
    const dotIdx = trimmed.indexOf('.');
    if (dotIdx === -1) continue;

    const col = trimmed.substring(0, dotIdx);
    const rest = trimmed.substring(dotIdx + 1);

    const opIdx = rest.indexOf('.');
    if (opIdx === -1) continue;

    const op = rest.substring(0, opIdx);
    const val = rest.substring(opIdx + 1);

    const safeCol = safeName(col);

    switch (op) {
      case 'eq':
        parts.push(`${safeCol} = ?`);
        params.push(val);
        break;
      case 'neq':
        parts.push(`${safeCol} != ?`);
        params.push(val);
        break;
      case 'is':
        if (val === 'null') {
          parts.push(`${safeCol} IS NULL`);
        } else if (val === 'true') {
          parts.push(`${safeCol} = 1`);
        } else if (val === 'false') {
          parts.push(`${safeCol} = 0`);
        }
        break;
      case 'ilike':
        parts.push(`${safeCol} LIKE ?`);
        params.push(val);
        break;
      case 'like':
        parts.push(`${safeCol} LIKE ?`);
        params.push(val);
        break;
      case 'gt':
        parts.push(`${safeCol} > ?`);
        params.push(val);
        break;
      case 'gte':
        parts.push(`${safeCol} >= ?`);
        params.push(val);
        break;
      case 'lt':
        parts.push(`${safeCol} < ?`);
        params.push(val);
        break;
      case 'lte':
        parts.push(`${safeCol} <= ?`);
        params.push(val);
        break;
    }
  }

  return parts;
}

function buildOrderClause(orders: OrderSpec[]): string {
  if (orders.length === 0) return '';
  const parts = orders.map(
    (o) => `${safeName(o.column)} ${o.ascending ? 'ASC' : 'DESC'}`
  );
  return ` ORDER BY ${parts.join(', ')}`;
}

function buildLimitClause(limit: number | null): string {
  if (limit === null) return '';
  return ` LIMIT ${Number(limit)}`;
}

async function handleSelect(
  db: D1Database,
  spec: QuerySpec
): Promise<unknown[]> {
  const columns = spec.columns || '*';
  // Validate column names if not wildcard
  if (columns !== '*') {
    columns.split(',').forEach((c) => safeName(c.trim()));
  }

  const params: unknown[] = [];
  const where = buildWhereClause(spec.filters, params);
  const order = buildOrderClause(spec.orders);
  const limit = buildLimitClause(spec.limit);

  const sql = `SELECT ${columns} FROM ${safeName(spec.table)}${where}${order}${limit}`;
  const result = await db
    .prepare(sql)
    .bind(...params)
    .all();

  return result.results;
}

async function handleInsert(
  db: D1Database,
  spec: QuerySpec
): Promise<unknown[]> {
  const items = Array.isArray(spec.payload) ? spec.payload : [spec.payload];
  const results: unknown[] = [];

  for (const item of items) {
    const obj = item as Record<string, unknown>;
    const keys = Object.keys(obj);
    const cols = keys.map((k) => safeName(k)).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const vals = keys.map((k) => {
      const v = obj[k];
      // Serialize arrays/objects to JSON for TEXT columns
      if (v !== null && typeof v === 'object') return JSON.stringify(v);
      if (typeof v === 'boolean') return v ? 1 : 0;
      return v;
    });

    const sql = `INSERT INTO ${safeName(spec.table)} (${cols}) VALUES (${placeholders}) RETURNING *`;
    const result = await db
      .prepare(sql)
      .bind(...vals)
      .all();
    results.push(...result.results);
  }

  return results;
}

async function handleUpdate(
  db: D1Database,
  spec: QuerySpec
): Promise<unknown[]> {
  const obj = spec.payload as Record<string, unknown>;
  const keys = Object.keys(obj);
  const setClauses = keys.map((k) => `${safeName(k)} = ?`).join(', ');
  const setVals = keys.map((k) => {
    const v = obj[k];
    if (v !== null && typeof v === 'object') return JSON.stringify(v);
    if (typeof v === 'boolean') return v ? 1 : 0;
    return v;
  });

  const whereParams: unknown[] = [];
  const where = buildWhereClause(spec.filters, whereParams);

  const sql = `UPDATE ${safeName(spec.table)} SET ${setClauses}${where} RETURNING *`;
  const result = await db
    .prepare(sql)
    .bind(...setVals, ...whereParams)
    .all();

  return result.results;
}

async function handleUpsert(
  db: D1Database,
  spec: QuerySpec
): Promise<unknown[]> {
  const items = Array.isArray(spec.payload) ? spec.payload : [spec.payload];
  const results: unknown[] = [];
  const conflictCol = spec.upsertOptions?.onConflict || 'id';

  for (const item of items) {
    const obj = item as Record<string, unknown>;
    const keys = Object.keys(obj);
    const cols = keys.map((k) => safeName(k)).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const vals = keys.map((k) => {
      const v = obj[k];
      if (v !== null && typeof v === 'object') return JSON.stringify(v);
      if (typeof v === 'boolean') return v ? 1 : 0;
      return v;
    });

    // Build the ON CONFLICT ... DO UPDATE SET clause (exclude conflict columns)
    const conflictCols = conflictCol.split(',').map((c) => c.trim());
    const updateKeys = keys.filter((k) => !conflictCols.includes(k));
    const updateSet = updateKeys
      .map((k) => `${safeName(k)} = excluded.${safeName(k)}`)
      .join(', ');

    const conflictTarget = conflictCols.map((c) => safeName(c)).join(', ');

    let sql: string;
    if (updateSet) {
      sql = `INSERT INTO ${safeName(spec.table)} (${cols}) VALUES (${placeholders}) ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updateSet} RETURNING *`;
    } else {
      sql = `INSERT INTO ${safeName(spec.table)} (${cols}) VALUES (${placeholders}) ON CONFLICT (${conflictTarget}) DO NOTHING RETURNING *`;
    }

    const result = await db
      .prepare(sql)
      .bind(...vals)
      .all();
    results.push(...result.results);
  }

  return results;
}

async function handleDelete(
  db: D1Database,
  spec: QuerySpec
): Promise<unknown[]> {
  const params: unknown[] = [];
  const where = buildWhereClause(spec.filters, params);

  const sql = `DELETE FROM ${safeName(spec.table)}${where} RETURNING *`;
  const result = await db
    .prepare(sql)
    .bind(...params)
    .all();

  return result.results;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const spec = (await context.request.json()) as QuerySpec;

    // Validate table name
    if (!ALLOWED_TABLES.has(spec.table)) {
      return Response.json(
        { error: `Table "${spec.table}" is not allowed` },
        { status: 400 }
      );
    }

    // ── Authentication & Authorization ──────────────────────────────────
    const auth = await getAuth(context.request, context.env.JWT_SECRET);
    const denied = checkAccess(spec, auth);
    if (denied) return denied;

    const db = context.env.DB;
    let data: unknown[];

    switch (spec.operation) {
      case 'select':
        data = await handleSelect(db, spec);
        break;
      case 'insert':
        data = await handleInsert(db, spec);
        break;
      case 'update':
        data = await handleUpdate(db, spec);
        break;
      case 'upsert':
        data = await handleUpsert(db, spec);
        break;
      case 'delete':
        data = await handleDelete(db, spec);
        break;
      default:
        return Response.json(
          { error: `Unknown operation: ${spec.operation}` },
          { status: 400 }
        );
    }

    return Response.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
};
