import { Suspense } from "react";
import { QuestionsView, QuestionsViewFallback } from "@/components/QuestionsView";

export default function HomePage() {
  return (
    <>
      <section className="pb-8 pt-10 text-center sm:pt-16">
        <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          ¿Qué quieres saber sobre <span className="text-sunset">GTA 6</span>?
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base text-muted sm:text-lg">
          Pregunta, responde y descubre todo sobre Grand Theft Auto VI. Sin registrarte.
        </p>
      </section>
      <Suspense fallback={<QuestionsViewFallback />}>
        <QuestionsView />
      </Suspense>
    </>
  );
}
