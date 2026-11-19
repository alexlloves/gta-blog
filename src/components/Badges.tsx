import Link from "next/link";
import { CATEGORY_MAP, POST_TYPE_MAP, rankFor } from "@/lib/community";
import { cn } from "@/lib/format";
import type { CategorySlug, PostType, UserRole } from "@/lib/types";
import { CheckIcon } from "./Icons";

export function CategoryBadge({ category, link = true }: { category: CategorySlug; link?: boolean }) {
  const c = CATEGORY_MAP[category];
  if (!c) return null;
  const cls =
    "inline-flex items-center gap-1 rounded-md border border-purple/30 bg-purple/10 px-2 py-0.5 text-xs font-medium text-[#c7a8ff] transition";
  const Icon = c.icon;
  const content = (
    <>
      <Icon className="size-3" aria-hidden /> {c.name}
    </>
  );
  return link ? (
    <Link href={`/categoria/${c.slug}`} className={cn(cls, "relative z-10 hover:border-purple/60 hover:text-white")}>
      {content}
    </Link>
  ) : (
    <span className={cls}>{content}</span>
  );
}

export function TypeBadge({ type, className }: { type: PostType; className?: string }) {
  const t = POST_TYPE_MAP[type];
  if (!t) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold", t.tone, className)}>
      <span aria-hidden>{t.emoji}</span> {t.label}
    </span>
  );
}

export type QuestionStatus = "resuelta" | "respondida" | "pendiente";

const STATUS: Record<QuestionStatus, { label: string; className: string }> = {
  resuelta: { label: "Resuelta", className: "border-mint/30 bg-mint/10 text-mint" },
  respondida: { label: "Respondida", className: "border-orange/30 bg-orange/10 text-orange" },
  pendiente: { label: "Sin respuesta", className: "border-line bg-surface-2 text-muted" },
};

export function getStatus(solved: boolean, answers: number): QuestionStatus {
  if (solved) return "resuelta";
  return answers > 0 ? "respondida" : "pendiente";
}

export function StatusBadge({ status }: { status: QuestionStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${s.className}`}>
      {status === "resuelta" && <CheckIcon className="size-3" />}
      {s.label}
    </span>
  );
}

export function RankBadge({ points, className }: { points: number; className?: string }) {
  const { rank } = rankFor(points);
  return <span className={cn("text-xs font-medium", rank.tone, className)}>{rank.name}</span>;
}

export function RoleBadge({ role }: { role: UserRole }) {
  if (role === "miembro") return null;
  return (
    <span className="rounded bg-vice px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-white">
      {role === "admin" ? "Admin" : "Mod"}
    </span>
  );
}
