import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MemoryStick,
  HardDrive,
  Cpu,
  MonitorCog,
  ShieldCheck,
  ShieldAlert,
  Clock,
  History,
  Gauge,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  Thermometer,
} from "lucide-react";
import { Card } from "../components/ui";
import { useStore, useT } from "../store";
import { createRestorePoint, getTemperatures, type TempInfo } from "../lib/tauri";

function Ring({ percent, label }: { percent: number; label: string }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <div className="relative w-[76px] h-[76px] shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        <motion.circle
          cx="38"
          cy="38"
          r={r}
          fill="none"
          stroke="url(#grad)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6d8bff" />
            <stop offset="100%" stopColor="#a06bff" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-base font-semibold tabular-nums">{percent}%</span>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function Dashboard() {
  const t = useT();
  const setView = useStore((s) => s.setView);
  const pushToast = useStore((s) => s.pushToast);
  const isAdmin = useStore((s) => s.isAdmin);
  const info = useStore((s) => s.systemInfo);
  const act = useStore((s) => s.activation);
  const [restoring, setRestoring] = useState(false);
  const [temps, setTemps] = useState<TempInfo | null>(null);

  useEffect(() => {
    const load = () => getTemperatures().then(setTemps).catch(() => {});
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  const doRestore = async () => {
    setRestoring(true);
    try {
      const msg = await createRestorePoint("PoxiOptimizer");
      pushToast(msg, "success");
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setRestoring(false);
    }
  };

  const quick = [
    {
      icon: History,
      title: t("dash.quick.restore"),
      desc: t("dash.quick.restoreDesc"),
      onClick: doRestore,
      loading: restoring,
    },
    {
      icon: Gauge,
      title: t("dash.quick.optimize"),
      desc: t("dash.quick.optimizeDesc"),
      onClick: () => setView("optimize"),
    },
    {
      icon: Sparkles,
      title: t("dash.quick.clean"),
      desc: t("dash.quick.cleanDesc"),
      onClick: () => setView("cleanup"),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-[var(--color-text-muted)]">{t("dash.welcome")}</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {info?.user_name || "PoxiOptimizer"}
        </h1>
      </div>

      {!isAdmin && (
        <Card className="p-4 mb-5 flex items-center gap-3 border-[var(--color-warning)]/30">
          <AlertTriangle className="text-[var(--color-warning)] shrink-0" size={20} />
          <div>
            <p className="text-sm font-medium">{t("admin.warning.title")}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{t("admin.warning.body")}</p>
          </div>
        </Card>
      )}

      {/* Activación + recursos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="p-5 flex items-center gap-4">
          <div
            className={`grid place-items-center w-12 h-12 rounded-xl shrink-0 ${
              act?.activated
                ? "bg-[var(--color-success)]/15"
                : "bg-[var(--color-danger)]/15"
            }`}
          >
            {act?.activated ? (
              <ShieldCheck className="text-[var(--color-success)]" size={24} />
            ) : (
              <ShieldAlert className="text-[var(--color-danger)]" size={24} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[var(--color-text-muted)]">{t("dash.activation")}</p>
            <p className="font-semibold truncate">
              {act ? (act.activated ? t("dash.activated") : t("dash.notActivated")) : "…"}
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <Ring percent={info?.ram_percent ?? 0} label="RAM" />
          <div className="min-w-0">
            <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
              <MemoryStick size={13} /> {t("dash.ram")}
            </p>
            <p className="font-semibold tabular-nums">
              {info ? `${info.ram_used} / ${info.ram_total} GB` : "…"}
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <Ring percent={info?.disk_percent ?? 0} label="Disco" />
          <div className="min-w-0">
            <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
              <HardDrive size={13} /> {t("dash.disk")}
            </p>
            <p className="font-semibold tabular-nums">
              {info ? `${info.disk_free} GB libres` : "…"}
            </p>
          </div>
        </Card>
      </div>

      {/* Info del sistema */}
      <Card className="p-5 mb-4">
        <p className="text-sm font-semibold mb-3.5">{t("dash.system")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <InfoRow icon={MonitorCog} label={info?.os_name ?? "Windows"} value={`${info?.os_version ?? ""} (build ${info?.os_build ?? ""})`} />
          <InfoRow icon={Cpu} label="CPU" value={info?.cpu ?? "…"} temp={temps?.cpu} />
          <InfoRow icon={MonitorCog} label="GPU" value={info?.gpu ?? "…"} temp={temps?.gpu} />
          <InfoRow icon={Clock} label={t("dash.uptime")} value={info ? `${info.uptime_hours} ${t("dash.hours")}` : "…"} />
        </div>
      </Card>

      {/* Acciones rápidas */}
      <p className="text-sm font-semibold mb-2.5 mt-6">{t("dash.quick")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quick.map((q) => (
          <motion.button
            key={q.title}
            whileTap={{ scale: 0.97 }}
            onClick={q.onClick}
            disabled={q.loading}
            className="glass rounded-2xl p-5 text-left hover:bg-[var(--color-surface-hover)] transition-colors group disabled:opacity-60"
          >
            <div className="grid place-items-center w-10 h-10 rounded-xl accent-gradient mb-3">
              <q.icon size={20} className="text-white" />
            </div>
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">{q.title}</p>
              <ChevronRight
                size={16}
                className="text-[var(--color-text-dim)] group-hover:translate-x-0.5 transition-transform"
              />
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">{q.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function TempBadge({ celsius }: { celsius: number | null | undefined }) {
  if (celsius == null) return null;
  const hot = celsius >= 80;
  const warm = celsius >= 65;
  const color = hot
    ? "text-[var(--color-danger)]"
    : warm
    ? "text-[var(--color-warning)]"
    : "text-[var(--color-success)]";
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold tabular-nums shrink-0 ${color}`}>
      <Thermometer size={11} />
      {celsius}°C
    </span>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  temp,
}: {
  icon: typeof Cpu;
  label: string;
  value: string;
  temp?: number | null;
}) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <Icon size={16} className="text-[var(--color-text-dim)] shrink-0" />
      <span className="text-[var(--color-text-muted)] shrink-0">{label}:</span>
      <span className="truncate font-medium flex-1">{value}</span>
      <TempBadge celsius={temp} />
    </div>
  );
}
