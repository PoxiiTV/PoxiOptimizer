import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, RotateCcw, Loader2 } from "lucide-react";
import { Badge, Card, CenterSpinner, PageHeader } from "../components/ui";
import { useStore, useT } from "../store";
import {
  getWindowsFeatures,
  enableWindowsFeature,
  disableWindowsFeature,
  type WinFeature,
} from "../lib/tauri";

export function WindowsFeatures() {
  const t = useT();
  const pushToast = useStore((s) => s.pushToast);
  const showBusy = useStore((s) => s.showBusy);
  const hideBusy = useStore((s) => s.hideBusy);
  const [features, setFeatures] = useState<WinFeature[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getWindowsFeatures()
      .then(setFeatures)
      .catch((e) => pushToast(String(e), "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async (feat: WinFeature) => {
    setBusy(feat.id);
    const action = feat.enabled ? t("winfeatures.disable") : t("winfeatures.enable");
    showBusy(`${action}: ${feat.name}`, feat.restart ? "Puede requerir reinicio al terminar." : "Aplicando cambios en el sistema…");
    try {
      const msg = feat.enabled
        ? await disableWindowsFeature(feat.id)
        : await enableWindowsFeature(feat.id);
      pushToast(msg, "success");
      await getWindowsFeatures().then(setFeatures);
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setBusy(null);
      hideBusy();
    }
  };

  if (loading) return <CenterSpinner label={t("winfeatures.loading")} />;

  return (
    <div>
      <PageHeader icon={Cpu} title={t("winfeatures.title")} subtitle={t("winfeatures.subtitle")} />

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={load}
          className="glass px-3 h-9 rounded-xl text-sm flex items-center gap-2 hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          <RotateCcw size={14} />
          {t("common.refresh")}
        </button>
      </div>

      <Card className="divide-y divide-[var(--color-border)]">
        {features.map((feat) => (
          <div key={feat.id} className="flex items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">{feat.name}</p>
                {feat.restart && (
                  <Badge tone="muted">{t("winfeatures.restart")}</Badge>
                )}
                {feat.enabled && <Badge tone="success">Activo</Badge>}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-snug">
                {feat.desc}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled={busy === feat.id}
              onClick={() => toggle(feat)}
              className={`shrink-0 h-9 px-4 rounded-xl text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2 ${
                feat.enabled
                  ? "glass hover:bg-[var(--color-surface-hover)]"
                  : "accent-gradient text-white shadow-lg shadow-[#6d8bff]/20"
              }`}
            >
              {busy === feat.id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : feat.enabled ? (
                t("winfeatures.disable")
              ) : (
                t("winfeatures.enable")
              )}
            </motion.button>
          </div>
        ))}
      </Card>
    </div>
  );
}
