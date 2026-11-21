import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import type postgres from "postgres";
import { cleanAuthorName, isCategorySlug } from "@/lib/community";
import { cleanPostInput } from "@/lib/data/local-repository";
import type { Comment, CommunityData, Post, PostInput, User } from "@/lib/types";

type Sql = postgres.Sql;

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const id = (prefix: string) => prefix + randomUUID().replace(/-/g, "").slice(0, 12);
export const hashSecret = (secret: string) => createHash("sha256").update(secret).digest("hex");
export const newSecret = () => randomBytes(32).toString("hex");
const iso = (d: Date | string | null) => (d ? new Date(d).toISOString() : undefined);

/* ---------- Identidad anónima ---------- */

export async function findUserId(sql: Sql, secret: string | undefined): Promise<string | null> {
  if (!secret || !/^[a-f0-9]{64}$/.test(secret)) return null;
  const rows = await sql`SELECT id FROM users WHERE secret_hash = ${hashSecret(secret)}`;
  return rows[0]?.id ?? null;
}

export async function createGuest(sql: Sql, secret: string): Promise<string> {
  const userId = id("g_");
  await sql`INSERT INTO users (id, secret_hash, username, display_name, avatar_hue)
    VALUES (${userId}, ${hashSecret(secret)}, ${"Anonimo_" + userId.slice(2, 6)}, 'Anónimo', ${Math.floor(Math.random() * 8)})`;
  return userId;
}

/* ---------- Lectura ---------- */

export async function loadSnapshot(sql: Sql): Promise<CommunityData> {
  const [users, posts, comments, likes, commentVotes] = await Promise.all([
    sql`SELECT id, username, display_name, avatar_hue, created_at, secret_hash IS NOT NULL AS guest FROM users`,
    sql`SELECT * FROM posts`,
    sql`SELECT * FROM comments`,
    sql`SELECT post_id, user_id FROM post_votes`,
    sql`SELECT comment_id, user_id FROM comment_votes`,
  ]);
  return {
    users: users.map(
      (u): User => ({
        id: u.id,
        username: u.username,
        displayName: u.display_name,
        bio: "",
        avatarHue: u.avatar_hue,
        role: "miembro",
        joinedAt: iso(u.created_at)!,
        bonusPoints: 0,
        guest: u.guest,
      }),
    ),
    posts: posts.map(
      (p): Post => ({
        id: p.id,
        type: "pregunta",
        category: p.category,
        title: p.title,
        body: p.body,
        tags: [],
        authorId: p.author_id,
        createdAt: iso(p.created_at)!,
        updatedAt: iso(p.updated_at),
        likeCount: p.like_count,
        viewCount: p.view_count,
        solutionId: p.solution_id ?? undefined,
      }),
    ),
    comments: comments.map(
      (c): Comment => ({
        id: c.id,
        postId: c.post_id,
        parentId: c.parent_id,
        authorId: c.author_id,
        body: c.body,
        createdAt: iso(c.created_at)!,
        updatedAt: iso(c.updated_at),
        score: c.score,
      }),
    ),
    likes: likes.map((l) => ({ postId: l.post_id, userId: l.user_id })),
    commentVotes: commentVotes.map((v) => ({ commentId: v.comment_id, userId: v.user_id })),
    saves: [],
    notifications: [],
  };
}

/* ---------- Escritura ---------- */

function validQuestion(raw: unknown) {
  const input = (raw ?? {}) as Partial<PostInput>;
  if (typeof input.title !== "string" || typeof (input.body ?? "") !== "string") throw new HttpError(400, "Datos no válidos");
  if (!isCategorySlug(input.category)) throw new HttpError(400, "Tema no válido");
  try {
    const clean = cleanPostInput({ type: "pregunta", category: input.category, title: input.title, body: input.body ?? "", tags: [] });
    if (clean.title.length < 10) throw new Error("La pregunta debe tener al menos 10 caracteres");
    return clean;
  } catch (err) {
    throw new HttpError(400, (err as Error).message);
  }
}

function validBody(raw: unknown) {
  const body = typeof raw === "string" ? raw.trim() : "";
  if (body.length < 2) throw new HttpError(400, "El texto es demasiado corto");
  if (body.length > 5000) throw new HttpError(400, "El texto es demasiado largo (máx. 5000 caracteres)");
  return body;
}

const str = (v: unknown) => {
  if (typeof v !== "string" || !v || v.length > 64) throw new HttpError(400, "Identificador no válido");
  return v;
};

async function ownedPost(sql: Sql, postId: string, userId: string) {
  const [p] = await sql`SELECT author_id FROM posts WHERE id = ${postId}`;
  if (!p) throw new HttpError(404, "La pregunta no existe o ha sido eliminada");
  if (p.author_id !== userId) throw new HttpError(403, "Solo el autor puede hacer esto");
}

async function ownedComment(sql: Sql, commentId: string, userId: string) {
  const [c] = await sql`SELECT author_id FROM comments WHERE id = ${commentId}`;
  if (!c) throw new HttpError(404, "La respuesta no existe");
  if (c.author_id !== userId) throw new HttpError(403, "Solo puedes modificar tus propias respuestas");
}

/** Guarda el nombre visible elegido al publicar (si lo hay). */
async function applyName(sql: Sql, userId: string, raw: unknown) {
  const name = cleanAuthorName(raw);
  if (name) await sql`UPDATE users SET display_name = ${name} WHERE id = ${userId}`;
}

/** Acciones que no necesitan identidad. */
export const PUBLIC_ACTIONS = new Set(["registerView"]);

/** Ejecuta una acción del cliente. `userId` es quien la hace (resuelto por cookie). */
export async function runAction(sql: Sql, action: string, args: Record<string, unknown>, userId: string): Promise<unknown> {
  switch (action) {
    case "registerView": {
      await sql`UPDATE posts SET view_count = view_count + 1 WHERE id = ${str(args.id)}`;
      return null;
    }
    case "createPost": {
      const q = validQuestion(args.input);
      await applyName(sql, userId, (args.input as { authorName?: unknown } | undefined)?.authorName);
      const postId = id("p_");
      await sql`INSERT INTO posts (id, author_id, category, title, body) VALUES (${postId}, ${userId}, ${q.category}, ${q.title}, ${q.body})`;
      return { id: postId };
    }
    case "updatePost": {
      const postId = str(args.id);
      const q = validQuestion(args.input);
      await ownedPost(sql, postId, userId);
      await sql`UPDATE posts SET title = ${q.title}, body = ${q.body}, category = ${q.category}, updated_at = now() WHERE id = ${postId}`;
      return { id: postId };
    }
    case "deletePost": {
      const postId = str(args.id);
      await ownedPost(sql, postId, userId);
      await sql`DELETE FROM posts WHERE id = ${postId}`;
      return null;
    }
    case "toggleLike": {
      const postId = str(args.id);
      return sql.begin(async (tx) => {
        const [p] = await tx`SELECT id FROM posts WHERE id = ${postId} FOR UPDATE`;
        if (!p) throw new HttpError(404, "La pregunta no existe o ha sido eliminada");
        const removed = await tx`DELETE FROM post_votes WHERE post_id = ${postId} AND user_id = ${userId} RETURNING post_id`;
        if (removed.length) {
          await tx`UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = ${postId}`;
          return false;
        }
        await tx`INSERT INTO post_votes (post_id, user_id) VALUES (${postId}, ${userId})`;
        await tx`UPDATE posts SET like_count = like_count + 1 WHERE id = ${postId}`;
        return true;
      });
    }
    case "createComment": {
      const input = (args.input ?? {}) as { postId?: unknown; parentId?: unknown; body?: unknown; authorName?: unknown };
      const postId = str(input.postId);
      const parentId = input.parentId == null ? null : str(input.parentId);
      const body = validBody(input.body);
      const [p] = await sql`SELECT id FROM posts WHERE id = ${postId}`;
      if (!p) throw new HttpError(404, "La pregunta no existe o ha sido eliminada");
      if (parentId) {
        const [parent] = await sql`SELECT post_id FROM comments WHERE id = ${parentId}`;
        if (!parent || parent.post_id !== postId) throw new HttpError(404, "La respuesta a la que contestas ya no existe");
      }
      await applyName(sql, userId, input.authorName);
      const commentId = id("c_");
      await sql`INSERT INTO comments (id, post_id, parent_id, author_id, body) VALUES (${commentId}, ${postId}, ${parentId}, ${userId}, ${body})`;
      return { id: commentId };
    }
    case "updateComment": {
      const commentId = str(args.id);
      const body = validBody(args.body);
      await ownedComment(sql, commentId, userId);
      await sql`UPDATE comments SET body = ${body}, updated_at = now() WHERE id = ${commentId}`;
      return { id: commentId };
    }
    case "deleteComment": {
      const commentId = str(args.id);
      await ownedComment(sql, commentId, userId);
      // Las réplicas se borran en cascada; si era la solución, se desmarca.
      await sql.begin(async (tx) => {
        await tx`UPDATE posts SET solution_id = NULL WHERE solution_id = ${commentId}`;
        await tx`DELETE FROM comments WHERE id = ${commentId}`;
      });
      return null;
    }
    case "toggleCommentVote": {
      const commentId = str(args.id);
      return sql.begin(async (tx) => {
        const [c] = await tx`SELECT author_id FROM comments WHERE id = ${commentId} FOR UPDATE`;
        if (!c) throw new HttpError(404, "La respuesta no existe");
        if (c.author_id === userId) throw new HttpError(400, "No puedes votar tus propias respuestas");
        const removed = await tx`DELETE FROM comment_votes WHERE comment_id = ${commentId} AND user_id = ${userId} RETURNING comment_id`;
        if (removed.length) {
          await tx`UPDATE comments SET score = GREATEST(0, score - 1) WHERE id = ${commentId}`;
          return false;
        }
        await tx`INSERT INTO comment_votes (comment_id, user_id) VALUES (${commentId}, ${userId})`;
        await tx`UPDATE comments SET score = score + 1 WHERE id = ${commentId}`;
        return true;
      });
    }
    case "setSolution": {
      const postId = str(args.postId);
      const commentId = args.commentId == null ? null : str(args.commentId);
      await ownedPost(sql, postId, userId);
      if (commentId) {
        const [c] = await sql`SELECT post_id, parent_id FROM comments WHERE id = ${commentId}`;
        if (!c || c.post_id !== postId || c.parent_id) throw new HttpError(400, "Solo una respuesta directa puede ser la solución");
      }
      await sql`UPDATE posts SET solution_id = ${commentId} WHERE id = ${postId}`;
      return null;
    }
    default:
      throw new HttpError(400, "Acción no válida");
  }
}
