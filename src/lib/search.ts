import type { Post, User } from "@/lib/types";
import { CATEGORY_MAP, POST_TYPE_MAP } from "@/lib/community";

/**
 * Buscador local tolerante:
 * - Ignora mayúsculas, tildes y signos (¿?¡!).
 * - Descarta palabras vacías ("el", "de", "gta", "6"...).
 * - Coincidencia parcial ("personaje" encuentra "personajes").
 * - Sinónimos frecuentes ("costará" ≈ "precio", "PC" ≈ "ordenador").
 * - Puntúa más alto las coincidencias en el título que en la descripción
 *   (categoría, tipo, etiquetas y autor cuentan como coincidencia secundaria).
 */

const STOPWORDS = new Set([
  "a", "al", "algo", "con", "cual", "cuales", "cuando", "de", "del", "donde", "el", "ella",
  "en", "es", "esta", "este", "esto", "hay", "la", "las", "le", "lo", "los", "me", "mi",
  "o", "para", "pero", "por", "que", "quien", "se", "si", "sobre", "su", "te", "tu", "u",
  "un", "una", "unos", "unas", "y", "ya", "va", "como", "mas", "muy", "sabe", "alguien",
  "sera", "seran", "habra", "podra", "podre", "puedo", "tendra", "tener", "hacer", "juego",
  "gta", "6", "vi", "grand", "theft", "auto",
]);

const SYNONYM_GROUPS: string[][] = [
  ["precio", "cuesta", "costara", "costar", "coste", "valdra", "valor", "euros", "dolares", "pagar"],
  ["pc", "ordenador", "computadora", "steam", "windows"],
  ["sale", "salida", "lanzamiento", "fecha", "estreno", "saldra", "lanza", "cuando"],
  ["mapa", "tamano", "grande", "extension", "mundo", "leonida"],
  ["online", "multijugador", "multiplayer", "cooperativo"],
  ["personaje", "protagonista", "jugable", "jugar"],
  ["vehiculo", "coche", "coches", "auto", "moto", "barco", "avion"],
  ["arma", "armas", "pistola", "inventario"],
  ["historia", "trama", "campana", "duracion", "horas", "misiones", "mision"],
  ["teoria", "teorias", "especulacion", "rumor", "rumores"],
  ["secreto", "secretos", "easter", "eggs", "misterio", "oculto"],
  ["fauna", "animales", "caiman", "caimanes", "cocodrilo"],
  ["bug", "bugs", "error", "fallo", "glitch"],
  ["guia", "guias", "tutorial", "truco", "trucos", "consejos"],
  ["ps5", "playstation", "xbox", "consola", "plataforma", "plataformas"],
];

const SYNONYMS = new Map<string, string[]>();
for (const group of SYNONYM_GROUPS) {
  for (const word of group) {
    SYNONYMS.set(word, [...(SYNONYMS.get(word) ?? []), ...group.filter((w) => w !== word)]);
  }
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(text: string): string[] {
  return normalize(text).split(" ").filter(Boolean);
}

/** Términos significativos de la consulta. Si todo son palabras vacías, se usan tal cual. */
export function queryTerms(query: string): string[] {
  const all = words(query);
  const meaningful = all.filter((w) => !STOPWORDS.has(w));
  return [...new Set(meaningful.length > 0 ? meaningful : all)];
}

function wordMatches(term: string, word: string): boolean {
  if (term === word) return true;
  if (Math.min(term.length, word.length) < 3) return false;
  if (word.startsWith(term) || term.startsWith(word)) return true;
  // Raíz común larga: "costara" / "costar", "personajes" / "personaje"
  let i = 0;
  while (i < term.length && i < word.length && term[i] === word[i]) i++;
  return i >= 5;
}

/** 2 = coincidencia directa, 1 = por sinónimo, 0 = nada. */
function termScoreIn(term: string, textWords: string[]): number {
  if (textWords.some((w) => wordMatches(term, w))) return 2;
  const syns = SYNONYMS.get(term);
  if (syns && textWords.some((w) => syns.some((s) => wordMatches(s, w)))) return 1;
  return 0;
}

export interface SearchResult<T> {
  item: T;
  score: number;
}

/** Elemento buscable. `meta` = texto secundario (categoría, tipo, etiquetas, autor). */
export interface Searchable {
  title: string;
  body: string;
  meta?: string;
}

export function search<T>(items: T[], query: string, toSearchable: (item: T) => Searchable): SearchResult<T>[] {
  const terms = queryTerms(query);
  if (terms.length === 0) return items.map((item) => ({ item, score: 0 }));
  const phrase = normalize(query);

  const results: SearchResult<T>[] = [];
  for (const item of items) {
    const doc = toSearchable(item);
    const titleWords = words(doc.title);
    const bodyWords = words(doc.body);
    const categoryWords = doc.meta ? words(doc.meta) : [];
    let score = 0;
    let matched = 0;

    for (const term of terms) {
      const inTitle = termScoreIn(term, titleWords);
      const inBody = inTitle === 2 ? 0 : termScoreIn(term, bodyWords);
      const inCategory = inTitle || inBody ? 0 : termScoreIn(term, categoryWords);
      const termScore = inTitle * 3 + inBody + inCategory;
      if (termScore > 0) matched++;
      score += termScore;
    }
    if (matched === 0) continue;

    // Premia cubrir todos los términos y la coincidencia literal de la frase.
    score *= matched / terms.length;
    if (phrase.length > 3 && normalize(doc.title).includes(phrase)) score += 10;

    results.push({ item, score });
  }

  return results.sort((a, b) => b.score - a.score);
}

/** Divide un texto en fragmentos marcando las palabras que coinciden con la búsqueda. */
export function highlight(text: string, query: string): { text: string; match: boolean }[] {
  const terms = queryTerms(query);
  if (terms.length === 0) return [{ text, match: false }];
  return text
    .split(/(\s+)/)
    .map((part) => {
      const w = normalize(part);
      return { text: part, match: !!w && w.split(" ").some((x) => terms.some((t) => wordMatches(t, x))) };
    });
}

/* ---------- Adaptador para publicaciones ---------- */


export function searchPosts(posts: Post[], query: string, users?: Map<string, User>): SearchResult<Post>[] {
  return search(posts, query, (p) => ({
    title: p.title,
    body: p.body,
    meta: [
      CATEGORY_MAP[p.category]?.name,
      POST_TYPE_MAP[p.type]?.label,
      p.tags.join(" ").replace(/-/g, " "),
      users?.get(p.authorId)?.username,
    ].join(" "),
  }));
}
