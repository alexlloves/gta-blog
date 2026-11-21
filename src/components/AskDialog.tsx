"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { actions, useData, useDerived } from "@/lib/data/store";
import { CATEGORIES } from "@/lib/community";
import { searchPosts } from "@/lib/search";
import { cn } from "@/lib/format";
import type { CategorySlug, Post } from "@/lib/types";
import { Button } from "./Button";
import { Field, TextArea, TextInput } from "./Field";
import { SpinnerIcon } from "./Icons";
import { Modal, closeNearestDialog } from "./Modal";
import { NameField, useAuthorName } from "./NameField";
import { useUI } from "./AppProviders";

const TITLE_MIN = 10;
const TITLE_MAX = 140;

export function AskDialog({ initialTitle = "", post, onClose }: { initialTitle?: string; post?: Post; onClose: () => void }) {
  const uid = useId();
  const router = useRouter();
  const data = useData();
  const derived = useDerived();
  const { toast } = useUI();
  const editing = !!post;

  const [title, setTitle] = useState(post?.title ?? initialTitle);
  const [body, setBody] = useState(post?.body ?? "");
  const [category, setCategory] = useState<CategorySlug>(post?.category ?? "preguntas");
  const [name, setName, rememberName] = useAuthorName();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preguntas parecidas mientras se escribe, para evitar duplicados.
  const similar = useMemo(() => {
    if (!data || editing || title.trim().length < 4) return [];
    const questions = data.posts.filter((p) => p.type === "pregunta");
    return searchPosts(questions, title)
      .filter((r) => r.score >= 3)
      .slice(0, 3)
      .map((r) => r.item);
  }, [data, title, editing]);

  const trimmed = title.trim();
  const titleValid = trimmed.length >= TITLE_MIN;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!titleValid) {
      setError(`La pregunta debe tener al menos ${TITLE_MIN} caracteres.`);
      return;
    }
    const input = { type: "pregunta" as const, category, title: trimmed, body, tags: post?.tags ?? [], authorName: editing ? undefined : name };
    setSubmitting(true);
    setError(null);
    try {
      if (!editing) rememberName();
      const saved = editing ? await actions.updatePost(post.id, input) : await actions.createPost(input);
      toast(editing ? "Pregunta actualizada" : "¡Pregunta publicada!");
      closeNearestDialog(form);
      router.push(`/pregunta/${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar. Inténtalo de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={editing ? "Editar pregunta" : "Hacer una pregunta"}
      description="Sé claro y concreto. La comunidad te ayudará."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field id={`${uid}-t`} label="Pregunta" counter={{ value: trimmed.length, max: TITLE_MAX }}>
          <TextInput
            id={`${uid}-t`}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
            maxLength={TITLE_MAX}
            required
            autoFocus
            autoComplete="off"
            placeholder="¿Se podrá entrar en todos los edificios?"
          />
          {similar.length > 0 && (
            <div className="mt-2 rounded-xl border border-orange/30 bg-orange/5 p-3">
              <p className="mb-1.5 text-xs font-medium text-orange">¿Ya la han preguntado? Mira estas:</p>
              <ul className="space-y-1">
                {similar.map((q) => (
                  <li key={q.id}>
                    <Link
                      href={`/pregunta/${q.id}`}
                      onClick={(e) => closeNearestDialog(e.currentTarget)}
                      className="block truncate text-sm text-text/90 underline-offset-2 hover:text-pink hover:underline"
                    >
                      {q.title} <span className="text-muted">· {derived?.answerCounts.get(q.id) ?? 0} resp.</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Field>

        <Field id={`${uid}-d`} label={<>Descripción <span className="font-normal text-muted">(opcional)</span></>}>
          <TextArea
            id={`${uid}-d`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={5000}
            placeholder="Añade contexto si lo necesitas..."
          />
        </Field>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-text/90">Tema</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <label key={c.slug} className="cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={c.slug}
                  checked={category === c.slug}
                  onChange={() => setCategory(c.slug)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "block rounded-full border border-line bg-ink/40 px-3 py-1.5 text-sm text-muted transition hover:text-text",
                    "peer-checked:border-pink/70 peer-checked:bg-pink/15 peer-checked:text-text peer-focus-visible:outline-2 peer-focus-visible:outline-pink",
                  )}
                >
                  {c.name}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {!editing && <NameField id={`${uid}-n`} value={name} onChange={setName} />}

        {error && (
          <p role="alert" className="text-sm text-pink">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={submitting || !titleValid} className="w-full">
          {submitting && <SpinnerIcon className="size-4 animate-spin" />}
          {editing ? "Guardar cambios" : "Publicar pregunta"}
        </Button>
      </form>
    </Modal>
  );
}
