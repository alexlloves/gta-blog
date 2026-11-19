"use client";

import Link from "next/link";
import { useDerived } from "@/lib/data/store";
import { cn, formatCount, formatRelativeDate } from "@/lib/format";
import type { Post } from "@/lib/types";
import { Avatar } from "./Avatar";
import { CategoryBadge, getStatus } from "./Badges";
import { CheckIcon } from "./Icons";
import { highlight } from "@/lib/search";

function Highlighted({ text, query }: { text: string; query?: string }) {
  if (!query) return <>{text}</>;
  return (
    <>
      {highlight(text, query).map((part, i) =>
        part.match ? (
          <mark key={i} className="rounded bg-pink/20 px-0.5 text-pink">
            {part.text}
          </mark>
        ) : (
          part.text
        ),
      )}
    </>
  );
}

/** Fila compacta de pregunta (estilo Q&A): votos, respuestas y estado a la izquierda. */
export function QuestionCard({ question, query = "" }: { question: Post; query?: string }) {
  const derived = useDerived();
  const author = derived?.usersById.get(question.authorId);
  const answers = derived?.answerCounts.get(question.id) ?? 0;
  const status = getStatus(!!question.solutionId, answers);

  return (
    <li>
      <article className="group relative flex gap-3 card p-4 transition hover:-translate-y-0.5 hover:border-purple/50 sm:gap-4 sm:p-5">
        <div className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center sm:w-20">
          <div className="text-xs text-muted">
            <span className="block font-display text-base font-extrabold text-text tabular-nums">{formatCount(question.likeCount)}</span>
            votos
          </div>
          <div
            className={cn(
              "w-full rounded-lg border px-1 py-1 text-xs",
              status === "resuelta" && "border-mint/50 bg-mint/15 text-mint",
              status === "respondida" && "border-orange/40 text-orange",
              status === "pendiente" && "border-line text-muted",
            )}
          >
            <span className="flex items-center justify-center gap-0.5 font-bold tabular-nums">
              {status === "resuelta" && <CheckIcon className="size-3" />}
              {answers}
            </span>
            {answers === 1 ? "respuesta" : "respuestas"}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-snug text-text group-hover:text-white sm:text-lg">
            <Link href={`/pregunta/${question.id}`} className="after:absolute after:inset-0 after:content-['']">
              <Highlighted text={question.title} query={query} />
            </Link>
          </h3>
          {question.body && <p className="mt-1 line-clamp-2 text-sm text-muted">{question.body}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
            <CategoryBadge category={question.category} link={false} />
            <span className="ml-auto flex items-center gap-1.5">
              <Avatar user={author} size="xs" />
              <span className="font-medium text-text/80">{author?.displayName ?? "Anónimo"}</span>
              <span className="opacity-50">·</span>
              <time dateTime={question.createdAt}>{formatRelativeDate(question.createdAt)}</time>
            </span>
          </div>
        </div>
      </article>
    </li>
  );
}

export function QuestionCardSkeleton() {
  return (
    <li className="flex gap-4 card p-5" aria-hidden>
      <div className="w-16 space-y-2">
        <div className="skeleton h-8" />
        <div className="skeleton h-10" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-3.5 w-full" />
        <div className="skeleton h-3.5 w-1/2" />
      </div>
    </li>
  );
}
