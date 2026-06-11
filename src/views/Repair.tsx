import { useState } from "react";
import { Wrench, FileSearch, ShieldPlus, RefreshCcw, Loader2, Play } from "lucide-react";
import { Card, PageHeader } from "../components/ui";
import { useStore, useT } from "../store";
import { runSfc, runDism, resetWindowsUpdate } from "../lib/tauri";

export function Repair() {
  const t = useT();
  const pushToast = useStore((s) => s.pushToast);
  const [working, setWorking] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<string>) => {
    if (working) return;
    setWorking(key);
    try {
      pushToast(t("repair.started"), "info");
      const msg = await fn();
      pushToast(msg, "success");
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setWorking(null);
    }
  };

  const actions = [
    { key: "sfc", icon: FileSearch, title: t("repair.sfc"), desc: t("repair.sfcDesc"), fn: runSfc },
    { key: "dism", icon: ShieldPlus, title: t("repair.dism"), desc: t("repair.dismDesc"), fn: runDism },
    { key: "wu", icon: RefreshCcw, title: t("repair.wu"), desc: t("repair.wuDesc"), fn: resetWindowsUpdate },
  ];

  return (
    <div>
      <PageHeader icon={Wrench} title={t("repair.title")} subtitle={t("repair.subtitle")} />

      <Card className="p-4 mb-5 flex items-start gap-3 border-[var(--color-accent)]/20">
        <Play size={18} className="text-[var(--color-accent)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--color-text-muted)] leading-snug">{t("repair.note")}</p>
      </Card>

      <div className="grid grid-cols-1 gap-3">
        {actions.map((a) => (
          <button
            key={a.key}
            onClick={() => run(a.key, a.fn)}
            disabled={working !== null}
            className="glass rounded-2xl p-4 flex items-center gap-4 text-left hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-60"
          >
            <div className="grid place-items-center w-11 h-11 rounded-xl bg-white/6 shrink-0">
              {working === a.key ? (
                <Loader2 size={21} className="animate-spin-slow text-[var(--color-accent)]" />
              ) : (
                <a.icon size={21} className="text-[var(--color-accent)]" />
              )}
            </div>
            <div>
              <p className="font-medium text-sm">{a.title}</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {working === a.key ? t("repair.running") : a.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
