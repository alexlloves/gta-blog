import Link from "next/link";
import { AVATAR_GRADIENTS } from "@/lib/community";
import { cn } from "@/lib/format";
import type { User } from "@/lib/types";

const SIZES = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
  xl: "size-24 text-3xl sm:size-28",
};

type Props = {
  user: Pick<User, "username" | "displayName" | "avatarHue" | "avatarUrl"> | undefined;
  size?: keyof typeof SIZES;
  link?: boolean;
  className?: string;
  ring?: boolean;
};

function initials(name: string) {
  const parts = name.replace(/[_\-.]/g, " ").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Avatar generado (degradado + iniciales). Admite `avatarUrl` cuando haya subida de imágenes. */
export function Avatar({ user, size = "md", link = false, className, ring }: Props) {
  const gradient = AVATAR_GRADIENTS[(user?.avatarHue ?? 0) % AVATAR_GRADIENTS.length];
  const inner = (
    <span
      className={cn(
        "relative grid shrink-0 select-none place-items-center overflow-hidden rounded-full bg-gradient-to-br font-display font-extrabold text-white",
        gradient,
        SIZES[size],
        ring && "ring-2 ring-pink/60 ring-offset-2 ring-offset-ink",
        className,
      )}
      aria-hidden={link ? undefined : true}
    >
      {user?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL arbitraria del usuario
        <img src={user.avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        initials(user?.displayName || user?.username || "?")
      )}
    </span>
  );
  if (!link || !user) return inner;
  return (
    <Link href={`/u/${user.username}`} aria-label={`Perfil de ${user.username}`} className="relative z-10 shrink-0 rounded-full">
      {inner}
    </Link>
  );
}
