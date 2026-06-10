import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui";
import { useT } from "../store";

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/55 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong rounded-2xl p-6 w-[380px] max-w-[90vw] shadow-2xl shadow-black/40"
          >
            <div className="grid place-items-center w-12 h-12 rounded-xl bg-[var(--color-danger)]/15 mb-4">
              <AlertTriangle className="text-[var(--color-danger)]" size={24} />
            </div>
            <h3 className="font-semibold text-lg">{title}</h3>
            {body && (
              <p className="text-sm text-[var(--color-text-muted)] mt-1.5 leading-snug">
                {body}
              </p>
            )}
            <div className="flex gap-2.5 mt-6">
              <Button variant="ghost" onClick={onCancel} className="flex-1">
                {t("common.cancel")}
              </Button>
              <Button
                variant={danger ? "danger" : "primary"}
                onClick={onConfirm}
                className="flex-1"
              >
                {confirmLabel ?? t("common.confirm")}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
