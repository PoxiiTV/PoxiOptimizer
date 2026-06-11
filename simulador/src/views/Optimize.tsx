import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Gauge, AlertTriangle, ShieldCheck, Gamepad2, EyeOff, type LucideIcon } from "lucide-react";
import { Badge, Card, CenterSpinner, PageHeader, Toggle } from "../components/ui";
import { useStore, useT } from "../store";
import {
  getTweaks,
  checkAllTweaks,
  applyTweak,
  revertTweak,
  type TweakMeta,
} from "../lib/tauri";
import { PROFILES } from "../data/profiles";

const PROFILE_ICONS: Record<string, LucideIcon> = {
  "shield-check": ShieldCheck,
  gamepad: Gamepad2,
  "eye-off": EyeOff,
};

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
  const lang = useStore((s) => s.lang);
  const pushToast = useStore((s) => s.pushToast);
  const ensureRestorePoint = useStore((s) => s.ensureRestorePoint);
  const [tweaks, setTweaks] = useState<TweakMeta[]>([]);
  const [states, setStates] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [applyingProfile, setApplyingProfile] = useState<string | null>(null);

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

  const applyProfile = async (profileId: string, ids: string[]) => {
    setApplyingProfile(profileId);
    await ensureRestorePoint();
    const pending = ids.filter((id) => !states[id]);
    let ok = 0;
    for (const id of pending) {
      try {
        await applyTweak(id);
        setStates((s) => ({ ...s, [id]: true }));
        ok++;
      } catch {
        /* continúa con el resto */
      }
    }
    setApplyingProfile(null);
    pushToast(`${ok} ${t("common.applied").toLowerCase()}`, "success");
  };

  if (loading) return <CenterSpinner label={t("common.loading")} />;

  return (
    <div>
      <PageHeader icon={Gauge} title={t("opt.title")} subtitle={t("opt.subtitle")} />

      {/* Perfiles 1-clic */}
      <p className="text-sm font-semibold mb-2.5">{t("opt.profiles")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
        {PROFILES.map((p) => {
          const Icon = PROFILE_ICONS[p.icon];
          return (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.97 }}
              disabled={applyingProfile !== null}
              onClick={() => applyProfile(p.id, p.tweaks)}
              className="glass rounded-2xl p-4 text-left hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-60"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="grid place-items-center w-9 h-9 rounded-xl accent-gradient">
                  <Icon size={18} className="text-white" />
                </div>
                <p className="font-semibold text-sm">{lang === "en" ? p.nameEn : p.name}</p>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] leading-snug">
                {lang === "en" ? p.descEn : p.desc}
              </p>
              {applyingProfile === p.id && (
                <p className="text-xs text-[var(--color-accent)] mt-2">{t("common.working")}</p>
              )}
            </motion.button>
          );
        })}
      </div>

      <p className="text-sm font-semibold mb-2.5">{t("opt.allTweaks")}</p>
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
