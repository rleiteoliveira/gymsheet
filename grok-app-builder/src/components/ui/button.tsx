import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-[transform,background-color,color,box-shadow,opacity] duration-150 ease-out outline-none select-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-96",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg hover:bg-fg",
        secondary: "bg-elevated text-fg shadow-border hover:bg-elevated/80",
        ghost: "bg-transparent text-muted hover:bg-elevated hover:text-fg",
        danger: "bg-danger/12 text-danger hover:bg-danger/18",
        link: "bg-transparent text-muted underline-offset-4 hover:text-fg hover:underline",
      },
      size: {
        default: "h-12 rounded-xl px-5 text-sm",
        lg: "h-14 rounded-2xl px-6 text-base",
        sm: "h-10 rounded-lg px-3.5 text-sm",
        icon: "size-12 rounded-xl",
        "icon-sm": "size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
