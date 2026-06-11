import { useState } from "react";
import { Network as NetIcon, Check, Loader2, Zap } from "lucide-react";
import { Badge, PageHeader } from "../components/ui";
import { useStore, useT } from "../store";
import { setDns } from "../lib/tauri";

export function Network() {
  const t = useT();
  const pushToast = useStore((s) => s.pushToast);
  const logAction = useStore((s) => s.logAction);
  const showBusy = useStore((s) => s.showBusy);
  const hideBusy = useStore((s) => s.hideBusy);
  const [applied, setApplied] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  const options = [
    { id: "google", title: "Google DNS", servers: "8.8.8.8 · 8.8.4.4", recommended: true },
    { id: "cloudflare", title: "Cloudflare DNS", servers: "1.1.1.1 · 1.0.0.1", recommended: false },
    { id: "auto", title: t("net.auto"), servers: t("net.autoDesc"), recommended: false },
  ];

  const choose = async (id: string) => {
    if (working) return;
    const opt = options.find((o) => o.id === id);
    setWorking(id);
    showBusy(t("net.title"), `Aplicando ${opt?.title ?? id} en todos los adaptadores…`);
    try {
      const msg = await setDns(id);
      setApplied(id);
      pushToast(msg, "success");
      await logAction({ kind: "dns", label: `DNS cambiado a: ${id}`, can_undo: false });
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setWorking(null);
      hideBusy();
    }
  };

  return (
    <div>
      <PageHeader icon={NetIcon} title={t("net.title")} subtitle={t("net.subtitle")} />

      <div className="flex flex-col gap-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => choose(opt.id)}
            disabled={working !== null}
            className={`glass rounded-2xl p-4 flex items-center gap-4 text-left transition-all disabled:opacity-60 ${
              applied === opt.id ? "border-[var(--color-accent)]/60 bg-[var(--color-surface-hover)]" : "hover:bg-[var(--color-surface-hover)]"
            }`}
          >
            <div className="grid place-items-center w-11 h-11 rounded-xl bg-white/6 shrink-0">
              <Zap size={21} className="text-[var(--color-accent)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{opt.title}</p>
                {opt.recommended && <Badge tone="accent">{t("common.recommended")}</Badge>}
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">{opt.servers}</p>
            </div>
            {working === opt.id ? (
              <Loader2 size={20} className="animate-spin-slow text-[var(--color-accent)] shrink-0" />
            ) : applied === opt.id ? (
              <div className="grid place-items-center w-6 h-6 rounded-full accent-gradient shrink-0">
                <Check size={14} className="text-white" strokeWidth={3} />
              </div>
            ) : null}
          </button>
        ))}
      </div>

      <p className="text-xs text-[var(--color-text-dim)] mt-5 leading-relaxed">{t("net.note")}</p>
    </div>
  );
}
