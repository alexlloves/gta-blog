"use client";

import { actions, useActorId, useData } from "@/lib/data/store";
import { cn } from "@/lib/format";
import type { Comment } from "@/lib/types";
import { ArrowUpIcon } from "./Icons";
import { useUI } from "./AppProviders";

/** Voto "útil" de una respuesta o comentario. */
export function VoteButton({ comment, layout = "vertical" }: { comment: Comment; layout?: "vertical" | "horizontal" }) {
  const data = useData();
  const actorId = useActorId();
  const { run } = useUI();
  const voted = !!actorId && !!data?.commentVotes.some((v) => v.commentId === comment.id && v.userId === actorId);
  const own = !!actorId && actorId === comment.authorId;
  const vertical = layout === "vertical";

  return (
    <button
      type="button"
      onClick={() => void run(() => actions.toggleCommentVote(comment.id), (v) => (v ? "Marcado como útil" : null))}
      aria-pressed={voted}
      disabled={own}
      title={own ? "No puedes votar tus propias respuestas" : "Votar como útil"}
      aria-label={voted ? `Quitar voto (${comment.score} votos)` : `Votar como útil (${comment.score} votos)`}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl border text-sm font-semibold transition active:scale-95 disabled:cursor-default",
        vertical ? "w-11 flex-col self-start py-1.5" : "h-8 gap-1 px-2.5",
        voted
          ? "border-pink/60 bg-pink/15 text-pink"
          : "border-line bg-surface-2 text-muted enabled:hover:border-pink/50 enabled:hover:text-text",
      )}
    >
      <ArrowUpIcon className={cn(vertical ? "size-5" : "size-4", voted && "fill-pink")} />
      <span className="tabular-nums">{comment.score}</span>
    </button>
  );
}
