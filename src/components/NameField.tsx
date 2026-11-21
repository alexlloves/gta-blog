"use client";

import { useState } from "react";
import { useActorId, useData } from "@/lib/data/store";
import { DEFAULT_NAME, NAME_MAX } from "@/lib/community";
import { cn } from "@/lib/format";
import { inputClasses } from "./Field";

const NAME_KEY = "gtavi:name";

/**
 * Nombre visible (opcional). Se recuerda en el navegador y, al publicar, se
 * guarda en la identidad anónima para que aparezca en sus preguntas y respuestas.
 * Solo se usa en componentes que se renderizan en el cliente.
 */
export function useAuthorName() {
  const data = useData();
  const actorId = useActorId();
  const [name, setName] = useState(() => {
    const current = data?.users.find((u) => u.id === actorId)?.displayName;
    if (current && current !== DEFAULT_NAME) return current;
    try {
      return localStorage.getItem(NAME_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const remember = () => {
    try {
      if (name.trim()) localStorage.setItem(NAME_KEY, name.trim());
    } catch {
      // sin almacenamiento: no pasa nada
    }
  };
  return [name, setName, remember] as const;
}

export function NameField({
  id,
  value,
  onChange,
  compact,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn(compact && "flex items-center gap-2")}>
      <label htmlFor={id} className={cn("text-sm font-medium text-text/90", compact ? "shrink-0 text-xs text-muted" : "mb-1.5 block")}>
        Tu nombre <span className="font-normal text-muted">(opcional)</span>
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={NAME_MAX}
        autoComplete="nickname"
        placeholder={DEFAULT_NAME}
        className={cn(inputClasses, compact && "h-8 max-w-48 py-1 text-sm")}
      />
    </div>
  );
}
