import { neon, Pool, type PoolClient } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Next.js caches every server-side fetch() by default, and the Neon HTTP driver is a fetch() — so identical
// queries were answered from a saved copy (for up to a year), serving stale stock, projects and so on.
export const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: "no-store" } });

/** A refusal inside a transaction that should reach the client as `{ error }` with this status. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Runs `fn` inside BEGIN/COMMIT on a dedicated connection (the HTTP `sql` client can't hold row locks).
 * Anything thrown rolls the whole thing back. A pool per call because serverless functions can't keep
 * a WebSocket connection open between requests.
 */
export async function withTransaction<T>(fn: (db: PoolClient) => Promise<T>): Promise<T> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const result = await fn(db);
    await db.query("COMMIT");
    return result;
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  } finally {
    db.release();
    await pool.end();
  }
}
