/**
 * RPC handler for Cloudflare Pages Functions.
 * Supports named remote procedure calls via /api/rpc/:fn
 * All RPC functions require admin authentication.
 */

import { requireAdmin } from '../_auth'

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // All RPC functions require admin
  const auth = await requireAdmin(context.request, context.env.JWT_SECRET);
  if (auth instanceof Response) return auth;

  const fn = context.params.fn as string;
  const db = context.env.DB;

  try {
    switch (fn) {
      case 'get_current_price': {
        // Hardcoded price for MVP (in agorot / cents — 2990 = 29.90 ILS)
        return Response.json({ data: 2990 });
      }

      case 'auto_open_scheduled_sessions': {
        const result = await db
          .prepare(
            `UPDATE course_sessions SET status = 'open' WHERE scheduled_at <= datetime('now') AND status = 'locked'`
          )
          .run();
        return Response.json({
          data: null,
          meta: { changes: result.meta.changes },
        });
      }

      default:
        return Response.json(
          { error: `Unknown RPC function: ${fn}` },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
};
