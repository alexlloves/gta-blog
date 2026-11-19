"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useData, useDerived } from "@/lib/data/store";
import { searchPosts } from "@/lib/search";
import { cn, plural } from "@/lib/format";
import type { Post } from "@/lib/types";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { PlusIcon, SearchIcon } from "./Icons";
import { QuestionCard, QuestionCardSkeleton } from "./QuestionCard";
import { SearchBar } from "./SearchBar";
import { useUI } from "./AppProviders";

const TABS = [
  { id: "recientes", label: "Recientes" },
  { id: "populares", label: "Populares" },
  { id: "sin-respuesta", label: "Sin respuesta" },
  { id: "resueltas", label: "Resueltas" },
] as const;
type Tab = (typeof TABS)[number]["id"];

/** Refleja búsqueda y pestaña en la URL para poder compartirlas y volver atrás sin perderlas. */
function syncUrl(q: string, tab: Tab) {
  const url = new URL(window.location.href);
  if (q.trim()) url.searchParams.set("q", q.trim());
  else url.searchParams.delete("q");
  if (tab !== "recientes") url.searchParams.set("ver", tab);
  else url.searchParams.delete("ver");
  window.history.replaceState(window.history.state, "", url);
}

export function QuestionsViewFallback() {
  return (
    <div aria-hidden className="space-y-4">
      <div className="skeleton h-13 rounded-2xl" />
      <div className="skeleton h-10 w-80 rounded-xl" />
      <ul className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <QuestionCardSkeleton key={i} />
        ))}
      </ul>
    </div>
  );
}

export function QuestionsView() {
  const params = useSearchParams();
  const data = useData();
  const derived = useDerived();
  const { openAsk } = useUI();
  const [tab, setTab] = useState<Tab>(() => TABS.find((t) => t.id === params.get("ver"))?.id ?? "recientes");
  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const q = useDeferredValue(query).trim();

  const questions = useMemo(() => data?.posts.filter((p) => p.type === "pregunta") ?? null, [data]);

  const unanswered = useMemo(
    () => (questions && derived ? questions.filter((p) => !derived.answerCounts.get(p.id)).length : 0),
    [questions, derived],
  );

  const list = useMemo(() => {
    if (!questions || !derived) return null;
    if (q) return searchPosts(questions, q).map((r) => r.item);
    const byDate = (a: Post, b: Post) => b.createdAt.localeCompare(a.createdAt);
    const n = (p: Post) => derived.answerCounts.get(p.id) ?? 0;
    switch (tab) {
      case "sin-respuesta":
        return questions.filter((p) => n(p) === 0).sort(byDate);
      case "resueltas":
        return questions.filter((p) => p.solutionId).sort(byDate);
      case "populares":
        return [...questions].sort((a, b) => b.likeCount + n(b) * 2 - (a.likeCount + n(a) * 2) || byDate(a, b));
      default:
        return [...questions].sort(byDate);
    }
  }, [questions, derived, tab, q]);

  return (
    <>
      <SearchBar
        value={query}
        onChange={(v) => {
          setQuery(v);
          syncUrl(v, tab);
        }}
      />

      {!q && (
        <div className="no-scrollbar -mx-4 mt-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="inline-flex rounded-xl border border-line bg-surface/80 p-1 text-sm" role="tablist" aria-label="Filtrar preguntas">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => {
                  setTab(t.id);
                  syncUrl(query, t.id);
                }}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 transition",
                  tab === t.id ? "bg-surface-3 text-text" : "text-muted hover:text-text",
                )}
              >
                {t.label}
                {t.id === "sin-respuesta" && unanswered > 0 && (
                  <span className="ml-1.5 rounded-full bg-orange/20 px-1.5 text-xs text-orange">{unanswered}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {q && list && (
        <h2 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted" aria-live="polite">
          {plural(list.length, "resultado", "resultados")} para “{q}”
        </h2>
      )}

      <div className="mt-5">
        {list === null ? (
          <ul className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <QuestionCardSkeleton key={i} />
            ))}
          </ul>
        ) : list.length === 0 ? (
          <EmptyState
            icon={SearchIcon}
            title={q ? `Nadie ha preguntado “${q}” todavía` : tab === "sin-respuesta" ? "¡Todas tienen respuesta! 🎉" : "No hay preguntas aquí"}
            actions={
              <Button onClick={() => openAsk({ title: q })}>
                <PlusIcon className="size-4" /> {q ? "Hacer esta pregunta" : "Hacer una pregunta"}
              </Button>
            }
          >
            {q ? "Prueba con otras palabras o sé el primero en preguntarlo." : null}
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {list.map((p) => (
              <QuestionCard key={p.id} question={p} query={q} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
