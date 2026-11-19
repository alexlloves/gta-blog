"use client";

import { useEffect, useRef } from "react";
import { CloseIcon, SearchIcon } from "./Icons";

export const SEARCH_INPUT_ID = "buscar";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Busca: precio, PC, Lucia, mapa, Online...",
  autoFocus,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Si se llega desde el botón "Buscar" de otra página (/#buscar), enfocar.
  useEffect(() => {
    if (window.location.hash === `#${SEARCH_INPUT_ID}`) inputRef.current?.focus();
  }, []);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        inputRef.current?.blur(); // cierra el teclado en móvil
        onSubmit?.();
      }}
      className="group relative"
    >
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-purple via-pink to-orange opacity-40 blur-[2px] transition group-focus-within:opacity-90" />
      <div className="relative flex items-center rounded-2xl bg-surface">
        <SearchIcon className="ml-4 size-5 shrink-0 text-muted group-focus-within:text-pink" />
        <label htmlFor={SEARCH_INPUT_ID} className="sr-only">
          Buscar publicaciones
        </label>
        <input
          ref={inputRef}
          id={SEARCH_INPUT_ID}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && value) {
              e.preventDefault();
              onChange("");
            }
          }}
          placeholder={placeholder}
          className="h-13 w-full min-w-0 bg-transparent px-3 text-base text-text placeholder:text-muted/70 focus:outline-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="mr-2 grid size-10 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-text"
            aria-label="Borrar búsqueda"
          >
            <CloseIcon className="size-5" />
          </button>
        )}
      </div>
    </form>
  );
}
