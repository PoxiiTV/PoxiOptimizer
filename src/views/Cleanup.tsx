import { useState } from "react";
import {
  Sparkles,
  FileX2,
  RefreshCw,
  Recycle,
  Globe,
  Play,
  Image,
  ScrollText,
  Printer,
  Boxes,
} from "lucide-react";
import { Button, Card, PageHeader, Toggle } from "../components/ui";
import { useStore, useT } from "../store";
import { runCleanup } from "../lib/tauri";

type Key =
  | "temp"
  | "update_cache"
  | "browser_cache"
  | "thumbnails"
  | "win_logs"
  | "recycle_bin"
  | "print_queue"
  | "dns"
  | "winsxs";

export function Cleanup() {
  const t = useT();
  const pushToast = useStore((s) => s.pushToast);
  const ensureRestorePoint = useStore((s) => s.ensureRestorePoint);
  const logAction = useStore((s) => s.logAction);
  const showBusy = useStore((s) => s.showBusy);
  const hideBusy = useStore((s) => s.hideBusy);
  const [opts, setOpts] = useState<Record<Key, boolean>>({
    temp: true,
    update_cache: true,
    browser_cache: false,
    thumbnails: true,
    win_logs: true,
    recycle_bin: true,
    print_queue: false,
    dns: false,
    winsxs: false,
  });
  const [working, setWorking] = useState(false);
  const [freed, setFreed] = useState<number | null>(null);

  const items: { key: Key; icon: typeof FileX2; title: string; desc: string }[] = [
    { key: "temp", icon: FileX2, title: t("cleanup.temp"), desc: t("cleanup.tempDesc") },
    { key: "update_cache", icon: RefreshCw, title: t("cleanup.update"), desc: t("cleanup.updateDesc") },
    { key: "browser_cache", icon: Globe, title: t("cleanup.browser"), desc: t("cleanup.browserDesc") },
    { key: "thumbnails", icon: Image, title: t("cleanup.thumbs"), desc: t("cleanup.thumbsDesc") },
    { key: "win_logs", icon: ScrollText, title: t("cleanup.logs"), desc: t("cleanup.logsDesc") },
    { key: "print_queue", icon: Printer, title: t("cleanup.print"), desc: t("cleanup.printDesc") },
    { key: "recycle_bin", icon: Recycle, title: t("cleanup.recycle"), desc: t("cleanup.recycleDesc") },
    { key: "dns", icon: Globe, title: t("cleanup.dns"), desc: t("cleanup.dnsDesc") },
    { key: "winsxs", icon: Boxes, title: t("cleanup.winsxs"), desc: t("cleanup.winsxsDesc") },
  ];

  const run = async () => {
    setWorking(true);
    setFreed(null);
    await ensureRestorePoint();
    const winsxs = opts.winsxs;
    showBusy(
      t("cleanup.title"),
      winsxs ? "Limpiando el sistema. WinSxS puede tardar varios minutos…" : "Borrando temporales, caché y archivos innecesarios…"
    );
    try {
      const selected = (Object.keys(opts) as Key[]).filter((k) => opts[k]);
      const res = await runCleanup(selected);
      setFreed(res.freed_mb);
      pushToast(`${t("cleanup.freed")}: ${res.freed_mb} MB`, "success");
      await logAction({ kind: "cleanup", label: `Limpieza completada — ${res.freed_mb} MB liberados`, can_undo: false });
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setWorking(false);
      hideBusy();
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
            <span className="font-semibold text-[var(--color-success)] tabular-nums">{freed} MB</span>
          </p>
        )}
      </div>
    </div>
  );
}
