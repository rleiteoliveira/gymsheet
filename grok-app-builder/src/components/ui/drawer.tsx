import { Drawer as VaulDrawer } from "vaul";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Drawer({
  open,
  onOpenChange,
  children,
  title,
  description,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <VaulDrawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className="fixed inset-0 z-50 bg-bg/70" />
        <VaulDrawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl bg-surface text-fg shadow-border outline-none",
          )}
        >
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border-strong" />
          <div className="px-5 pb-2 pt-4">
            <VaulDrawer.Title className="font-display text-2xl font-medium tracking-tight text-fg">
              {title}
            </VaulDrawer.Title>
            {description ? (
              <VaulDrawer.Description className="mt-1 text-sm text-muted">
                {description}
              </VaulDrawer.Description>
            ) : (
              <VaulDrawer.Description className="sr-only">{title}</VaulDrawer.Description>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            {children}
          </div>
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}
