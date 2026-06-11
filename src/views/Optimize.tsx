import { useEffect, useMemo, useState } from "react";
import { Gauge, Wand2, AlertTriangle } from "lucide-react";
import { Badge, Button, Card, CenterSpinner, PageHeader, Toggle } from "../components/ui";
import { useStore, useT } from "../store";
import {
  getTweaks,
  checkAllTweaks,
  applyTweak,
  revertTweak,
  type TweakMeta,
} from "../lib/tauri";

const CATEGORY_ORDER = [
  "Privacidad",
  "Rendimiento",
  "Red",
  "Interfaz",
  "Sistema",
  "Avanzado",
];

export function Optimize() {
  const t = useT();
  const pushToast = useStore((s) => s.pushToast);
  const ensureRestorePoint = useStore((s) => s.ensureRestorePoint);
  const [tweaks, setTweaks] = useState<TweakMeta[]>([]);
  const [states, setStates] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [applyingAll, setApplyingAll] = useState(false);

  const load = async () => {
    const [list, st] = await Promise.all([getTweaks(), checkAllTweaks()]);
    setTweaks(list);
    setStates(st);
    setLoading(false);
  };

  useEffect(() => {
    load().catch((e) => {
      pushToast(String(e), "error");
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, TweakMeta[]> = {};
    for (const tw of tweaks) (map[tw.category] ??= []).push(tw);
    return CATEGORY_ORDER.filter((c) => map[c]).map((c) => ({ category: c, items: map[c] }));
  }, [tweaks]);

  const toggle = async (tw: TweakMeta, next: boolean) => {
    // Antes de aplicar cualquier cambio creamos un punto de restauración.
    if (next) await ensureRestorePoint();
    setBusy((b) => ({ ...b, [tw.id]: true }));
    setStates((s) => ({ ...s, [tw.id]: next })); // optimista
    try {
      const msg = next ? await applyTweak(tw.id) : await revertTweak(tw.id);
      pushToast(msg, "success");
    } catch (e) {
      setStates((s) => ({ ...s, [tw.id]: !next })); // revertir en error
      pushToast(String(e), "error");
    } finally {
      setBusy((b) => ({ ...b, [tw.id]: false }));
    }
  };

  const applyRecommended = async () => {
    setApplyingAll(true);
    await ensureRestorePoint();
    const pending = tweaks.filter((tw) => tw.recommended && !states[tw.id]);
    for (const tw of pending) {
      try {
        await applyTweak(tw.id);
        setStates((s) => ({ ...s, [tw.id]: true }));
      } catch {
        /* continúa con el resto */
      }
    }
    setApplyingAll(false);
    pushToast(`${pending.length} ${t("common.applied").toLowerCase()}`, "success");
  };

  if (loading) return <CenterSpinner label={t("common.loading")} />;

  return (
    <div>
      <PageHeader icon={Gauge} title={t("opt.title")} subtitle={t("opt.subtitle")} />

      <div className="flex justify-end mb-4">
        <Button icon={Wand2} onClick={applyRecommended} loading={applyingAll}>
          {t("opt.applyRecommended")}
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {grouped.map((group) => {
          const advanced = group.category === "Avanzado";
          return (
            <div key={group.category}>
              <p
                className={`text-sm font-semibold mb-2.5 ${
                  advanced ? "text-[var(--color-warning)]" : "text-[var(--color-text-muted)]"
                }`}
              >
                {t(`opt.cat.${group.category}`)}
              </p>

              {advanced && (
                <div className="glass rounded-xl p-3.5 mb-3 flex items-start gap-3 border-[var(--color-warning)]/30">
                  <AlertTriangle size={18} className="text-[var(--color-warning)] shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--color-text-muted)] leading-snug">
                    {t("opt.riskWarning")}
                  </p>
                </div>
              )}

              <Card className="divide-y divide-[var(--color-border)]">
                {group.items.map((tw) => (
                  <div key={tw.id} className="flex items-center gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{tw.title}</p>
                        {tw.recommended && <Badge tone="accent">{t("common.recommended")}</Badge>}
                        {tw.risky && <Badge tone="danger">{t("common.risky")}</Badge>}
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-snug">
                        {tw.description}
                      </p>
                    </div>
                    <Toggle
                      checked={!!states[tw.id]}
                      disabled={busy[tw.id]}
                      onChange={(v) => toggle(tw, v)}
                    />
                  </div>
                ))}
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
