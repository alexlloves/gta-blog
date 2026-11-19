"use client";

import { useSyncExternalStore } from "react";
import { repository } from "@/lib/data";
import { POINTS } from "@/lib/community";
import { readSession, SESSION_KEY, writeSession } from "@/lib/session";
import type {
  CommentInput,
  CommunityData,
  Post,
  PostInput,
  ProfileInput,
  RegisterInput,
  SortMode,
  User,
} from "@/lib/types";

/**
 * Store cliente: caché en memoria sobre el repositorio + sesión + suscripción
 * para React. Los componentes leen con los hooks y escriben con `actions`.
 */

export interface StoreState {
  data: CommunityData;
  userId: string | null;
}

let state: StoreState | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

async function refresh() {
  const { me, ...data } = await repository.load();
  // Con base de datos, la identidad la decide el servidor (cookie).
  let userId = repository.serverIdentity ? (me ?? null) : (state?.userId ?? readSession());
  if (userId && !repository.serverIdentity && !data.users.some((u) => u.id === userId)) {
    userId = null;
    writeSession(null);
  }
  state = { data, userId };
  emit();
}

function ensureLoaded() {
  if (!loading) {
    loading = refresh().catch((err) => {
      // Error de red o del servidor: se reintenta en unos segundos.
      console.error("[GTA VI Community] No se pudieron cargar los datos", err);
      loading = null;
      setTimeout(() => listeners.size > 0 && void ensureLoaded(), 3000);
    });
  }
  return loading;
}

let unsubscribeExternal: (() => void) | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  void ensureLoaded();
  if (!unsubscribeExternal && repository.onExternalChange) {
    unsubscribeExternal = repository.onExternalChange(() => void refresh());
  }
  const onSession = (e: StorageEvent) => {
    if (e.key === SESSION_KEY && state) {
      state = { ...state, userId: e.newValue };
      emit();
    }
  };
  window.addEventListener("storage", onSession);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onSession);
    if (listeners.size === 0) {
      unsubscribeExternal?.();
      unsubscribeExternal = undefined;
    }
  };
}

/** `null` mientras cargan los datos (y siempre durante el render en servidor). */
export function useStore(): StoreState | null {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => null,
  );
}

export function useData(): CommunityData | null {
  return useStore()?.data ?? null;
}

/** Id de quien actúa en este navegador (sesión o identidad anónima); `null` si aún no ha participado. */
export function useActorId(): string | null {
  const s = useStore();
  if (!s) return null;
  return s.userId ?? (repository.serverIdentity ? null : readGuestId());
}

/** `undefined` = cargando; `null` = sin sesión. */
export function useCurrentUser(): User | null | undefined {
  const s = useStore();
  if (!s) return undefined;
  return s.data.users.find((u) => u.id === s.userId) ?? null;
}

/* ---------- Datos derivados (memoizados por instantánea) ---------- */

export interface UserStats {
  posts: number;
  answers: number;
  comments: number;
  likesReceived: number;
  votesReceived: number;
  solutions: number;
  points: number;
  weeklyPoints: number;
}

export interface Derived {
  usersById: Map<string, User>;
  postsById: Map<string, Post>;
  commentCounts: Map<string, number>;
  /** Solo respuestas directas (sin contar réplicas). */
  answerCounts: Map<string, number>;
  stats: Map<string, UserStats>;
  /** Usuarios que han publicado o comentado en los últimos 7 días. */
  activeUsers: number;
}

const derivedCache = new WeakMap<CommunityData, Derived>();
const WEEK = 7 * 86_400_000;

export function derive(data: CommunityData): Derived {
  const cached = derivedCache.get(data);
  if (cached) return cached;

  const now = Date.now();
  const usersById = new Map(data.users.map((u) => [u.id, u]));
  const postsById = new Map(data.posts.map((p) => [p.id, p]));
  const commentCounts = new Map<string, number>();
  const answerCounts = new Map<string, number>();
  const stats = new Map<string, UserStats>();
  const s = (id: string) => {
    let x = stats.get(id);
    if (!x) {
      x = { posts: 0, answers: 0, comments: 0, likesReceived: 0, votesReceived: 0, solutions: 0, points: 0, weeklyPoints: 0 };
      stats.set(id, x);
    }
    return x;
  };
  const recent = (iso: string) => now - Date.parse(iso) < WEEK;

  for (const u of data.users) s(u.id).points = u.bonusPoints;

  const solutionIds = new Set<string>();
  for (const p of data.posts) {
    const st = s(p.authorId);
    st.posts++;
    st.likesReceived += p.likeCount;
    const earned = POINTS.post + p.likeCount * POINTS.likeReceived;
    st.points += earned;
    if (recent(p.createdAt)) st.weeklyPoints += earned;
    if (p.solutionId) solutionIds.add(p.solutionId);
  }

  for (const c of data.comments) {
    commentCounts.set(c.postId, (commentCounts.get(c.postId) ?? 0) + 1);
    if (!c.parentId) answerCounts.set(c.postId, (answerCounts.get(c.postId) ?? 0) + 1);
    const post = postsById.get(c.postId);
    const st = s(c.authorId);
    const isAnswer = !c.parentId && post?.type === "pregunta";
    if (isAnswer) st.answers++;
    else st.comments++;
    st.votesReceived += c.score;
    let earned = (isAnswer ? POINTS.answer : POINTS.comment) + c.score * POINTS.voteReceived;
    if (solutionIds.has(c.id)) {
      st.solutions++;
      earned += POINTS.solution;
    }
    st.points += earned;
    if (recent(c.createdAt)) st.weeklyPoints += earned;
  }

  const active = new Set<string>();
  for (const p of data.posts) if (recent(p.createdAt)) active.add(p.authorId);
  for (const c of data.comments) if (recent(c.createdAt)) active.add(c.authorId);

  const result = { usersById, postsById, commentCounts, answerCounts, stats, activeUsers: active.size };
  derivedCache.set(data, result);
  return result;
}

export function useDerived(): Derived | null {
  const data = useData();
  return data ? derive(data) : null;
}

export const EMPTY_STATS: UserStats = {
  posts: 0, answers: 0, comments: 0, likesReceived: 0, votesReceived: 0, solutions: 0, points: 0, weeklyPoints: 0,
};

/* ---------- Ordenación ---------- */

export function trendingScore(p: Post, comments: number, now = Date.now()) {
  const hours = Math.max(0, (now - Date.parse(p.createdAt)) / 3_600_000);
  return (p.likeCount + comments * 3 + p.viewCount / 50) / Math.pow(hours + 2, 1.4);
}

export function sortPosts(posts: Post[], mode: SortMode, counts: Map<string, number>): Post[] {
  const now = Date.now();
  const byDate = (a: Post, b: Post) => b.createdAt.localeCompare(a.createdAt);
  const cmp: Record<SortMode, (a: Post, b: Post) => number> = {
    recientes: byDate,
    populares: (a, b) => b.likeCount - a.likeCount || byDate(a, b),
    comentadas: (a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || byDate(a, b),
    tendencias: (a, b) =>
      trendingScore(b, counts.get(b.id) ?? 0, now) - trendingScore(a, counts.get(a.id) ?? 0, now),
  };
  return [...posts].sort(cmp[mode]);
}

/* ---------- Acciones ---------- */

export class AuthRequiredError extends Error {
  constructor() {
    super("Necesitas iniciar sesión");
  }
}

function requireUserId(): string {
  const id = state?.userId;
  if (!id) throw new AuthRequiredError();
  return id;
}

const GUEST_KEY = "gtavi:guest:v1";

/** Usuario con sesión o, si se permite, la identidad anónima de este navegador. */
async function actorId(allowGuest: boolean): Promise<string> {
  if (state?.userId || !allowGuest) return requireUserId();
  let id: string | null = null;
  try {
    id = localStorage.getItem(GUEST_KEY);
  } catch {}
  if (!id || !state?.data.users.some((u) => u.id === id)) {
    id = (await repository.createGuest()).id;
    try {
      localStorage.setItem(GUEST_KEY, id);
    } catch {}
  }
  return id;
}

/** Identidad anónima de este navegador (si ya ha preguntado/respondido sin cuenta). */
export function readGuestId(): string | null {
  try {
    return localStorage.getItem(GUEST_KEY);
  } catch {
    return null;
  }
}

async function mutate<T>(fn: (userId: string) => Promise<T>, auth: boolean | "guest" = "guest"): Promise<T> {
  await ensureLoaded();
  const result = await fn(auth === false || repository.serverIdentity ? "" : await actorId(auth === "guest"));
  await refresh();
  return result;
}

function setSession(userId: string | null) {
  writeSession(userId);
  if (state) state = { ...state, userId };
}

export const actions = {
  async register(input: RegisterInput) {
    await ensureLoaded();
    const user = await repository.register(input);
    setSession(user.id);
    await refresh();
    return user;
  },
  async login(identifier: string, password: string) {
    await ensureLoaded();
    const user = await repository.login(identifier, password);
    setSession(user.id);
    emit();
    return user;
  },
  logout() {
    setSession(null);
    emit();
  },
  updateProfile: (input: ProfileInput) => mutate((uid) => repository.updateProfile(uid, input)),
  createPost: (input: PostInput) => mutate((uid) => repository.createPost(input, uid)),
  updatePost: (id: string, input: PostInput) => mutate((uid) => repository.updatePost(id, input, uid)),
  deletePost: (id: string) => mutate((uid) => repository.deletePost(id, uid)),
  registerView: (id: string) => mutate(() => repository.registerView(id), false),
  toggleLike: (id: string) => mutate((uid) => repository.toggleLike(id, uid)),
  toggleSave: (id: string) => mutate((uid) => repository.toggleSave(id, uid)),
  createComment: (input: CommentInput) => mutate((uid) => repository.createComment(input, uid)),
  updateComment: (id: string, body: string) => mutate((uid) => repository.updateComment(id, body, uid)),
  deleteComment: (id: string) => mutate((uid) => repository.deleteComment(id, uid)),
  toggleCommentVote: (id: string) => mutate((uid) => repository.toggleCommentVote(id, uid)),
  setSolution: (postId: string, commentId: string | null) =>
    mutate((uid) => repository.setSolution(postId, commentId, uid)),
  markNotificationsRead: (ids?: string[]) => mutate((uid) => repository.markNotificationsRead(uid, ids)),
};
