const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
const dateFmt = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" });
const longDateFmt = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric" });
const compactFmt = new Intl.NumberFormat("es", { notation: "compact", maximumFractionDigits: 1 });

/** "hace 3 h", "ayer", "hace 5 días" o "12 nov 2026" si es más antiguo. */
export function formatRelativeDate(iso: string, now = Date.now()): string {
  const diff = (new Date(iso).getTime() - now) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return "ahora mismo";
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), "day");
  return dateFmt.format(new Date(iso));
}

export function formatFullDate(iso: string): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "long", timeStyle: "short" }).format(new Date(iso));
}

/** "19 de noviembre de 2026" (sin hora). */
export function formatLongDate(iso: string): string {
  return longDateFmt.format(new Date(iso));
}

/** 1234 → "1,2 mil". */
export function formatCount(n: number): string {
  return n < 1000 ? String(n) : compactFmt.format(n);
}

export function plural(n: number, one: string, many: string): string {
  return `${formatCount(n)} ${n === 1 ? one : many}`;
}

/** Extracto en texto plano, sin marcas de formato. */
export function excerpt(body: string, max = 200): string {
  const plain = body.replace(/\*\*|\*|^#+\s|^[-*]\s|^\d+\.\s/gm, "").replace(/\s+/g, " ").trim();
  return plain.length > max ? `${plain.slice(0, max).trimEnd()}…` : plain;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
