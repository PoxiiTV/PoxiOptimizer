import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Github,
  Globe,
  Sparkles,
  Upload,
  Download,
  RefreshCw,
  Loader2,
  ClipboardList,
  RotateCcw,
  FolderOpen,
  HardDrive,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Button, Card, PageHeader } from "../components/ui";
import { useStore, useT } from "../store";
import type { Lang } from "../lib/i18n";
import {
  checkAllTweaks,
  applyTweak,
  revertTweak,
  exportConfig,
  importConfig,
  checkUpdate,
  getActionLog,
  clearActionLog,
  createRegistryBackup,
  listBackups,
  openBackupsFolder,
  type UpdateInfo,
  type LogEntry,
} from "../lib/tauri";

const REPO = "https://github.com/PoxiiTV/PoxiOptimizer";

const KIND_ICONS: Record<string, LucideIcon> = {
  tweak_apply: Sparkles,
  tweak_revert: RotateCcw,
  cleanup: Sparkles,
  debloat: Download,
  dns: Globe,
  startup: RefreshCw,
  wupdate: RefreshCw,
  repair: RefreshCw,
  activation: Sparkles,
  hosts: Globe,
  reg_backup: HardDrive,
};

function SectionHeader({ icon: Icon, title, color = "var(--color-accent)" }: { icon: LucideIcon; title: string; color?: string }) {
  return (
    <p className="text-sm font-semibold mb-3 flex items-center gap-2.5">
      <span
        className="grid place-items-center w-7 h-7 rounded-lg shrink-0"
        style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
      >
        <Icon size={14} style={{ color }} />
      </span>
      {title}
    </p>
  );
}

function HistoryRow({
  entry,
  t,
  onUndo,
  undoing,
}: {
  entry: LogEntry;
  t: (k: string) => string;
  onUndo: () => void;
  undoing: boolean;
}) {
  const Icon = KIND_ICONS[entry.kind] ?? ClipboardList;
  const date = new Date(entry.timestamp);
  const fmt = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return (
    <div className="flex items-center gap-2.5 py-1.5 px-1 rounded-lg hover:bg-[var(--color-surface-hover)] group transition-colors">
      <Icon size={14} className="text-[var(--color-text-dim)] shrink-0" />
      <span className="text-xs flex-1 truncate">{entry.label}</span>
      <span className="text-[11px] text-[var(--color-text-dim)] shrink-0 tabular-nums">{fmt}</span>
      {entry.can_undo && (
        <button
          onClick={onUndo}
          disabled={undoing}
          className="text-[10px] text-[var(--color-accent)] hover:underline opacity-0 group-hover:opacity-100 transition-opacity shrink-0 disabled:opacity-40"
        >
          {undoing ? "…" : t("history.undo")}
        </button>
      )}
    </div>
  );
}

export function Settings() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const pushToast = useStore((s) => s.pushToast);
  const [busy, setBusy] = useState<string | null>(null);
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [history, setHistory] = useState<LogEntry[]>([]);
  const [backups, setBackups] = useState<string[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    getActionLog().then(setHistory).catch(() => {});
    listBackups().then(setBackups).catch(() => {});
    setHistoryLoaded(true);
  }, []);

  const langs: { code: Lang; label: string; flag: string }[] = [
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "en", label: "English", flag: "🇬🇧" },
  ];

  const doExport = async () => {
    setBusy("export");
    try {
      const states = await checkAllTweaks();
      const json = JSON.stringify({ app: "PoxiOptimizer", version: 2, tweaks: states }, null, 2);
      const msg = await exportConfig(json);
      pushToast(msg, "success");
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setBusy(null);
    }
  };

  const doImport = async () => {
    setBusy("import");
    try {
      const raw = await importConfig();
      const data = JSON.parse(raw);
      const tweaks: Record<string, boolean> = data.tweaks ?? {};
      let n = 0;
      for (const [id, on] of Object.entries(tweaks)) {
        try {
          on ? await applyTweak(id) : await revertTweak(id);
          n++;
        } catch { /* continúa */ }
      }
      pushToast(`${t("settings.imported")} (${n})`, "success");
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setBusy(null);
    }
  };

  const doClearHistory = async () => {
    setBusy("clearHistory");
    try {
      await clearActionLog();
      setHistory([]);
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setBusy(null);
    }
  };

  const doCreateBackup = async () => {
    setBusy("backup");
    try {
      const path = await createRegistryBackup();
      pushToast(`${t("regbackup.created")}: ${path.split("\\").pop()}`, "success");
      const newList = await listBackups();
      setBackups(newList);
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setBusy(null);
    }
  };

  const doCheckUpdate = async () => {
    setBusy("update");
    try {
      const info = await checkUpdate();
      setUpdate(info);
      if (!info.update_available) pushToast(t("settings.upToDate"), "success");
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader icon={SettingsIcon} title={t("settings.title")} />

      {/* Hero / Acerca de */}
      <Card className="p-0 mb-4 overflow-hidden">
        <div className="accent-gradient p-5">
          <div className="flex items-center gap-4">
            <div className="grid place-items-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm shrink-0 shadow-lg">
              <Sparkles size={26} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-lg leading-tight">
                Poxi<span className="opacity-80">Optimizer</span>
              </p>
              <p className="text-white/60 text-xs mt-0.5">v3.5.2</p>
              <p className="text-white/75 text-xs mt-1 leading-snug">{t("settings.aboutBody")}</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <button
            onClick={() => openUrl(REPO)}
            className="glass w-full rounded-xl p-3 flex items-center gap-3 hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <Github size={16} className="text-[var(--color-accent)]" />
            <span className="text-sm font-medium">{t("settings.repo")}</span>
          </button>
          <p className="text-xs text-[var(--color-text-dim)] mt-3 leading-relaxed">{t("settings.credits")}</p>
        </div>
      </Card>

      {/* Idioma */}
      <Card className="p-5 mb-4">
        <SectionHeader icon={Globe} title={t("settings.language")} />
        <div className="flex gap-2.5">
          {langs.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`flex items-center gap-2.5 px-5 h-12 rounded-xl text-sm font-semibold transition-all ${
                lang === l.code
                  ? "accent-gradient text-white shadow-lg shadow-[#6d8bff]/25"
                  : "glass hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <span className="text-xl leading-none">{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Configuración */}
      <Card className="p-5 mb-4">
        <SectionHeader icon={Upload} title={t("settings.config")} />
        <p className="text-xs text-[var(--color-text-muted)] mb-3.5 -mt-1">{t("settings.configDesc")}</p>
        <div className="flex gap-2.5">
          <Button variant="ghost" icon={Upload} onClick={doExport} loading={busy === "export"}>
            {t("settings.export")}
          </Button>
          <Button variant="ghost" icon={Download} onClick={doImport} loading={busy === "import"}>
            {t("settings.import")}
          </Button>
        </div>
      </Card>

      {/* Actualizaciones */}
      <Card className="p-5 mb-4">
        <SectionHeader icon={RefreshCw} title={t("settings.updates")} color="var(--color-success)" />
        <p className="text-xs text-[var(--color-text-muted)] mb-3.5 -mt-1">v3.5.2</p>
        {update?.update_available ? (
          <div className="glass rounded-xl p-3.5 mb-3 flex items-center gap-3 border-[var(--color-success)]/30">
            <Sparkles size={18} className="text-[var(--color-success)] shrink-0" />
            <p className="text-sm flex-1">
              {t("settings.newVersion")} <strong>v{update.latest}</strong>
            </p>
            <Button variant="success" onClick={() => openUrl(update.url)}>
              {t("settings.download")}
            </Button>
          </div>
        ) : update && !update.update_available ? (
          <div className="glass rounded-xl p-3 mb-3 flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-[var(--color-success)] shrink-0" />
            <p className="text-xs text-[var(--color-text-muted)]">{t("settings.upToDate")}</p>
          </div>
        ) : null}
        <Button variant="ghost" icon={busy === "update" ? Loader2 : RefreshCw} onClick={doCheckUpdate} loading={busy === "update"}>
          {t("settings.checkUpdate")}
        </Button>
      </Card>

      {/* Backup de registro */}
      <Card className="p-5 mb-4">
        <SectionHeader icon={HardDrive} title={t("regbackup.title")} color="var(--color-warning)" />
        <p className="text-xs text-[var(--color-text-muted)] mb-3.5 -mt-1">{t("regbackup.desc")}</p>
        <div className="flex gap-2.5 flex-wrap mb-3">
          <Button variant="ghost" icon={HardDrive} onClick={doCreateBackup} loading={busy === "backup"}>
            {t("regbackup.create")}
          </Button>
          <Button variant="ghost" icon={FolderOpen} onClick={() => openBackupsFolder().catch(() => {})}>
            {t("regbackup.open")}
          </Button>
        </div>
        {backups.length > 0 ? (
          <div className="flex flex-col gap-1">
            {backups.slice(0, 5).map((b) => (
              <div key={b} className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 py-0.5">
                <HardDrive size={11} className="shrink-0 text-[var(--color-warning)]" />
                {b}
              </div>
            ))}
            {backups.length > 5 && (
              <p className="text-xs text-[var(--color-text-dim)]">+{backups.length - 5} más…</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-[var(--color-text-dim)]">{t("regbackup.none")}</p>
        )}
      </Card>

      {/* Historial de acciones */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <SectionHeader icon={ClipboardList} title={t("history.title")} />
          {history.length > 0 && (
            <Button variant="ghost" icon={busy === "clearHistory" ? Loader2 : RotateCcw} onClick={doClearHistory} loading={busy === "clearHistory"}>
              {t("history.clear")}
            </Button>
          )}
        </div>
        {!historyLoaded || history.length === 0 ? (
          <p className="text-xs text-[var(--color-text-dim)]">{t("history.empty")}</p>
        ) : (
          <div className="flex flex-col gap-0.5 max-h-72 overflow-y-auto">
            {history.slice(0, 100).map((entry) => (
              <HistoryRow
                key={entry.id}
                entry={entry}
                t={t}
                onUndo={async () => {
                  if (!entry.undo_kind || !entry.undo_id) return;
                  setBusy(`undo-${entry.id}`);
                  try {
                    entry.undo_kind === "tweak_apply"
                      ? await applyTweak(entry.undo_id)
                      : await revertTweak(entry.undo_id);
                    pushToast("Deshecho ✅", "success");
                    const updated = await getActionLog();
                    setHistory(updated);
                  } catch (e) {
                    pushToast(String(e), "error");
                  } finally {
                    setBusy(null);
                  }
                }}
                undoing={busy === `undo-${entry.id}`}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
