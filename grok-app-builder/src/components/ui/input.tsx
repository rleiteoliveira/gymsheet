import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-xl bg-elevated px-4 text-base text-fg shadow-border outline-none placeholder:text-subtle focus-visible:shadow-focus",
        className,
      )}
      {...props}
    />
  );
}
