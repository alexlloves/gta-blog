import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** Estado vacío ilustrado y con llamada a la acción. */
export function EmptyState({
  icon: Icon,
  title,
  children,
  actions,
}: {
  icon: LucideIcon;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-line-strong bg-surface/50 px-6 py-14 text-center">
      <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-80 -translate-x-1/2 rounded-full bg-pink/10 blur-3xl" />
      <div className="relative mx-auto grid size-16 place-items-center rounded-2xl border border-line-strong bg-surface-2 shadow-glow">
        <Icon className="size-7 text-pink" />
      </div>
      <p className="relative mt-5 font-display text-lg font-extrabold">{title}</p>
      {children && <div className="relative mx-auto mt-2 max-w-sm text-sm text-muted">{children}</div>}
      {actions && <div className="relative mt-6 flex flex-col justify-center gap-2 sm:flex-row">{actions}</div>}
    </div>
  );
}
