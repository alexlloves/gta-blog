import "server-only";
import postgres from "postgres";
import { createSeedData } from "@/lib/data/seed";

/**
 * Conexión a Postgres (Neon en producción). Usa `DATABASE_URL`, que Vercel
 * crea automáticamente al conectar Neon desde su Marketplace.
 * Si no está definida, la API responde 503 y el cliente usa localStorage.
 */

type Sql = postgres.Sql;

const globalForDb = globalThis as unknown as { __gtaviSql?: Sql; __gtaviReady?: Promise<void> };

/**
 * postgres.js envía al servidor como parámetros de sesión los de la URL que no
 * conoce. `channel_binding` (que Neon incluye) es solo de libpq y haría que
 * Postgres rechace la conexión, así que se quita. El cifrado lo sigue
 * garantizando `sslmode=require`.
 */
export function normalizeDatabaseUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.searchParams.delete("channel_binding");
    return url.toString();
  } catch {
    return raw;
  }
}

export function getSql(): Sql | null {
  const raw = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!raw) return null;
  if (!globalForDb.__gtaviSql) {
    globalForDb.__gtaviSql = postgres(normalizeDatabaseUrl(raw), {
      // Compatible con el pooler de Neon (PgBouncer en modo transacción).
      prepare: false,
      max: Number(process.env.PG_POOL_MAX) || 5,
      onnotice: () => {},
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return globalForDb.__gtaviSql;
}

/** Crea las tablas y carga las preguntas de ejemplo la primera vez. Idempotente. */
export function ensureSchema(sql: Sql): Promise<void> {
  if (!globalForDb.__gtaviReady) {
    globalForDb.__gtaviReady = migrate(sql).catch((err) => {
      globalForDb.__gtaviReady = undefined;
      throw err;
    });
  }
  return globalForDb.__gtaviReady;
}

async function migrate(sql: Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY,
      secret_hash text UNIQUE,
      username text NOT NULL,
      display_name text NOT NULL,
      avatar_hue int NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id text PRIMARY KEY,
      author_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category text NOT NULL,
      title text NOT NULL,
      body text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz,
      like_count int NOT NULL DEFAULT 0,
      view_count int NOT NULL DEFAULT 0,
      solution_id text
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id text PRIMARY KEY,
      post_id text NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      parent_id text REFERENCES comments(id) ON DELETE CASCADE,
      author_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz,
      score int NOT NULL DEFAULT 0
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS post_votes (
      post_id text NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (post_id, user_id)
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS comment_votes (
      comment_id text NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (comment_id, user_id)
    )`;
  await sql`CREATE INDEX IF NOT EXISTS comments_post_idx ON comments(post_id)`;
  await sql`CREATE TABLE IF NOT EXISTS meta (key text PRIMARY KEY, value text NOT NULL)`;

  // Datos de ejemplo una sola vez (aunque luego se borren preguntas).
  const claimed = await sql`INSERT INTO meta (key, value) VALUES ('seeded', now()::text) ON CONFLICT DO NOTHING RETURNING key`;
  if (claimed.length === 0) return;

  const seed = createSeedData();
  const questions = seed.posts.filter((p) => p.type === "pregunta");
  const ids = new Set(questions.map((p) => p.id));
  const comments = seed.comments.filter((c) => ids.has(c.postId));
  const authors = new Set([...questions.map((p) => p.authorId), ...comments.map((c) => c.authorId)]);

  await sql.begin(async (tx) => {
    for (const u of seed.users.filter((u) => authors.has(u.id))) {
      await tx`INSERT INTO users (id, username, display_name, avatar_hue, created_at)
        VALUES (${u.id}, ${u.username}, ${u.displayName}, ${u.avatarHue}, ${u.joinedAt}) ON CONFLICT DO NOTHING`;
    }
    for (const p of questions) {
      await tx`INSERT INTO posts (id, author_id, category, title, body, created_at, like_count, view_count)
        VALUES (${p.id}, ${p.authorId}, ${p.category}, ${p.title}, ${p.body}, ${p.createdAt}, ${p.likeCount}, ${p.viewCount})
        ON CONFLICT DO NOTHING`;
    }
    for (const c of comments) {
      await tx`INSERT INTO comments (id, post_id, parent_id, author_id, body, created_at, score)
        VALUES (${c.id}, ${c.postId}, ${c.parentId}, ${c.authorId}, ${c.body}, ${c.createdAt}, ${c.score})
        ON CONFLICT DO NOTHING`;
    }
    for (const p of questions) {
      if (p.solutionId) await tx`UPDATE posts SET solution_id = ${p.solutionId} WHERE id = ${p.id}`;
    }
  });
}
