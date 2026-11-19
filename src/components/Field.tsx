import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/format";

/** Campos de formulario coherentes en toda la app. */

export const inputClasses =
  "w-full rounded-xl border border-line bg-ink/60 px-3 py-2.5 text-base text-text placeholder:text-muted/60 transition focus:border-pink/60 focus:bg-ink/80 focus:outline-none sm:text-sm";

interface FieldProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  counter?: { value: number; max: number };
  error?: string | null;
  children: ReactNode;
}

export function Field({ id, label, hint, counter, error, children }: FieldProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-text/90">
          {label}
        </label>
        {counter && (
          <span className={cn("text-xs tabular-nums", counter.value > counter.max * 0.9 ? "text-orange" : "text-subtle")}>
            {counter.value}/{counter.max}
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-pink">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-subtle">{hint}</p>
      )}
    </div>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClasses, className)} {...props} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClasses, "resize-y leading-relaxed", className)} {...props} />;
}
