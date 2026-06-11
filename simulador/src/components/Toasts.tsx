import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import { useStore } from "../store";

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} as const;

const COLORS = {
  success: "text-[var(--color-success)]",
  error: "text-[var(--color-danger)]",
  info: "text-[var(--color-accent)]",
} as const;

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 w-[340px] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              onClick={() => dismiss(toast.id)}
              className="glass-strong rounded-xl px-4 py-3 flex items-start gap-3 shadow-xl shadow-black/30 pointer-events-auto cursor-pointer"
            >
              <Icon size={18} className={`${COLORS[toast.type]} shrink-0 mt-px`} />
              <span className="text-sm leading-snug">{toast.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
