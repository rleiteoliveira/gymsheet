import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stepper({
  label,
  value,
  display,
  onStep,
  disabled,
}: {
  label: string;
  value: string;
  display?: string;
  onStep: (direction: -1 | 1) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center rounded-2xl bg-elevated px-1.5 py-1.5 shadow-border",
        disabled && "opacity-40",
      )}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={`Diminuir ${label}`}
        onClick={() => onStep(-1)}
        className="grid size-11 place-items-center rounded-xl text-muted transition-colors duration-150 hover:text-fg"
      >
        <Minus size={18} strokeWidth={2} />
      </button>
      <div className="min-w-0 flex-1 text-center">
        <div className="font-display text-3xl font-medium tracking-tight tabular-nums text-fg">
          {(display ?? value) || "—"}
        </div>
        <div className="text-xs font-medium tracking-wide text-subtle uppercase">{label}</div>
      </div>
      <button
        type="button"
        disabled={disabled}
        aria-label={`Aumentar ${label}`}
        onClick={() => onStep(1)}
        className="grid size-11 place-items-center rounded-xl text-muted transition-colors duration-150 hover:text-fg"
      >
        <Plus size={18} strokeWidth={2} />
      </button>
    </div>
  );
}
