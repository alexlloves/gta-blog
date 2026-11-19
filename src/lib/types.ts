/**
 * Modelo de dominio de la comunidad.
 * Es independiente de la persistencia: el repositorio local y un futuro backend
 * (Postgres, Supabase, Firebase...) deben devolver exactamente estas formas.
 */

export type PostType =
  | "noticia"
  | "pregunta"
  | "debate"
  | "teoria"
  | "gameplay"
  | "imagen"
  | "descubrimiento"
  | "guia"
  | "bug";

export type CategorySlug =
  | "noticias"
  | "jason-y-lucia"
  | "historia"
  | "mapa"
  | "vehiculos"
  | "armas"
  | "online"
  | "teorias"
  | "gameplay"
  | "preguntas"
  | "secretos"
  | "mods"
  | "guias";

export type UserRole = "admin" | "moderador" | "miembro";

export interface User {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  /** Índice de la paleta de avatar generado (si no hay imagen). */
  avatarHue: number;
  avatarUrl?: string;
  location?: string;
  role: UserRole;
  joinedAt: string; // ISO
  /** Puntos heredados (p. ej. migración de otra plataforma o datos de ejemplo). */
  bonusPoints: number;
  /** Identidad anónima (preguntas y respuestas sin cuenta). */
  guest?: boolean;
}

/** Imagen de una publicación: ilustración incluida en la web o URL/subida del usuario. */
export type PostImage = { kind: "cover"; key: CoverKey } | { kind: "url"; src: string; alt?: string };

export type CoverKey = "sunset" | "skyline" | "beach" | "highway" | "swamp" | "keys" | "neon" | "marina";

export interface Post {
  id: string;
  type: PostType;
  category: CategorySlug;
  title: string;
  body: string;
  image?: PostImage;
  tags: string[];
  authorId: string;
  createdAt: string;
  updatedAt?: string;
  likeCount: number;
  viewCount: number;
  /** Solo preguntas: comentario raíz marcado como solución por el autor. */
  solutionId?: string;
  pinned?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  /** `null` = comentario raíz (en preguntas: una respuesta). */
  parentId: string | null;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  score: number;
}

export interface PostLike {
  postId: string;
  userId: string;
}
export interface CommentVote {
  commentId: string;
  userId: string;
}
export interface SavedPost {
  postId: string;
  userId: string;
  savedAt: string;
}

export type NotificationType = "comment" | "reply" | "like" | "solution" | "vote" | "welcome" | "rank";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  actorId?: string;
  postId?: string;
  commentId?: string;
  text?: string;
  createdAt: string;
  read: boolean;
}

export interface CommunityData {
  users: User[];
  posts: Post[];
  comments: Comment[];
  likes: PostLike[];
  commentVotes: CommentVote[];
  saves: SavedPost[];
  notifications: Notification[];
}

/* ---------- Entradas de formularios ---------- */

export interface PostInput {
  type: PostType;
  category: CategorySlug;
  title: string;
  body: string;
  image?: PostImage;
  tags: string[];
}

export interface CommentInput {
  postId: string;
  parentId: string | null;
  body: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface ProfileInput {
  displayName: string;
  bio: string;
  location?: string;
  avatarHue: number;
}

export type SortMode = "recientes" | "populares" | "comentadas" | "tendencias";
