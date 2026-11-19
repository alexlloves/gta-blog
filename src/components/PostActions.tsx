"use client";

import { useState } from "react";
import { actions, useActorId, useData } from "@/lib/data/store";
import { cn, formatCount } from "@/lib/format";
import type { Post } from "@/lib/types";
import { ArrowUpIcon, ShareIcon } from "./Icons";
import { useUI } from "./AppProviders";

const btn =
  "relative z-10 inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-muted transition hover:bg-surface-3 hover:text-text active:scale-95";

export function usePostFlags(postId: string) {
  const data = useData();
  const actorId = useActorId();
  const liked = !!actorId && !!data?.likes.some((l) => l.postId === postId && l.userId === actorId);
  return { liked };
}

export function LikeButton({ post, size = "md" }: { post: Post; size?: "md" | "lg" }) {
  const { liked } = usePostFlags(post.id);
  const { run } = useUI();
  const [pop, setPop] = useState(0);
  return (
    <button
      type="button"
      onClick={() => {
        if (!liked) setPop((p) => p + 1);
        void run(() => actions.toggleLike(post.id));
      }}
      aria-pressed={liked}
      aria-label={liked ? `Quitar voto (${post.likeCount})` : `Votar pregunta (${post.likeCount})`}
      className={cn(btn, liked && "text-pink hover:text-pink", size === "lg" && "h-11 border border-line px-4")}
    >
      <ArrowUpIcon key={pop} className={cn("size-[18px]", liked && "fill-pink", pop > 0 && "animate-pop")} />
      <span className="tabular-nums">{formatCount(post.likeCount)}</span>
    </button>
  );
}

/** Copia al portapapeles; si la API moderna no está disponible o se bloquea, usa el método clásico. */
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    if (!ok) throw new Error("copy failed");
  }
}

export function ShareButton({ post, withLabel = false }: { post: Post; withLabel?: boolean }) {
  const { toast } = useUI();
  return (
    <button
      type="button"
      onClick={async () => {
        const url = `${window.location.origin}/pregunta/${post.id}`;
        try {
          if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
            await navigator.share({ title: post.title, url });
            return;
          }
          await copyText(url);
          toast("Enlace copiado al portapapeles");
        } catch (err) {
          if ((err as Error)?.name !== "AbortError") toast("No se pudo copiar el enlace", "error");
        }
      }}
      aria-label="Compartir"
      className={cn(btn, withLabel && "h-11 border border-line px-4")}
    >
      <ShareIcon className="size-[18px]" />
      {withLabel && <span>Compartir</span>}
    </button>
  );
}
