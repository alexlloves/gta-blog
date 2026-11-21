"use client";

import { authorLabel } from "@/lib/community";
import { useState } from "react";
import { actions, useActorId, useDerived } from "@/lib/data/store";
import { cn, formatFullDate, formatRelativeDate } from "@/lib/format";
import type { Comment, Post } from "@/lib/types";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { CommentForm } from "./CommentForm";
import { EditIcon, ReplyIcon, SolvedIcon, TrashIcon } from "./Icons";
import { Prose } from "./Prose";
import { VoteButton } from "./VoteButton";
import { useUI } from "./AppProviders";

const MAX_DEPTH = 4;

/**
 * Comentario con su hilo de respuestas (recursivo).
 * En preguntas, los comentarios raíz son "respuestas": se votan y el autor de
 * la pregunta puede marcar una como solución.
 */
export function CommentItem({
  comment,
  post,
  childrenOf,
  depth = 0,
}: {
  comment: Comment;
  post: Post;
  childrenOf: Map<string | null, Comment[]>;
  depth?: number;
}) {
  const derived = useDerived();
  const actorId = useActorId();
  const { run } = useUI();
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const author = derived?.usersById.get(comment.authorId);
  const replies = childrenOf.get(comment.id) ?? [];
  const isAnswer = post.type === "pregunta" && depth === 0;
  const isSolution = post.solutionId === comment.id;
  const isOwn = !!actorId && actorId === comment.authorId;
  const canMarkSolution = isAnswer && !!actorId && actorId === post.authorId;
  const isOP = comment.authorId === post.authorId;

  return (
    <li id={`c-${comment.id}`} className="scroll-mt-24">
      <div
        className={cn(
          "relative flex gap-3 rounded-2xl transition",
          depth === 0 && "border p-4 sm:p-5",
          depth === 0 && (isSolution
            ? "border-mint/50 bg-mint/[0.04] shadow-[0_0_0_1px_rgb(46_230_168/0.25),0_16px_40px_-20px_rgb(46_230_168/0.5)]"
            : "border-line bg-surface/70"),
          depth > 0 && "py-2",
        )}
      >
        {isAnswer && <VoteButton comment={comment} />}
        <div className="min-w-0 flex-1">
          {isSolution && (
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-lg bg-mint/15 px-2 py-0.5 text-xs font-bold text-mint">
              <SolvedIcon className="size-3.5" /> Solución elegida por el autor
            </p>
          )}
          <header className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
            <Avatar user={author && { ...author, displayName: authorLabel(comment, author) }} size={depth === 0 ? "sm" : "xs"} />
            <span className="font-semibold">{authorLabel(comment, author)}</span>
            {isOP && <span className="rounded bg-orange/15 px-1.5 text-[10px] font-bold uppercase text-orange">Autor</span>}
            <span className="text-xs text-subtle">
              ·{" "}
              <time dateTime={comment.createdAt} title={formatFullDate(comment.createdAt)}>
                {formatRelativeDate(comment.createdAt)}
              </time>
              {comment.updatedAt && " · editado"}
            </span>
          </header>

          {editing ? (
            <div className="mt-2">
              <CommentForm
                postId={post.id}
                compact
                autoFocus
                initialBody={comment.body}
                onSubmitEdit={(body) => actions.updateComment(comment.id, body)}
                onDone={() => setEditing(false)}
                onCancel={() => setEditing(false)}
              />
            </div>
          ) : (
            <Prose text={comment.body} className="mt-1.5 text-[15px] text-text/90" />
          )}

          {!editing && (
            <div className="mt-2 flex flex-wrap items-center gap-1 text-xs">
              {!isAnswer && <VoteButton comment={comment} layout="horizontal" />}
              {depth < MAX_DEPTH && (
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => setReplying((r) => !r)}
                >
                  <ReplyIcon className="size-3.5" /> Responder
                </Button>
              )}
              {canMarkSolution && (
                <Button
                  variant="subtle"
                  size="sm"
                  className={cn(isSolution ? "text-mint" : "hover:text-mint")}
                  onClick={() =>
                    void run(
                      () => actions.setSolution(post.id, isSolution ? null : comment.id),
                      isSolution ? "Solución desmarcada" : "¡Marcada como solución!",
                    )
                  }
                >
                  <SolvedIcon className="size-3.5" /> {isSolution ? "Quitar solución" : "Marcar como solución"}
                </Button>
              )}
              {isOwn && (
                <>
                  <Button variant="subtle" size="sm" onClick={() => setEditing(true)}>
                    <EditIcon className="size-3.5" /> Editar
                  </Button>
                  {confirmDelete ? (
                    <span className="inline-flex items-center gap-1">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => void run(() => actions.deleteComment(comment.id), "Comentario eliminado")}
                      >
                        Confirmar borrado
                      </Button>
                      <Button variant="subtle" size="sm" onClick={() => setConfirmDelete(false)}>
                        Cancelar
                      </Button>
                    </span>
                  ) : (
                    <Button variant="subtle" size="sm" className="hover:text-rose-300" onClick={() => setConfirmDelete(true)}>
                      <TrashIcon className="size-3.5" /> Eliminar
                    </Button>
                  )}
                </>
              )}
              {replies.length > 0 && (
                <Button variant="subtle" size="sm" onClick={() => setCollapsed((c) => !c)} aria-expanded={!collapsed}>
                  {collapsed ? `Ver ${replies.length} ${replies.length === 1 ? "respuesta" : "respuestas"}` : "Ocultar hilo"}
                </Button>
              )}
            </div>
          )}

          {replying && (
            <div className="mt-3">
              <CommentForm
                postId={post.id}
                parentId={comment.id}
                compact
                autoFocus
                onDone={(id) => {
                  setReplying(false);
                  setCollapsed(false);
                  if (id) requestAnimationFrame(() => document.getElementById(`c-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
                }}
                onCancel={() => setReplying(false)}
              />
            </div>
          )}

          {replies.length > 0 && !collapsed && (
            <ul className="mt-2 space-y-1 border-l-2 border-line/80 pl-3 sm:pl-4">
              {replies.map((r) => (
                <CommentItem key={r.id} comment={r} post={post} childrenOf={childrenOf} depth={depth + 1} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}
