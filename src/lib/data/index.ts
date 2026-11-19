import { ApiRepository, NoDatabaseError } from "./api-repository";
import { LocalStorageRepository } from "./local-repository";
import type { CommunityRepository } from "./repository";

/**
 * Usa la API (Postgres) y, si el servidor no tiene base de datos configurada
 * (p. ej. en local sin DATABASE_URL), cae a localStorage para poder desarrollar.
 */
class HybridRepository implements CommunityRepository {
  private impl: CommunityRepository = new ApiRepository();

  get serverIdentity() {
    return this.impl.serverIdentity;
  }

  async load() {
    try {
      return await this.impl.load();
    } catch (err) {
      if (!(err instanceof NoDatabaseError)) throw err;
      console.info("[GTA VI Community] Sin base de datos: usando almacenamiento local del navegador.");
      this.impl = new LocalStorageRepository();
      return this.impl.load();
    }
  }

  register: CommunityRepository["register"] = (...a) => this.impl.register(...a);
  login: CommunityRepository["login"] = (...a) => this.impl.login(...a);
  updateProfile: CommunityRepository["updateProfile"] = (...a) => this.impl.updateProfile(...a);
  createGuest: CommunityRepository["createGuest"] = (...a) => this.impl.createGuest(...a);
  createPost: CommunityRepository["createPost"] = (...a) => this.impl.createPost(...a);
  updatePost: CommunityRepository["updatePost"] = (...a) => this.impl.updatePost(...a);
  deletePost: CommunityRepository["deletePost"] = (...a) => this.impl.deletePost(...a);
  registerView: CommunityRepository["registerView"] = (...a) => this.impl.registerView(...a);
  toggleLike: CommunityRepository["toggleLike"] = (...a) => this.impl.toggleLike(...a);
  toggleSave: CommunityRepository["toggleSave"] = (...a) => this.impl.toggleSave(...a);
  createComment: CommunityRepository["createComment"] = (...a) => this.impl.createComment(...a);
  updateComment: CommunityRepository["updateComment"] = (...a) => this.impl.updateComment(...a);
  deleteComment: CommunityRepository["deleteComment"] = (...a) => this.impl.deleteComment(...a);
  toggleCommentVote: CommunityRepository["toggleCommentVote"] = (...a) => this.impl.toggleCommentVote(...a);
  setSolution: CommunityRepository["setSolution"] = (...a) => this.impl.setSolution(...a);
  markNotificationsRead: CommunityRepository["markNotificationsRead"] = (...a) => this.impl.markNotificationsRead(...a);

  onExternalChange(callback: () => void) {
    // Se suscribe tras la primera carga, cuando ya se sabe qué implementación se usa.
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) unsubscribe = this.impl.onExternalChange?.(callback);
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }
}

/** Punto único de inyección del repositorio. */
export const repository: CommunityRepository = new HybridRepository();

export type { CommunityRepository } from "./repository";
