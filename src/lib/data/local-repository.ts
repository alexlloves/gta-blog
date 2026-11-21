import type { CommunityRepository } from "./repository";
import { cleanAuthorName } from "@/lib/community";
import { createSeedData, SEED_PASSWORDS } from "./seed";
import type {
  Comment,
  CommentInput,
  CommunityData,
  Notification,
  Post,
  PostInput,
  ProfileInput,
  RegisterInput,
  User,
} from "@/lib/types";

const DATA_KEY = "gtavi:data:v3";
const CREDENTIALS_KEY = "gtavi:credentials:v2";

interface Credential {
  userId: string;
  email: string;
  hash: string;
}

export function createId(prefix = ""): string {
  const raw =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefix + raw.slice(0, 12);
}

/**
 * Hash local SOLO para la demo. Con un backend real, las contraseñas nunca
 * deben llegar ni guardarse en el cliente: se delega en el proveedor de auth.
 */
async function hashPassword(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`gtavi-demo:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Almacenamiento lleno o bloqueado (modo privado): los cambios se quedan en memoria.
  }
}

function isValidData(d: unknown): d is CommunityData {
  const x = d as CommunityData | null;
  return !!x && Array.isArray(x.users) && Array.isArray(x.posts) && Array.isArray(x.comments);
}

class PermissionError extends Error {}

/** Implementación sin backend: todo vive en el localStorage del navegador. */
export class LocalStorageRepository implements CommunityRepository {
  private data: CommunityData | null = null;
  private credentials: Credential[] | null = null;

  private get db(): CommunityData {
    if (!this.data) {
      const stored = readJSON<CommunityData>(DATA_KEY);
      this.data = isValidData(stored) ? stored : createSeedData();
    }
    return this.data;
  }

  private commit(patch: Partial<CommunityData>) {
    this.data = { ...this.db, ...patch };
    writeJSON(DATA_KEY, this.data);
  }

  private async creds(): Promise<Credential[]> {
    if (this.credentials) return this.credentials;
    const stored = readJSON<Credential[]>(CREDENTIALS_KEY);
    if (stored) {
      this.credentials = stored;
    } else {
      // Cuentas de demostración de los usuarios de ejemplo.
      this.credentials = await Promise.all(
        SEED_PASSWORDS.map(async ([userId, email, pw]) => ({ userId, email, hash: await hashPassword(pw) })),
      );
      writeJSON(CREDENTIALS_KEY, this.credentials);
    }
    return this.credentials;
  }

  private post(id: string) {
    const p = this.db.posts.find((x) => x.id === id);
    if (!p) throw new Error("La publicación no existe o ha sido eliminada");
    return p;
  }

  private notify(n: Omit<Notification, "id" | "createdAt" | "read">, extra: Notification[] = []) {
    if (n.actorId && n.actorId === n.userId) return extra; // no notificarse a uno mismo
    return [{ ...n, id: createId("n_"), createdAt: new Date().toISOString(), read: false }, ...extra];
  }

  async load() {
    this.data = null;
    const db = this.db;
    writeJSON(DATA_KEY, db);
    await this.creds();
    return db;
  }

  /* ---------- Auth ---------- */

  async createGuest() {
    const user: User = {
      id: createId("g_"),
      username: `Anonimo_${Math.random().toString(36).slice(2, 6)}`,
      displayName: "Anónimo",
      bio: "",
      avatarHue: Math.floor(Math.random() * 8),
      role: "miembro",
      joinedAt: new Date().toISOString(),
      bonusPoints: 0,
      guest: true,
    };
    this.commit({ users: [...this.db.users, user] });
    return user;
  }

  async register({ username, email, password }: RegisterInput) {
    const creds = await this.creds();
    const uname = username.trim();
    const mail = email.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(uname)) {
      throw new Error("El usuario debe tener 3-20 caracteres: letras, números o _");
    }
    if (this.db.users.some((u) => u.username.toLowerCase() === uname.toLowerCase())) {
      throw new Error("Ese nombre de usuario ya está cogido");
    }
    if (creds.some((c) => c.email === mail)) throw new Error("Ya existe una cuenta con ese email");
    if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");

    const user: User = {
      id: createId("u_"),
      username: uname,
      displayName: uname,
      bio: "",
      avatarHue: Math.floor(Math.random() * 8),
      role: "miembro",
      joinedAt: new Date().toISOString(),
      bonusPoints: 0,
    };
    this.credentials = [...creds, { userId: user.id, email: mail, hash: await hashPassword(password) }];
    writeJSON(CREDENTIALS_KEY, this.credentials);
    this.commit({
      users: [...this.db.users, user],
      notifications: this.notify(
        {
          userId: user.id,
          type: "welcome",
          text: "¡Bienvenido a GTA VI Community! Completa tu perfil y crea tu primera publicación para ganar tus primeros puntos.",
        },
        this.db.notifications,
      ),
    });
    return user;
  }

  async login(identifier: string, password: string) {
    const creds = await this.creds();
    const id = identifier.trim().toLowerCase();
    const user = this.db.users.find((u) => u.username.toLowerCase() === id);
    const cred = creds.find((c) => c.email === id || c.userId === user?.id);
    if (!cred || cred.hash !== (await hashPassword(password))) {
      throw new Error("Usuario o contraseña incorrectos");
    }
    const found = this.db.users.find((u) => u.id === cred.userId);
    if (!found) throw new Error("La cuenta ya no existe");
    return found;
  }

  async updateProfile(userId: string, input: ProfileInput) {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) throw new Error("Usuario no encontrado");
    const next: User = {
      ...user,
      displayName: input.displayName.trim().slice(0, 40) || user.username,
      bio: input.bio.trim().slice(0, 280),
      location: input.location?.trim().slice(0, 40) || undefined,
      avatarHue: input.avatarHue,
    };
    this.commit({ users: this.db.users.map((u) => (u.id === userId ? next : u)) });
    return next;
  }

  /* ---------- Publicaciones ---------- */

  /** Guarda el nombre visible elegido al publicar (si lo hay). */
  private applyName(userId: string, raw: unknown) {
    const name = cleanAuthorName(raw);
    if (!name) return;
    this.commit({ users: this.db.users.map((u) => (u.id === userId ? { ...u, displayName: name } : u)) });
  }

  async createPost(input: PostInput, userId: string) {
    this.applyName(userId, input.authorName);
    const post: Post = {
      id: createId("p_"),
      ...cleanPostInput(input),
      authorId: userId,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      viewCount: 0,
    };
    this.commit({ posts: [post, ...this.db.posts] });
    return post;
  }

  async updatePost(postId: string, input: PostInput, userId: string) {
    const post = this.post(postId);
    if (post.authorId !== userId) throw new PermissionError("Solo puedes editar tus propias publicaciones");
    const next: Post = { ...post, ...cleanPostInput(input), updatedAt: new Date().toISOString() };
    if (next.type !== "pregunta") delete next.solutionId;
    this.commit({ posts: this.db.posts.map((p) => (p.id === postId ? next : p)) });
    return next;
  }

  async deletePost(postId: string, userId: string) {
    const post = this.post(postId);
    if (post.authorId !== userId) throw new PermissionError("Solo puedes eliminar tus propias publicaciones");
    const commentIds = new Set(this.db.comments.filter((c) => c.postId === postId).map((c) => c.id));
    this.commit({
      posts: this.db.posts.filter((p) => p.id !== postId),
      comments: this.db.comments.filter((c) => c.postId !== postId),
      likes: this.db.likes.filter((l) => l.postId !== postId),
      saves: this.db.saves.filter((s) => s.postId !== postId),
      commentVotes: this.db.commentVotes.filter((v) => !commentIds.has(v.commentId)),
      notifications: this.db.notifications.filter((n) => n.postId !== postId),
    });
  }

  async registerView(postId: string) {
    this.commit({
      posts: this.db.posts.map((p) => (p.id === postId ? { ...p, viewCount: p.viewCount + 1 } : p)),
    });
  }

  async toggleLike(postId: string, userId: string) {
    const post = this.post(postId);
    const existing = this.db.likes.find((l) => l.postId === postId && l.userId === userId);
    const liked = !existing;
    this.commit({
      likes: liked ? [...this.db.likes, { postId, userId }] : this.db.likes.filter((l) => l !== existing),
      posts: this.db.posts.map((p) =>
        p.id === postId ? { ...p, likeCount: Math.max(0, p.likeCount + (liked ? 1 : -1)) } : p,
      ),
      notifications: liked
        ? this.notify({ userId: post.authorId, type: "like", actorId: userId, postId }, this.db.notifications)
        : this.db.notifications,
    });
    return liked;
  }

  async toggleSave(postId: string, userId: string) {
    this.post(postId);
    const existing = this.db.saves.find((s) => s.postId === postId && s.userId === userId);
    this.commit({
      saves: existing
        ? this.db.saves.filter((s) => s !== existing)
        : [{ postId, userId, savedAt: new Date().toISOString() }, ...this.db.saves],
    });
    return !existing;
  }

  /* ---------- Comentarios ---------- */

  async createComment({ postId, parentId, body, authorName }: CommentInput, userId: string) {
    this.applyName(userId, authorName);
    const post = this.post(postId);
    const text = body.trim();
    if (text.length < 2) throw new Error("El comentario es demasiado corto");
    const parent = parentId ? this.db.comments.find((c) => c.id === parentId) : null;
    if (parentId && !parent) throw new Error("El comentario al que respondes ya no existe");

    const comment: Comment = {
      id: createId("c_"),
      postId,
      parentId,
      authorId: userId,
      body: text.slice(0, 5000),
      createdAt: new Date().toISOString(),
      score: 0,
    };
    let notifications = this.notify(
      { userId: post.authorId, type: "comment", actorId: userId, postId, commentId: comment.id },
      this.db.notifications,
    );
    if (parent && parent.authorId !== post.authorId) {
      notifications = this.notify(
        { userId: parent.authorId, type: "reply", actorId: userId, postId, commentId: comment.id },
        notifications,
      );
    }
    this.commit({ comments: [...this.db.comments, comment], notifications });
    return comment;
  }

  async updateComment(commentId: string, body: string, userId: string) {
    const c = this.db.comments.find((x) => x.id === commentId);
    if (!c) throw new Error("El comentario no existe");
    if (c.authorId !== userId) throw new PermissionError("Solo puedes editar tus comentarios");
    const next = { ...c, body: body.trim().slice(0, 5000), updatedAt: new Date().toISOString() };
    this.commit({ comments: this.db.comments.map((x) => (x.id === commentId ? next : x)) });
    return next;
  }

  async deleteComment(commentId: string, userId: string) {
    const c = this.db.comments.find((x) => x.id === commentId);
    if (!c) return;
    if (c.authorId !== userId) throw new PermissionError("Solo puedes eliminar tus comentarios");
    // Elimina también todo el hilo que cuelga de él.
    const doomed = new Set([commentId]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const x of this.db.comments) {
        if (x.parentId && doomed.has(x.parentId) && !doomed.has(x.id)) {
          doomed.add(x.id);
          grew = true;
        }
      }
    }
    this.commit({
      comments: this.db.comments.filter((x) => !doomed.has(x.id)),
      commentVotes: this.db.commentVotes.filter((v) => !doomed.has(v.commentId)),
      posts: this.db.posts.map((p) => (p.solutionId && doomed.has(p.solutionId) ? { ...p, solutionId: undefined } : p)),
    });
  }

  async toggleCommentVote(commentId: string, userId: string) {
    const c = this.db.comments.find((x) => x.id === commentId);
    if (!c) throw new Error("El comentario no existe");
    if (c.authorId === userId) throw new Error("No puedes votar tus propias respuestas");
    const existing = this.db.commentVotes.find((v) => v.commentId === commentId && v.userId === userId);
    const voted = !existing;
    this.commit({
      commentVotes: voted
        ? [...this.db.commentVotes, { commentId, userId }]
        : this.db.commentVotes.filter((v) => v !== existing),
      comments: this.db.comments.map((x) =>
        x.id === commentId ? { ...x, score: Math.max(0, x.score + (voted ? 1 : -1)) } : x,
      ),
      notifications: voted
        ? this.notify({ userId: c.authorId, type: "vote", actorId: userId, postId: c.postId, commentId }, this.db.notifications)
        : this.db.notifications,
    });
    return voted;
  }

  async setSolution(postId: string, commentId: string | null, userId: string) {
    const post = this.post(postId);
    if (post.authorId !== userId) throw new PermissionError("Solo el autor de la pregunta puede elegir la solución");
    if (post.type !== "pregunta") throw new Error("Solo las preguntas tienen solución");
    const comment = commentId ? this.db.comments.find((c) => c.id === commentId && c.postId === postId) : null;
    if (commentId && (!comment || comment.parentId)) throw new Error("Solo una respuesta directa puede ser la solución");
    this.commit({
      posts: this.db.posts.map((p) => (p.id === postId ? { ...p, solutionId: commentId ?? undefined } : p)),
      notifications: comment
        ? this.notify({ userId: comment.authorId, type: "solution", actorId: userId, postId, commentId: comment.id }, this.db.notifications)
        : this.db.notifications,
    });
  }

  async markNotificationsRead(userId: string, ids?: string[]) {
    const only = ids ? new Set(ids) : null;
    this.commit({
      notifications: this.db.notifications.map((n) =>
        n.userId === userId && (!only || only.has(n.id)) ? { ...n, read: true } : n,
      ),
    });
  }

  onExternalChange(callback: () => void) {
    const handler = (e: StorageEvent) => {
      if (e.key === DATA_KEY) {
        this.data = null;
        callback();
      }
      if (e.key === CREDENTIALS_KEY) this.credentials = null;
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }
}

export function cleanPostInput(input: PostInput): PostInput {
  const title = input.title.trim().replace(/\s+/g, " ");
  const body = input.body.trim();
  if (title.length < 8) throw new Error("El título debe tener al menos 8 caracteres");
  if (title.length > 140) throw new Error("El título no puede superar 140 caracteres");
  // En las preguntas la descripción es opcional.
  if (input.type !== "pregunta" && body.length < 10 && !input.image) {
    throw new Error("Añade algo más de contenido (mín. 10 caracteres)");
  }
  const tags = Array.from(
    new Set(input.tags.map((t) => t.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-")).filter(Boolean)),
  ).slice(0, 5);
  return { type: input.type, category: input.category, title, body: body.slice(0, 20000), image: input.image, tags };
}
