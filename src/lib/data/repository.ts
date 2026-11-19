import type {
  Comment,
  CommentInput,
  CommunityData,
  Post,
  PostInput,
  ProfileInput,
  RegisterInput,
  User,
} from "@/lib/types";

/**
 * Contrato de acceso a datos y autenticación.
 *
 * Todo es asíncrono para poder cambiar la implementación local (localStorage)
 * por una API real sin tocar los componentes. Para conectar un backend:
 *   1. Crear p. ej. `ApiRepository implements CommunityRepository` que llame a
 *      tu API / Supabase / Prisma (y a tu proveedor de auth en login/register).
 *   2. Exportarla desde `src/lib/data/index.ts`.
 * Las comprobaciones de permisos (solo el autor edita/borra) están aquí y
 * deben replicarse en el servidor.
 */
export interface CommunityRepository {
  load(): Promise<CommunityData>;

  /* Autenticación */
  register(input: RegisterInput): Promise<User>;
  /** Crea una identidad anónima para preguntar/responder sin cuenta. */
  createGuest(): Promise<User>;
  login(identifier: string, password: string): Promise<User>;
  updateProfile(userId: string, input: ProfileInput): Promise<User>;

  /* Publicaciones */
  createPost(input: PostInput, userId: string): Promise<Post>;
  updatePost(postId: string, input: PostInput, userId: string): Promise<Post>;
  deletePost(postId: string, userId: string): Promise<void>;
  registerView(postId: string): Promise<void>;
  toggleLike(postId: string, userId: string): Promise<boolean>;
  toggleSave(postId: string, userId: string): Promise<boolean>;

  /* Comentarios y respuestas */
  createComment(input: CommentInput, userId: string): Promise<Comment>;
  updateComment(commentId: string, body: string, userId: string): Promise<Comment>;
  deleteComment(commentId: string, userId: string): Promise<void>;
  toggleCommentVote(commentId: string, userId: string): Promise<boolean>;
  setSolution(postId: string, commentId: string | null, userId: string): Promise<void>;

  /* Notificaciones */
  markNotificationsRead(userId: string, ids?: string[]): Promise<void>;

  /** Cambios hechos fuera de esta pestaña (otra pestaña, websockets...). */
  onExternalChange?(callback: () => void): () => void;
}
