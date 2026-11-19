import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/format";

type Variant = "primary" | "ghost" | "subtle" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-sunset text-ink font-semibold shadow-[0_8px_30px_-10px] shadow-pink/70 hover:brightness-110 hover:shadow-pink active:brightness-95",
  ghost: "border border-line bg-surface text-text hover:border-purple/60 hover:bg-surface-2",
  subtle: "text-muted hover:bg-surface-2 hover:text-text",
  danger: "border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
  icon: "size-10 rounded-xl",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className = "") {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap transition duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

type Common = { variant?: Variant; size?: Size };

export function Button({ variant, size, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & Common) {
  return <button type="button" className={buttonClasses(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & Common & { href: string }) {
  return <Link href={href} className={buttonClasses(variant, size, className)} {...props} />;
}
