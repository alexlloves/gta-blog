import type { CommunityRepository } from "./repository";
import type { CommentInput, CommunityData, PostInput } from "@/lib/types";

/** La API respondió que no hay base de datos configurada. */
export class NoDatabaseError extends Error {}

async function call<T>(action: string, args: Record<string, unknown> = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...args }),
    });
  } catch {
    throw new Error("Sin conexión. Revisa tu red e inténtalo de nuevo.");
  }
  const json = (await res.json().catch(() => ({}))) as { result?: T; error?: string };
  if (!res.ok) throw new Error(json.error ?? "Algo ha fallado. Inténtalo de nuevo.");
  return json.result as T;
}

const unsupported = () => Promise.reject(new Error("No disponible en esta versión"));

/** Repositorio conectado a la API (/api/data) y, a través de ella, a Postgres. */
export class ApiRepository implements CommunityRepository {
  readonly serverIdentity = true;

  async load() {
    const res = await fetch("/api/data", { cache: "no-store" });
    if (res.status === 503) throw new NoDatabaseError();
    if (!res.ok) throw new Error("No se pudieron cargar las preguntas");
    return (await res.json()) as CommunityData & { me: string | null };
  }

  register = unsupported;
  login = unsupported;
  updateProfile = unsupported;
  createGuest = unsupported;
  toggleSave = unsupported;
  markNotificationsRead = () => Promise.resolve();

  createPost = (input: PostInput) => call<{ id: string }>("createPost", { input }) as never;
  updatePost = (id: string, input: PostInput) => call<{ id: string }>("updatePost", { id, input }) as never;
  deletePost = (id: string) => call<void>("deletePost", { id });
  registerView = (id: string) => call<void>("registerView", { id });
  toggleLike = (id: string) => call<boolean>("toggleLike", { id });
  createComment = (input: CommentInput) => call<{ id: string }>("createComment", { input }) as never;
  updateComment = (id: string, body: string) => call<{ id: string }>("updateComment", { id, body }) as never;
  deleteComment = (id: string) => call<void>("deleteComment", { id });
  toggleCommentVote = (id: string) => call<boolean>("toggleCommentVote", { id });
  setSolution = (postId: string, commentId: string | null) => call<void>("setSolution", { postId, commentId });

  /** Refresca al volver a la pestaña y cada 30 s para ver lo que publican los demás. */
  onExternalChange(callback: () => void) {
    const onVisible = () => document.visibilityState === "visible" && callback();
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(() => document.visibilityState === "visible" && callback(), 30_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }
}
