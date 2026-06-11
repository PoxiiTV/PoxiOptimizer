import { useState } from "react";
import { motion } from "framer-motion";
import {
  Rocket,
  History,
  Trash2,
  Gamepad2,
  Download,
  Globe,
  Network,
  KeyRound,
  RefreshCcw,
  Power,
  Check,
  Loader2,
  AlertTriangle,
  PartyPopper,
  type LucideIcon,
} from "lucide-react";
import { useStore, useT } from "../store";
import {
  createRestorePoint,
  postformatDebloat,
  applyTweak,
  installApp,
  setChromeDefault,
  setDns,
  activateWindows,
  setWindowsUpdateMode,
  disableAllStartup,
} from "../lib/tauri";
import { PROFILES } from "../data/profiles";
import { POSTFORMAT_APPS } from "../data/postformat";

type StepState = "pending" | "running" | "done" | "error";
type Phase = "intro" | "running" | "done";

interface Step {
  key: string;
  label: string;
  icon: LucideIcon;
  action: () => Promise<string>;
}

export function PostFormat() {
  const t = useT();
  const setView = useStore((s) => s.setView);
  const [phase, setPhase] = useState<Phase>("intro");
  const [states, setStates] = useState<Record<string, StepState>>({});
  const [details, setDetails] = useState<Record<string, string>>({});
  const [appProg, setAppProg] = useState<{ name: string; i: number; total: number } | null>(null);
  const [doneIdx, setDoneIdx] = useState(0);

  const gamingTweaks = PROFILES.find((p) => p.id === "gaming")?.tweaks ?? [];

  const steps: Step[] = [
    {
      key: "restore",
      label: t("pf.step.restore"),
      icon: History,
      action: async () => {
        await createRestorePoint("PostFormateo");
        return t("pf.detail.restore");
      },
    },
    {
      key: "debloat",
      label: t("pf.step.debloat"),
      icon: Trash2,
      action: async () => {
        const removed = await postformatDebloat();
        return `${removed.length} ${t("pf.detail.removed")}`;
      },
    },
    {
      key: "gaming",
      label: t("pf.step.gaming"),
      icon: Gamepad2,
      action: async () => {
        let n = 0;
        for (const id of gamingTweaks) {
          try {
            await applyTweak(id);
            n++;
          } catch {
            /* sigue */
          }
        }
        return `${n} ${t("pf.detail.tweaks")}`;
      },
    },
    {
      key: "apps",
      label: t("pf.step.apps"),
      icon: Download,
      action: async () => {
        const total = POSTFORMAT_APPS.length;
        let ok = 0;
        for (let i = 0; i < total; i++) {
          const app = POSTFORMAT_APPS[i];
          setAppProg({ name: app.name, i: i + 1, total });
          try {
            await installApp(app.id);
            ok++;
          } catch {
            /* sigue con la siguiente */
          }
        }
        setAppProg(null);
        return `${ok}/${total} ${t("pf.detail.apps")}`;
      },
    },
    {
      key: "chrome",
      label: t("pf.step.chrome"),
      icon: Globe,
      action: async () => {
        await setChromeDefault();
        return t("pf.detail.chrome");
      },
    },
    {
      key: "dns",
      label: t("pf.step.dns"),
      icon: Network,
      action: async () => {
        await setDns("google");
        return t("pf.detail.dns");
      },
    },
    {
      key: "activate",
      label: t("pf.step.activate"),
      icon: KeyRound,
      action: async () => await activateWindows(),
    },
    {
      key: "wupdate",
      label: t("pf.step.wupdate"),
      icon: RefreshCcw,
      action: async () => {
        await setWindowsUpdateMode("security");
        return t("pf.detail.wupdate");
      },
    },
    {
      key: "startup",
      label: t("pf.step.startup"),
      icon: Power,
      action: async () => {
        const n = await disableAllStartup();
        return `${n} ${t("pf.detail.startup")}`;
      },
    },
  ];

  const run = async () => {
    setPhase("running");
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      setStates((p) => ({ ...p, [s.key]: "running" }));
      try {
        const d = await s.action();
        setDetails((p) => ({ ...p, [s.key]: d }));
        setStates((p) => ({ ...p, [s.key]: "done" }));
      } catch (e) {
        setDetails((p) => ({ ...p, [s.key]: String(e) }));
        setStates((p) => ({ ...p, [s.key]: "error" }));
      }
      setDoneIdx(i + 1);
    }
    setPhase("done");
  };

  // -------------------------------------------------------------------------
  if (phase === "intro") return <Intro steps={steps} onStart={run} t={t} />;

  if (phase === "done")
    return <Done steps={steps} details={details} onBack={() => setView("dashboard")} t={t} />;

  // ---- Fase running ----
  const progress = Math.round((doneIdx / steps.length) * 100);
  return (
    <div>
      <div className="flex items-center gap-3.5 mb-6">
        <div className="grid place-items-center w-11 h-11 rounded-xl accent-gradient shrink-0">
          <Rocket size={22} className="text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t("pf.running")}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{t("pf.runningSub")}</p>
        </div>
        <span className="text-2xl font-bold tabular-nums text-gradient">{progress}%</span>
      </div>

      {/* barra global */}
      <div className="h-2 rounded-full bg-white/8 overflow-hidden mb-6">
        <motion.div
          className="h-full accent-gradient"
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      {/* timeline */}
      <div className="relative pl-2">
        {steps.map((s, i) => {
          const st = states[s.key] ?? "pending";
          const last = i === steps.length - 1;
          return (
            <div key={s.key} className="flex gap-4">
              {/* columna icono + línea */}
              <div className="flex flex-col items-center">
                <StepDot state={st} icon={s.icon} />
                {!last && (
                  <div
                    className={`w-0.5 flex-1 my-1 rounded-full transition-colors ${
                      st === "done" ? "bg-[var(--color-accent)]/60" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
              {/* contenido */}
              <div className={`pb-5 flex-1 ${st === "pending" ? "opacity-45" : ""}`}>
                <p className="font-medium text-sm mt-1.5">{s.label}</p>
                {st === "running" && s.key === "apps" && appProg ? (
                  <p className="text-xs text-[var(--color-accent)] mt-0.5">
                    {t("pf.installing")} {appProg.name} ({appProg.i}/{appProg.total})
                  </p>
                ) : details[s.key] ? (
                  <p
                    className={`text-xs mt-0.5 ${
                      st === "error" ? "text-[var(--color-danger)]" : "text-[var(--color-text-muted)]"
                    }`}
                  >
                    {details[s.key]}
                  </p>
                ) : st === "running" ? (
                  <p className="text-xs text-[var(--color-accent)] mt-0.5">{t("common.working")}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepDot({ state, icon: Icon }: { state: StepState; icon: LucideIcon }) {
  if (state === "done")
    return (
      <motion.div
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 18 }}
        className="grid place-items-center w-9 h-9 rounded-full accent-gradient shrink-0"
      >
        <Check size={17} className="text-white" strokeWidth={3} />
      </motion.div>
    );
  if (state === "running")
    return (
      <div className="relative grid place-items-center w-9 h-9 shrink-0">
        <motion.div
          className="absolute inset-0 rounded-full accent-gradient opacity-30"
          animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
        <div className="relative grid place-items-center w-9 h-9 rounded-full accent-gradient">
          <Loader2 size={16} className="text-white animate-spin-slow" />
        </div>
      </div>
    );
  if (state === "error")
    return (
      <div className="grid place-items-center w-9 h-9 rounded-full bg-[var(--color-danger)]/20 shrink-0">
        <AlertTriangle size={16} className="text-[var(--color-danger)]" />
      </div>
    );
  return (
    <div className="grid place-items-center w-9 h-9 rounded-full bg-white/6 border border-white/10 shrink-0">
      <Icon size={16} className="text-[var(--color-text-dim)]" />
    </div>
  );
}

// ---------------------------------------------------------------------------
function Intro({ steps, onStart, t }: { steps: Step[]; onStart: () => void; t: (k: string) => string }) {
  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="text-center mb-7"
      >
        <div className="relative grid place-items-center w-20 h-20 mx-auto mb-4">
          <motion.div
            className="absolute inset-0 rounded-3xl accent-gradient opacity-30 blur-xl"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <div className="relative grid place-items-center w-20 h-20 rounded-3xl accent-gradient">
            <Rocket size={38} className="text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("pf.title")}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2 leading-relaxed">
          {t("pf.intro")}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-xl p-4 mb-5 flex items-start gap-3 border-[var(--color-warning)]/30"
      >
        <AlertTriangle size={18} className="text-[var(--color-warning)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--color-text-muted)] leading-snug">{t("pf.warning")}</p>
      </motion.div>

      <div className="glass rounded-2xl p-2 mb-6">
        {steps.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            className="flex items-center gap-3 p-2.5"
          >
            <div className="grid place-items-center w-8 h-8 rounded-lg bg-white/6 shrink-0">
              <s.icon size={16} className="text-[var(--color-accent)]" />
            </div>
            <span className="text-sm">{s.label}</span>
          </motion.div>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 + steps.length * 0.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        className="w-full h-14 rounded-2xl accent-gradient text-white font-semibold text-base shadow-xl shadow-[#6d8bff]/30 flex items-center justify-center gap-2.5"
      >
        <Rocket size={20} />
        {t("pf.start")}
      </motion.button>
    </div>
  );
}

// ---------------------------------------------------------------------------
function Done({
  steps,
  details,
  onBack,
  t,
}: {
  steps: Step[];
  details: Record<string, string>;
  onBack: () => void;
  t: (k: string) => string;
}) {
  return (
    <div className="max-w-xl mx-auto text-center pt-6">
      <div className="relative grid place-items-center w-28 h-28 mx-auto mb-5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full accent-gradient"
            initial={{ scale: 0.6, opacity: 0.5 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
          />
        ))}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 16 }}
          className="relative grid place-items-center w-24 h-24 rounded-full accent-gradient shadow-2xl shadow-[#6d8bff]/40"
        >
          <PartyPopper size={48} className="text-white" />
        </motion.div>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-semibold tracking-tight"
      >
        {t("pf.doneTitle")}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-[var(--color-text-muted)] mt-2"
      >
        {t("pf.doneSub")}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-4 mt-6 text-left divide-y divide-[var(--color-border)]"
      >
        {steps.map((s) => (
          <div key={s.key} className="flex items-center gap-3 py-2">
            <Check size={15} className="text-[var(--color-success)] shrink-0" strokeWidth={3} />
            <span className="text-sm flex-1">{s.label}</span>
            <span className="text-xs text-[var(--color-text-dim)] truncate max-w-[45%] text-right">
              {details[s.key]}
            </span>
          </div>
        ))}
      </motion.div>

      <button
        onClick={onBack}
        className="mt-6 px-6 h-11 rounded-xl glass hover:bg-[var(--color-surface-hover)] transition-colors text-sm font-medium"
      >
        {t("pf.backHome")}
      </button>
    </div>
  );
}
