import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, HardDrive, Loader2 } from "lucide-react";
import { useStore } from "../store";

const STEPS: { key: "restore" | "backup"; icon: typeof ShieldCheck; title: string; desc: string }[] = [
  {
    key: "restore",
    icon: ShieldCheck,
    title: "Creando punto de restauración",
    desc: "Copia del sistema para poder deshacer cambios.",
  },
  {
    key: "backup",
    icon: HardDrive,
    title: "Guardando backup del registro",
    desc: "Exporta las claves de registro que se van a modificar.",
  },
];

/** Overlay bloqueante que aparece mientras se ejecutan las 2 medidas de
    seguridad obligatorias antes de aplicar cualquier cambio al sistema. */
export function RestoreOverlay() {
  const prepareStep = useStore((s) => s.prepareStep);
  const show = prepareStep !== null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] grid place-items-center bg-black/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-strong rounded-2xl p-7 w-[380px] max-w-[90vw] shadow-2xl shadow-black/40"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-dim)] mb-4 text-center">
              Medidas de seguridad obligatorias
            </p>

            <div className="flex flex-col gap-3">
              {STEPS.map((step, i) => {
                const isActive = prepareStep === step.key;
                const isDone =
                  (step.key === "restore" && prepareStep === "backup") ||
                  false;
                const Icon = step.icon;
                return (
                  <div
                    key={step.key}
                    className={`flex items-center gap-3.5 rounded-xl p-3.5 transition-all ${
                      isActive
                        ? "glass border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/8"
                        : isDone
                        ? "opacity-50"
                        : "opacity-30"
                    }`}
                  >
                    <div
                      className={`grid place-items-center w-10 h-10 rounded-xl shrink-0 ${
                        isActive ? "accent-gradient" : "bg-white/8"
                      }`}
                    >
                      <Icon size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{step.desc}</p>
                    </div>
                    {isActive && (
                      <Loader2
                        size={18}
                        className="animate-spin-slow text-[var(--color-accent)] shrink-0"
                      />
                    )}
                    {isDone && (
                      <span className="text-[var(--color-success)] text-sm shrink-0">✓</span>
                    )}
                    {!isActive && !isDone && (
                      <span className="text-[var(--color-text-dim)] text-xs shrink-0 tabular-nums">
                        {i + 1}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-[var(--color-text-dim)] text-center mt-4 leading-relaxed">
              Esto puede tardar unos segundos. No cierres la app.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
