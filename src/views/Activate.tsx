import { KeyRound, Monitor, FileText, ListChecks, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, PageHeader } from "../components/ui";
import { useStore, useT } from "../store";
import { activateWindows, activateOffice, openMasMenu } from "../lib/tauri";

export function Activate() {
  const t = useT();
  const pushToast = useStore((s) => s.pushToast);
  const act = useStore((s) => s.activation);

  const run = async (fn: () => Promise<string>) => {
    try {
      const msg = await fn();
      pushToast(msg, "info");
    } catch (e) {
      pushToast(String(e), "error");
    }
  };

  const actions = [
    { icon: Monitor, title: t("activate.windows"), desc: t("activate.windowsDesc"), fn: activateWindows, primary: true },
    { icon: FileText, title: t("activate.office"), desc: t("activate.officeDesc"), fn: activateOffice },
    { icon: ListChecks, title: t("activate.menu"), desc: t("activate.menuDesc"), fn: openMasMenu },
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
            key={a.title}
            onClick={() => run(a.fn)}
            className={`glass rounded-2xl p-4 flex items-center gap-4 text-left hover:bg-[var(--color-surface-hover)] transition-colors ${
              a.primary ? "border-[var(--color-accent)]/40" : ""
            }`}
          >
            <div
              className={`grid place-items-center w-11 h-11 rounded-xl shrink-0 ${
                a.primary ? "accent-gradient" : "bg-white/6"
              }`}
            >
              <a.icon size={21} className={a.primary ? "text-white" : "text-[var(--color-accent)]"} />
            </div>
            <div>
              <p className="font-medium text-sm">{a.title}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{a.desc}</p>
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
