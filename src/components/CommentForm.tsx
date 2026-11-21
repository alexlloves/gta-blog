"use client";

import { useId, useState } from "react";
import { actions } from "@/lib/data/store";
import { cn } from "@/lib/format";
import { Button } from "./Button";
import { TextArea } from "./Field";
import { SpinnerIcon } from "./Icons";
import { useUI } from "./AppProviders";
import { NameField, useAuthorName } from "./NameField";

const MIN = 2;

/** Formulario de respuesta / réplica. Sirve también para editar (`initialBody` + `onSubmitEdit`). */
export function CommentForm({
  postId,
  parentId = null,
  isAnswer = false,
  autoFocus,
  compact,
  initialBody = "",
  onSubmitEdit,
  onDone,
  onCancel,
}: {
  postId: string;
  parentId?: string | null;
  isAnswer?: boolean;
  autoFocus?: boolean;
  compact?: boolean;
  initialBody?: string;
  onSubmitEdit?: (body: string) => Promise<unknown>;
  onDone?: (commentId?: string) => void;
  onCancel?: () => void;
}) {
  const uid = useId();
  const { run } = useUI();
  const [body, setBody] = useState(initialBody);
  const [name, setName, rememberName] = useAuthorName();
  const [submitting, setSubmitting] = useState(false);
  const valid = body.trim().length >= MIN;
  const editing = !!onSubmitEdit;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    const result = editing
      ? await run(() => onSubmitEdit(body), "Cambios guardados")
      : await run(() => {
          rememberName();
          return actions.createComment({ postId, parentId, body, authorName: name });
        }, isAnswer ? "Respuesta publicada" : "Comentario publicado");
    setSubmitting(false);
    if (result !== undefined) {
      if (!editing) setBody("");
      onDone?.(typeof result === "object" && result && "id" in result ? String(result.id) : undefined);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-3", !compact && "card p-4 sm:p-5")}>
      <label htmlFor={`${uid}-c`} className={cn("block font-semibold", compact && "sr-only")}>
        {editing ? "Editar" : isAnswer ? "Tu respuesta" : "Tu comentario"}
      </label>
      <TextArea
        id={`${uid}-c`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
          if (e.key === "Escape" && onCancel) onCancel();
        }}
        rows={compact ? 2 : 4}
        maxLength={5000}
        autoFocus={autoFocus}
        required
        placeholder={isAnswer ? "Comparte lo que sabes..." : "Escribe una respuesta..."}
      />
      {!editing && <NameField id={`${uid}-n`} value={name} onChange={setName} compact />}
      <div className="flex items-center justify-end gap-2">
        <span className="mr-auto hidden text-xs text-subtle sm:inline">⌘/Ctrl + Enter para enviar</span>
        {onCancel && (
          <Button variant="subtle" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" size={compact ? "sm" : "md"} disabled={!valid || submitting}>
          {submitting && <SpinnerIcon className="size-4 animate-spin" />}
          {editing ? "Guardar" : isAnswer ? "Enviar respuesta" : "Responder"}
        </Button>
      </div>
    </form>
  );
}
