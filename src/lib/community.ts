import {
  Bug,
  Car,
  Compass,
  Crosshair,
  Flame,
  Gamepad2,
  Globe2,
  HelpCircle,
  Image as ImageIcon,
  Map,
  MapPin,
  MessagesSquare,
  Newspaper,
  Puzzle,
  ScrollText,
  Sparkles,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { CategorySlug, PostType, SortMode } from "./types";

/** Configuración estática de la comunidad: tipos, categorías, rangos e insignias. */

export interface PostTypeInfo {
  id: PostType;
  label: string;
  plural: string;
  emoji: string;
  icon: LucideIcon;
  /** Clases de color para chips (texto + fondo + borde). */
  tone: string;
  hint: string;
}

export const POST_TYPES: PostTypeInfo[] = [
  { id: "noticia", label: "Noticia", plural: "Noticias", emoji: "📰", icon: Newspaper, tone: "text-sky-300 bg-sky-400/10 border-sky-400/25", hint: "Información oficial o filtraciones con fuente" },
  { id: "pregunta", label: "Pregunta", plural: "Preguntas", emoji: "❓", icon: HelpCircle, tone: "text-amber-300 bg-amber-400/10 border-amber-400/25", hint: "Pide ayuda; puedes marcar la mejor respuesta" },
  { id: "debate", label: "Debate", plural: "Debates", emoji: "💬", icon: MessagesSquare, tone: "text-violet-300 bg-violet-400/10 border-violet-400/25", hint: "Abre una conversación con la comunidad" },
  { id: "teoria", label: "Teoría", plural: "Teorías", emoji: "🔥", icon: Flame, tone: "text-orange-300 bg-orange-400/10 border-orange-400/25", hint: "Comparte tus hipótesis y pruebas" },
  { id: "gameplay", label: "Gameplay", plural: "Gameplay", emoji: "🎮", icon: Gamepad2, tone: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25", hint: "Mecánicas, clips y análisis de juego" },
  { id: "imagen", label: "Imagen", plural: "Imágenes", emoji: "📸", icon: ImageIcon, tone: "text-pink-300 bg-pink-400/10 border-pink-400/25", hint: "Capturas, fan art y fotografía in-game" },
  { id: "descubrimiento", label: "Descubrimiento", plural: "Descubrimientos", emoji: "📍", icon: MapPin, tone: "text-teal-300 bg-teal-400/10 border-teal-400/25", hint: "Lugares y detalles encontrados en el juego" },
  { id: "guia", label: "Guía", plural: "Guías y trucos", emoji: "🛠️", icon: Wrench, tone: "text-lime-300 bg-lime-400/10 border-lime-400/25", hint: "Tutoriales, trucos y consejos" },
  { id: "bug", label: "Bug", plural: "Bugs y problemas", emoji: "🐛", icon: Bug, tone: "text-rose-300 bg-rose-400/10 border-rose-400/25", hint: "Errores y problemas técnicos" },
];

export const POST_TYPE_MAP = Object.fromEntries(POST_TYPES.map((t) => [t.id, t])) as Record<PostType, PostTypeInfo>;

export interface CategoryInfo {
  slug: CategorySlug;
  name: string;
  description: string;
  icon: LucideIcon;
  /** Degradado de la cabecera de la categoría. */
  gradient: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { slug: "noticias", name: "Noticias GTA 6", description: "Anuncios, tráilers y novedades oficiales.", icon: Newspaper, gradient: "from-sky-500/40 via-indigo-500/30 to-transparent" },
  { slug: "jason-y-lucia", name: "Jason y Lucia", description: "Los protagonistas, su historia y su relación.", icon: Users, gradient: "from-pink-500/40 via-fuchsia-500/30 to-transparent" },
  { slug: "historia", name: "Historia y misiones", description: "Trama, misiones y personajes secundarios.", icon: ScrollText, gradient: "from-violet-500/40 via-purple-500/30 to-transparent" },
  { slug: "mapa", name: "Mapa", description: "Leonida, Vice City y cada rincón del estado.", icon: Map, gradient: "from-teal-500/40 via-cyan-500/30 to-transparent" },
  { slug: "vehiculos", name: "Vehículos", description: "Coches, motos, barcos y aeronaves.", icon: Car, gradient: "from-orange-500/40 via-amber-500/30 to-transparent" },
  { slug: "armas", name: "Armas", description: "Arsenal, personalización y combate.", icon: Crosshair, gradient: "from-rose-500/40 via-red-500/30 to-transparent" },
  { slug: "online", name: "Online", description: "Todo sobre el multijugador de GTA VI.", icon: Globe2, gradient: "from-emerald-500/40 via-green-500/30 to-transparent" },
  { slug: "teorias", name: "Teorías", description: "Especulación, pistas y lecturas entre líneas.", icon: Flame, gradient: "from-orange-500/40 via-pink-500/30 to-transparent" },
  { slug: "gameplay", name: "Gameplay", description: "Mecánicas, físicas, IA y sistemas de juego.", icon: Gamepad2, gradient: "from-lime-500/40 via-emerald-500/30 to-transparent" },
  { slug: "preguntas", name: "Preguntas", description: "Dudas generales de la comunidad.", icon: HelpCircle, gradient: "from-amber-500/40 via-orange-500/30 to-transparent" },
  { slug: "secretos", name: "Secretos y easter eggs", description: "Referencias ocultas y misterios.", icon: Sparkles, gradient: "from-fuchsia-500/40 via-violet-500/30 to-transparent" },
  { slug: "mods", name: "Mods", description: "Por si algún día son compatibles.", icon: Puzzle, gradient: "from-indigo-500/40 via-blue-500/30 to-transparent" },
  { slug: "guias", name: "Guías", description: "Tutoriales, trucos y 100 %.", icon: Compass, gradient: "from-yellow-500/40 via-orange-500/30 to-transparent" },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c])) as Record<CategorySlug, CategoryInfo>;

export function isCategorySlug(v: string | null | undefined): v is CategorySlug {
  return !!v && v in CATEGORY_MAP;
}
export function isPostType(v: string | null | undefined): v is PostType {
  return !!v && v in POST_TYPE_MAP;
}

export const SORT_MODES: { id: SortMode; label: string }[] = [
  { id: "tendencias", label: "Tendencias" },
  { id: "recientes", label: "Recientes" },
  { id: "populares", label: "Populares" },
  { id: "comentadas", label: "Más comentadas" },
];

export function isSortMode(v: string | null | undefined): v is SortMode {
  return SORT_MODES.some((s) => s.id === v);
}

/* ---------- Gamificación ---------- */

export const POINTS = {
  post: 10,
  comment: 3,
  answer: 5,
  likeReceived: 2,
  voteReceived: 1,
  solution: 25,
} as const;

export interface Rank {
  name: string;
  min: number;
  /** Clases de color del rango. */
  tone: string;
}

export const RANKS: Rank[] = [
  { name: "Nuevo en Vice City", min: 0, tone: "text-zinc-300" },
  { name: "Habitante de Leonida", min: 100, tone: "text-sky-300" },
  { name: "Explorador", min: 400, tone: "text-emerald-300" },
  { name: "Criminal veterano", min: 1000, tone: "text-orange-300" },
  { name: "Leyenda de Vice City", min: 2500, tone: "text-pink-300" },
];

export function rankFor(points: number) {
  let index = 0;
  RANKS.forEach((r, i) => {
    if (points >= r.min) index = i;
  });
  const rank = RANKS[index];
  const next = RANKS[index + 1];
  const progress = next ? (points - rank.min) / (next.min - rank.min) : 1;
  return { rank, next, index, progress: Math.min(1, Math.max(0, progress)) };
}

/** Paleta de avatares generados (degradados). */
export const AVATAR_GRADIENTS = [
  "from-pink-500 to-orange-400",
  "from-violet-500 to-fuchsia-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-rose-500",
  "from-fuchsia-500 to-purple-700",
  "from-cyan-400 to-blue-600",
  "from-rose-500 to-red-700",
];
