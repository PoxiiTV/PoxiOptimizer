import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useStore } from "../store";

/** Overlay bloqueante genérico para operaciones largas (aplicar perfil, DNS, activación…). */
export function BusyOverlay() {
  const busyOverlay = useStore((s) => s.busyOverlay);

  return (
    <AnimatePresence>
      {busyOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] grid place-items-center bg-black/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="glass-strong rounded-2xl p-8 w-[400px] max-w-[90vw] shadow-2xl shadow-black/50 flex flex-col items-center gap-5 text-center"
          >
            {/* Spinner animado */}
            <div className="relative grid place-items-center w-18 h-18">
              <motion.div
                className="absolute w-[72px] h-[72px] rounded-full accent-gradient opacity-20"
                animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
              <motion.div
                className="absolute w-[72px] h-[72px] rounded-full accent-gradient opacity-10"
                animate={{ scale: [1, 1.7, 1], opacity: [0.1, 0, 0.1] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: 0.4 }}
              />
              <div className="relative grid place-items-center w-[72px] h-[72px] rounded-full accent-gradient shadow-lg">
                <Loader2 size={30} className="text-white animate-spin-slow" />
              </div>
            </div>

            {/* Texto */}
            <div className="flex flex-col gap-1.5">
              <p className="font-semibold text-base leading-snug">{busyOverlay.title}</p>
              {busyOverlay.subtitle && (
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed max-w-[300px]">
                  {busyOverlay.subtitle}
                </p>
              )}
            </div>

            <p className="text-xs text-[var(--color-text-dim)]">
              No cierres la app. Esto puede tardar unos segundos.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
