import { Settings as SettingsIcon, Github, Globe, Sparkles } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Card, PageHeader } from "../components/ui";
import { useStore, useT } from "../store";
import type { Lang } from "../lib/i18n";

const REPO = "https://github.com/PoxiiTV/PoxiOptimizer";

export function Settings() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);

  const langs: { code: Lang; label: string; flag: string }[] = [
    { code: "es", label: "Español", flag: "ES" },
    { code: "en", label: "English", flag: "EN" },
  ];

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

      {/* Acerca de */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="grid place-items-center w-11 h-11 rounded-xl accent-gradient">
            <Sparkles size={22} className="text-white" />
          </div>
          <div>
            <p className="font-semibold">
              Poxi<span className="text-gradient">Optimizer</span>{" "}
              <span className="text-xs text-[var(--color-text-dim)] font-normal">v1.0.0</span>
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

        <p className="text-xs text-[var(--color-text-dim)] mt-4 leading-relaxed">
          {t("settings.credits")}
        </p>
      </Card>
    </div>
  );
}
