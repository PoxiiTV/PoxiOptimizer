import { useState } from "react";
import { Sparkles, FileX2, RefreshCw, Recycle, Globe, Play } from "lucide-react";
import { Button, Card, PageHeader, Toggle } from "../components/ui";
import { useStore, useT } from "../store";
import { runCleanup } from "../lib/tauri";

export function Cleanup() {
  const t = useT();
  const pushToast = useStore((s) => s.pushToast);
  const [opts, setOpts] = useState({
    temp: true,
    update: true,
    recycle: true,
    dns: false,
  });
  const [working, setWorking] = useState(false);
  const [freed, setFreed] = useState<number | null>(null);

  const items = [
    { key: "temp" as const, icon: FileX2, title: t("cleanup.temp"), desc: t("cleanup.tempDesc") },
    { key: "update" as const, icon: RefreshCw, title: t("cleanup.update"), desc: t("cleanup.updateDesc") },
    { key: "recycle" as const, icon: Recycle, title: t("cleanup.recycle"), desc: t("cleanup.recycleDesc") },
    { key: "dns" as const, icon: Globe, title: t("cleanup.dns"), desc: t("cleanup.dnsDesc") },
  ];

  const run = async () => {
    setWorking(true);
    setFreed(null);
    try {
      const res = await runCleanup(opts.temp, opts.update, opts.recycle, opts.dns);
      setFreed(res.freed_mb);
      pushToast(`${t("cleanup.freed")}: ${res.freed_mb} MB`, "success");
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div>
      <PageHeader icon={Sparkles} title={t("cleanup.title")} subtitle={t("cleanup.subtitle")} />

      <Card className="divide-y divide-[var(--color-border)] mb-5">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-3.5 p-4">
            <div className="grid place-items-center w-10 h-10 rounded-xl bg-white/6 shrink-0">
              <item.icon size={19} className="text-[var(--color-accent)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{item.desc}</p>
            </div>
            <Toggle
              checked={opts[item.key]}
              onChange={(v) => setOpts((o) => ({ ...o, [item.key]: v }))}
            />
          </div>
        ))}
      </Card>

      <div className="flex items-center gap-4">
        <Button icon={Play} onClick={run} loading={working}>
          {t("cleanup.run")}
        </Button>
        {freed !== null && (
          <p className="text-sm">
            <span className="text-[var(--color-text-muted)]">{t("cleanup.freed")}: </span>
            <span className="font-semibold text-[var(--color-success)] tabular-nums">
              {freed} MB
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
