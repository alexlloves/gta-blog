"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/format";
import { CloseIcon } from "./Icons";

/**
 * Diálogo modal nativo (<dialog>): foco atrapado, Escape y fondo gratis.
 * En móvil se muestra como hoja inferior; en escritorio, centrado.
 */
export function Modal({
  title,
  description,
  onClose,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const uid = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
      aria-labelledby={`${uid}-t`}
      className={cn(
        "m-0 mt-auto max-h-[94dvh] w-full max-w-none animate-slide-up overflow-y-auto rounded-t-3xl border border-line bg-surface p-0 text-text shadow-2xl sm:m-auto sm:max-w-lg sm:rounded-3xl",
        className,
      )}
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line/60 bg-surface/95 px-5 py-4 backdrop-blur sm:px-6">
        <div>
          <h2 id={`${uid}-t`} className="font-display text-lg font-extrabold">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="grid size-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-text"
          aria-label="Cerrar"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </dialog>
  );
}

/** Cierra el <dialog> más cercano (dispara su onClose con la animación nativa). */
export function closeNearestDialog(el: Element | null) {
  el?.closest("dialog")?.close();
}
