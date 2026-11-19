import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="GTA VI Community, inicio">
      <span className="relative grid size-9 place-items-center overflow-hidden rounded-xl bg-sunset font-display text-sm font-extrabold text-ink shadow-[0_0_24px_-4px] shadow-pink/70 transition group-hover:scale-105 group-hover:rotate-[-4deg]">
        VI
        <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-purple/50 to-transparent" />
      </span>
      {!compact && (
        <span className="font-display text-[15px] font-extrabold leading-none tracking-tight">
          GTA <span className="text-sunset">VI</span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.25em] text-muted">Community</span>
        </span>
      )}
    </Link>
  );
}
