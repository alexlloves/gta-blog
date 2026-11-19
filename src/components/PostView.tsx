"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { actions, useActorId, useData, useDerived } from "@/lib/data/store";
import { formatFullDate, formatRelativeDate, plural } from "@/lib/format";
import type { Comment, Post } from "@/lib/types";
import { Avatar } from "./Avatar";
import { CategoryBadge, StatusBadge, getStatus } from "./Badges";
import { Button, ButtonLink } from "./Button";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";
import { EmptyState } from "./EmptyState";
import { BackIcon, EditIcon, QuestionIcon, SolvedIcon, TrashIcon } from "./Icons";
import { LikeButton, ShareButton } from "./PostActions";
import { Prose } from "./Prose";
import { Modal, closeNearestDialog } from "./Modal";
import { useUI } from "./AppProviders";

/** Respuestas: la solución primero, luego por votos y antigüedad. Las réplicas, cronológicas. */
function buildThread(comments: Comment[], post: Post) {
  const childrenOf = new Map<string | null, Comment[]>();
  for (const c of comments) childrenOf.set(c.parentId, [...(childrenOf.get(c.parentId) ?? []), c]);
  const chrono = (a: Comment, b: Comment) => a.createdAt.localeCompare(b.createdAt);
  for (const [key, list] of childrenOf) if (key !== null) list.sort(chrono);
  const roots = childrenOf.get(null) ?? [];
  roots.sort((a, b) => {
    if (a.id === post.solutionId) return -1;
    if (b.id === post.solutionId) return 1;
    return b.score - a.score || chrono(a, b);
  });
  return { roots, childrenOf };
}

/** Cuenta una visita por pregunta y sesión de navegador. */
function useRegisterView(id: string | undefined, exists: boolean) {
  useEffect(() => {
    if (!id || !exists) return;
    const key = `gtavi:viewed:${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sin sessionStorage: se cuenta igualmente
    }
    void actions.registerView(id);
  }, [id, exists]);
}

export function PostView() {
  const { id } = useParams<{ id: string }>();
  const data = useData();
  const derived = useDerived();
  const actorId = useActorId();
  const { openAsk } = useUI();
  const [deleting, setDeleting] = useState(false);

  const post = derived?.postsById.get(id);
  useRegisterView(id, !!post);

  const thread = useMemo(() => {
    if (!data || !post) return null;
    return buildThread(data.comments.filter((c) => c.postId === post.id), post);
  }, [data, post]);

  if (!data || !derived) return <PostViewFallback />;

  if (!post) {
    return (
      <div className="py-10">
        <EmptyState icon={QuestionIcon} title="Pregunta no encontrada" actions={<ButtonLink href="/">Volver al inicio</ButtonLink>}>
          Puede que se haya eliminado o que el enlace no sea correcto.
        </EmptyState>
      </div>
    );
  }

  const author = derived.usersById.get(post.authorId);
  const answers = thread?.roots.length ?? 0;
  const isOwn = !!actorId && actorId === post.authorId;

  return (
    <div className="pt-6 sm:pt-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-text">
        <BackIcon className="size-4" /> Todas las preguntas
      </Link>

      <article className="mt-4 card p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryBadge category={post.category} link={false} />
          <StatusBadge status={getStatus(!!post.solutionId, answers)} />
        </div>

        <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight break-words sm:text-3xl">{post.title}</h1>
        {post.body && <Prose text={post.body} className="mt-4 text-text/90" />}

        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted">
          <Avatar user={author} size="xs" />
          <span>
            <span className="font-medium text-text/90">{author?.displayName ?? "Anónimo"}</span>
            <span className="mx-1.5 opacity-50">·</span>
            <time dateTime={post.createdAt} title={formatFullDate(post.createdAt)}>
              {formatRelativeDate(post.createdAt)}
            </time>
            {post.updatedAt && " · editada"}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line/60 pt-4">
          <LikeButton post={post} size="lg" />
          <ShareButton post={post} withLabel />
          {isOwn && (
            <div className="ml-auto flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => openAsk({ post })}>
                <EditIcon className="size-3.5" /> Editar
              </Button>
              <Button variant="danger" size="sm" onClick={() => setDeleting(true)} aria-label="Eliminar pregunta">
                <TrashIcon className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      </article>

      <section aria-labelledby="respuestas" className="mt-10">
        <h2 id="respuestas" className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
          {plural(answers, "respuesta", "respuestas")}
        </h2>

        {isOwn && answers > 0 && !post.solutionId && (
          <p className="mb-4 flex items-center gap-2 rounded-xl border border-mint/30 bg-mint/5 px-4 py-3 text-sm text-mint">
            <SolvedIcon className="size-4 shrink-0" /> ¿Alguna respuesta te ha servido? Márcala como solución.
          </p>
        )}

        {thread && thread.roots.length > 0 ? (
          <ul className="space-y-3">
            {thread.roots.map((c) => (
              <CommentItem key={c.id} comment={c} post={post} childrenOf={thread.childrenOf} />
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-line bg-surface/50 px-6 py-8 text-center text-muted">
            Aún no hay respuestas. ¡Sé el primero en responder!
          </p>
        )}

        <div className="mt-8">
          <CommentForm
            postId={post.id}
            isAnswer
            onDone={(cid) =>
              cid && requestAnimationFrame(() => document.getElementById(`c-${cid}`)?.scrollIntoView({ behavior: "smooth", block: "center" }))
            }
          />
        </div>
      </section>

      {deleting && <DeleteDialog post={post} onClose={() => setDeleting(false)} />}
    </div>
  );
}

function DeleteDialog({ post, onClose }: { post: Post; onClose: () => void }) {
  const router = useRouter();
  const { run } = useUI();
  return (
    <Modal title="¿Eliminar pregunta?" description="Se borrarán también sus respuestas. No se puede deshacer." onClose={onClose}>
      <p className="rounded-xl border border-line bg-ink/40 p-3 text-sm font-medium">{post.title}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={(e) => closeNearestDialog(e.currentTarget)}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          onClick={async (e) => {
            const el = e.currentTarget;
            const ok = await run(async () => {
              await actions.deletePost(post.id);
              return true;
            }, "Pregunta eliminada");
            if (ok) {
              closeNearestDialog(el);
              router.push("/");
            }
          }}
        >
          <TrashIcon className="size-4" /> Eliminar
        </Button>
      </div>
    </Modal>
  );
}

export function PostViewFallback() {
  return (
    <div className="pt-10" aria-busy="true">
      <div className="skeleton h-4 w-36" />
      <div className="mt-4 card space-y-4 p-7">
        <div className="skeleton h-5 w-40" />
        <div className="skeleton h-8 w-4/5" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
      </div>
    </div>
  );
}
