"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { Post } from "@/lib/types";
import { cn } from "@/lib/format";
import { AlertIcon, CheckIcon, CloseIcon } from "./Icons";
import { AskDialog } from "./AskDialog";

/** Estado global de interfaz: avisos (toasts) y diálogo de preguntar/editar. */

type ToastKind = "success" | "error";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface UIContextValue {
  toast: (message: string, kind?: ToastKind) => void;
  /** Abre el diálogo para preguntar (opcionalmente con un título) o editar una pregunta. */
  openAsk: (options?: { title?: string; post?: Post }) => void;
  /** Ejecuta una acción mostrando el error si falla y el mensaje de éxito si va bien. */
  run: <T>(action: () => Promise<T>, success?: string | ((r: T) => string | null)) => Promise<T | undefined>;
}

const UIContext = createContext<UIContextValue | null>(null);

export function AppProviders({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const [ask, setAsk] = useState<{ title?: string; post?: Post; key: number } | null>(null);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (message: string, kind: ToastKind = "success") => {
      const id = ++nextId.current;
      setToasts((t) => [...t.slice(-2), { id, kind, message }]);
      setTimeout(() => dismiss(id), kind === "error" ? 5000 : 3000);
    },
    [dismiss],
  );

  const openAsk = useCallback((options: { title?: string; post?: Post } = {}) => {
    setAsk((a) => ({ ...options, key: (a?.key ?? 0) + 1 }));
  }, []);

  const run = useCallback(
    async <T,>(action: () => Promise<T>, success?: string | ((r: T) => string | null)) => {
      try {
        const result = await action();
        const msg = typeof success === "function" ? success(result) : success;
        if (msg) toast(msg);
        return result;
      } catch (err) {
        toast(err instanceof Error ? err.message : "Algo ha fallado. Inténtalo de nuevo.", "error");
        return undefined;
      }
    },
    [toast],
  );

  const value = useMemo(() => ({ toast, openAsk, run }), [toast, openAsk, run]);

  return (
    <UIContext value={value}>
      {children}
      {ask && <AskDialog key={ask.key} initialTitle={ask.title} post={ask.post} onClose={() => setAsk(null)} />}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm animate-slide-up items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl",
              t.kind === "error" ? "border-rose-500/40 bg-rose-950/90 text-rose-100" : "border-line-strong bg-surface-2/95 text-text",
            )}
          >
            {t.kind === "error" ? <AlertIcon className="size-4 shrink-0 text-rose-300" /> : <CheckIcon className="size-4 shrink-0 text-mint" />}
            <span className="flex-1">{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} className="text-muted hover:text-text" aria-label="Cerrar aviso">
              <CloseIcon className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </UIContext>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI debe usarse dentro de <AppProviders>");
  return ctx;
}
