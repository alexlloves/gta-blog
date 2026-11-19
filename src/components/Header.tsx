"use client";

import { Logo } from "./Logo";
import { Button } from "./Button";
import { PlusIcon } from "./Icons";
import { useUI } from "./AppProviders";

export function Header() {
  const { openAsk } = useUI();
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-ink/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4 sm:px-6">
        <Logo />
        <Button onClick={() => openAsk()} className="ml-auto">
          <PlusIcon className="size-4" />
          <span className="hidden sm:inline">Hacer una pregunta</span>
          <span className="sm:hidden">Preguntar</span>
        </Button>
      </div>
    </header>
  );
}
