import { useRef } from "react";
import { toast } from "sonner";
import { useGymStore } from "@/lib/gym/store";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";

export function SettingsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const exportBackup = useGymStore((state) => state.exportBackup);
  const importBackup = useGymStore((state) => state.importBackup);
  const loadDemo = useGymStore((state) => state.loadDemo);
  const clearAll = useGymStore((state) => state.clearAll);
  const fileRef = useRef<HTMLInputElement>(null);

  function download() {
    const blob = new Blob([exportBackup()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `gymsheet-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast("Backup baixado");
  }

  async function onFile(file: File) {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (importBackup(parsed)) toast("Backup restaurado");
      else toast("Arquivo inválido");
    } catch {
      toast("Arquivo inválido");
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title="Dados" description="Tudo fica neste aparelho.">
      <div className="space-y-3 pt-2">
        <Button variant="secondary" className="w-full" onClick={download}>
          Exportar backup
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => fileRef.current?.click()}>
          Importar backup
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => { loadDemo(); toast("Exemplo carregado"); onOpenChange(false); }}>
          Carregar exemplo
        </Button>
        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            if (window.confirm("Apagar fichas e treinos deste aparelho?")) {
              clearAll();
              toast("Dados apagados");
              onOpenChange(false);
            }
          }}
        >
          Limpar tudo
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onFile(file);
            event.target.value = "";
          }}
        />
        <p className="pt-4 text-xs leading-relaxed text-subtle">
          Sem conta. Sem nuvem. O backup JSON também lê o formato antigo do GymSheet.
        </p>
      </div>
    </Drawer>
  );
}
