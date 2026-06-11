import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useStore } from "../store";

/** Overlay bloqueante que se muestra mientras se crea el punto de restauración
    automático antes de aplicar cambios al sistema. */
export function RestoreOverlay() {
  const show = useStore((s) => s.creatingRestorePoint);
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
            className="glass-strong rounded-2xl p-7 w-[360px] max-w-[90vw] text-center shadow-2xl shadow-black/40"
          >
            <div className="relative grid place-items-center w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-2xl accent-gradient opacity-20" />
              <ShieldCheck size={32} className="text-[var(--color-accent)]" />
            </div>
            <h3 className="font-semibold text-lg">Creando punto de restauración</h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-1.5 leading-snug">
              Por tu seguridad, hacemos una copia del sistema antes de aplicar cambios.
              Esto puede tardar unos segundos…
            </p>
            <Loader2
              size={22}
              className="animate-spin-slow text-[var(--color-accent)] mx-auto mt-4"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
