import { useState } from "react";
import { KeyRound, Monitor, FileText, ListChecks, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { Card, PageHeader } from "../components/ui";
import { useStore, useT } from "../store";
import { activateWindows, activateOffice, openMasMenu } from "../lib/tauri";

export function Activate() {
  const t = useT();
  const pushToast = useStore((s) => s.pushToast);
  const loadSystem = useStore((s) => s.loadSystem);
  const logAction = useStore((s) => s.logAction);
  const act = useStore((s) => s.activation);
  const [working, setWorking] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<string>) => {
    if (working) return;
    setWorking(key);
    try {
      const msg = await fn();
      pushToast(msg, msg.includes("✅") ? "success" : "info");
      loadSystem(true);
      await logAction({ kind: "activation", label: `Activación ejecutada: ${key}`, can_undo: false });
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setWorking(null);
    }
  };

  const actions = [
    { key: "win", icon: Monitor, title: t("activate.windows"), desc: t("activate.windowsDesc"), fn: activateWindows, primary: true },
    { key: "office", icon: FileText, title: t("activate.office"), desc: t("activate.officeDesc"), fn: activateOffice },
    { key: "menu", icon: ListChecks, title: t("activate.menu"), desc: t("activate.menuDesc"), fn: openMasMenu },
  ];

  return (
    <div>
      <PageHeader icon={KeyRound} title={t("activate.title")} subtitle={t("activate.subtitle")} />

      {/* Estado actual */}
      <Card className="p-5 mb-5 flex items-center gap-4">
        <div
          className={`grid place-items-center w-12 h-12 rounded-xl shrink-0 ${
            act?.activated ? "bg-[var(--color-success)]/15" : "bg-[var(--color-danger)]/15"
          }`}
        >
          {act?.activated ? (
            <ShieldCheck className="text-[var(--color-success)]" size={24} />
          ) : (
            <ShieldAlert className="text-[var(--color-danger)]" size={24} />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold">
            {act ? (act.activated ? t("dash.activated") : t("dash.notActivated")) : "…"}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] truncate">{act?.edition}</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3">
        {actions.map((a) => (
          <button
            key={a.key}
            onClick={() => run(a.key, a.fn)}
            disabled={working !== null}
            className={`glass rounded-2xl p-4 flex items-center gap-4 text-left hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-60 ${
              a.primary ? "border-[var(--color-accent)]/40" : ""
            }`}
          >
            <div
              className={`grid place-items-center w-11 h-11 rounded-xl shrink-0 ${
                a.primary ? "accent-gradient" : "bg-white/6"
              }`}
            >
              {working === a.key ? (
                <Loader2 size={21} className="animate-spin-slow text-white" />
              ) : (
                <a.icon size={21} className={a.primary ? "text-white" : "text-[var(--color-accent)]"} />
              )}
            </div>
            <div>
              <p className="font-medium text-sm">{a.title}</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {working === a.key ? t("activate.working") : a.desc}
              </p>
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-[var(--color-text-dim)] mt-5 leading-relaxed">
        {t("activate.disclaimer")}
      </p>
    </div>
  );
}
