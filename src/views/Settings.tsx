import { useState } from "react";
import {
  Settings as SettingsIcon,
  Github,
  Globe,
  Sparkles,
  Upload,
  Download,
  RefreshCw,
  Loader2,
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
  type UpdateInfo,
} from "../lib/tauri";

const REPO = "https://github.com/PoxiiTV/PoxiOptimizer";

export function Settings() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const pushToast = useStore((s) => s.pushToast);
  const [busy, setBusy] = useState<string | null>(null);
  const [update, setUpdate] = useState<UpdateInfo | null>(null);

  const langs: { code: Lang; label: string; flag: string }[] = [
    { code: "es", label: "Español", flag: "ES" },
    { code: "en", label: "English", flag: "EN" },
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
        } catch {
          /* continúa */
        }
      }
      pushToast(`${t("settings.imported")} (${n})`, "success");
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

      {/* Idioma */}
      <Card className="p-5 mb-4">
        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Globe size={16} className="text-[var(--color-accent)]" /> {t("settings.language")}
        </p>
        <div className="flex gap-2.5">
          {langs.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`flex items-center gap-2.5 px-4 h-11 rounded-xl text-sm font-medium transition-all ${
                lang === l.code
                  ? "accent-gradient text-white shadow-lg shadow-[#6d8bff]/25"
                  : "glass hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <span className="text-[11px] font-bold opacity-70">{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Configuración */}
      <Card className="p-5 mb-4">
        <p className="text-sm font-semibold mb-1">{t("settings.config")}</p>
        <p className="text-xs text-[var(--color-text-muted)] mb-3.5">{t("settings.configDesc")}</p>
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
        <p className="text-sm font-semibold mb-1">{t("settings.updates")}</p>
        <p className="text-xs text-[var(--color-text-muted)] mb-3.5">v2.0.0</p>
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
        ) : null}
        <Button variant="ghost" icon={busy === "update" ? Loader2 : RefreshCw} onClick={doCheckUpdate} loading={busy === "update"}>
          {t("settings.checkUpdate")}
        </Button>
      </Card>

      {/* Acerca de */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="grid place-items-center w-11 h-11 rounded-xl accent-gradient">
            <Sparkles size={22} className="text-white" />
          </div>
          <div>
            <p className="font-semibold">
              Poxi<span className="text-gradient">Optimizer</span>{" "}
              <span className="text-xs text-[var(--color-text-dim)] font-normal">v2.0.0</span>
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">{t("settings.aboutBody")}</p>
          </div>
        </div>

        <button
          onClick={() => openUrl(REPO)}
          className="glass w-full rounded-xl p-3.5 flex items-center gap-3 hover:bg-[var(--color-surface-hover)] transition-colors mt-2"
        >
          <Github size={18} />
          <span className="text-sm font-medium">{t("settings.repo")}</span>
        </button>

        <p className="text-xs text-[var(--color-text-dim)] mt-4 leading-relaxed">{t("settings.credits")}</p>
      </Card>
    </div>
  );
}
