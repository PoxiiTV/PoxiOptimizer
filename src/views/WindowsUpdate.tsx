import { useEffect, useState } from "react";
import { RefreshCcw, ShieldCheck, Settings2, Ban, Check, Loader2 } from "lucide-react";
import { CenterSpinner, PageHeader } from "../components/ui";
import { useStore, useT } from "../store";
import { getWindowsUpdateMode, setWindowsUpdateMode } from "../lib/tauri";

type Mode = "default" | "security" | "disabled";

export function WindowsUpdate() {
  const t = useT();
  const pushToast = useStore((s) => s.pushToast);
  const logAction = useStore((s) => s.logAction);
  const showBusy = useStore((s) => s.showBusy);
  const hideBusy = useStore((s) => s.hideBusy);
  const [mode, setMode] = useState<Mode | null>(null);
  const [applying, setApplying] = useState<Mode | null>(null);

  useEffect(() => {
    getWindowsUpdateMode()
      .then((m) => setMode(m as Mode))
      .catch(() => setMode("default"));
  }, []);

  const options: { id: Mode; icon: typeof ShieldCheck; title: string; desc: string; tone: string }[] = [
    {
      id: "default",
      icon: Settings2,
      title: t("wu.default"),
      desc: t("wu.defaultDesc"),
      tone: "text-[var(--color-accent)]",
    },
    {
      id: "security",
      icon: ShieldCheck,
      title: t("wu.security"),
      desc: t("wu.securityDesc"),
      tone: "text-[var(--color-success)]",
    },
    {
      id: "disabled",
      icon: Ban,
      title: t("wu.disabled"),
      desc: t("wu.disabledDesc"),
      tone: "text-[var(--color-danger)]",
    },
  ];

  const choose = async (m: Mode) => {
    if (m === mode || applying) return;
    const opt = options.find((o) => o.id === m);
    setApplying(m);
    showBusy(t("wu.title"), `Aplicando: ${opt?.title ?? m}…`);
    try {
      await setWindowsUpdateMode(m);
      setMode(m);
      pushToast(t("common.done"), "success");
      await logAction({ kind: "wupdate", label: `Windows Update configurado: ${m}`, can_undo: false });
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setApplying(null);
      hideBusy();
    }
  };

  if (mode === null) return <CenterSpinner label={t("common.loading")} />;

  return (
    <div>
      <PageHeader icon={RefreshCcw} title={t("wu.title")} subtitle={t("wu.subtitle")} />

      <div className="flex flex-col gap-3">
        {options.map((opt) => {
          const active = mode === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => choose(opt.id)}
              disabled={!!applying}
              className={`glass rounded-2xl p-4 flex items-center gap-4 text-left transition-all ${
                active
                  ? "border-[var(--color-accent)]/60 bg-[var(--color-surface-hover)]"
                  : "hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <div className="grid place-items-center w-11 h-11 rounded-xl bg-white/6 shrink-0">
                <opt.icon size={21} className={opt.tone} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{opt.title}</p>
                <p className="text-xs text-[var(--color-text-muted)] leading-snug">{opt.desc}</p>
              </div>
              {applying === opt.id ? (
                <Loader2 size={20} className="animate-spin-slow text-[var(--color-accent)] shrink-0" />
              ) : active ? (
                <div className="grid place-items-center w-6 h-6 rounded-full accent-gradient shrink-0">
                  <Check size={14} className="text-white" strokeWidth={3} />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border border-white/20 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-[var(--color-text-dim)] mt-5 leading-relaxed">{t("wu.note")}</p>
    </div>
  );
}
