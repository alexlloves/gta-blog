import { ButtonLink } from "@/components/Button";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="font-display text-6xl font-extrabold text-sunset">404</p>
      <h1 className="mt-3 font-display text-xl font-extrabold">Te has salido del mapa</h1>
      <p className="mt-2 text-muted">Esta página no existe.</p>
      <ButtonLink href="/" className="mt-6">
        Volver a las preguntas
      </ButtonLink>
    </div>
  );
}
