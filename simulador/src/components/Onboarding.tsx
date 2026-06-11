import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, ShieldCheck, Gauge, KeyRound, ArrowRight } from "lucide-react";
import { useT } from "../store";

const SEEN_KEY = "poxi.onboarded.v2";

/** Pantalla de bienvenida que aparece la primera vez que se abre la app. */
export function Onboarding() {
  const t = useT();
  const [open, setOpen] = useState(() => localStorage.getItem(SEEN_KEY) !== "1");
  const [step, setStep] = useState(0);

  const slides = [
    { icon: Sparkles, title: t("onb.1.title"), body: t("onb.1.body") },
    { icon: ShieldCheck, title: t("onb.2.title"), body: t("onb.2.body") },
    { icon: Gauge, title: t("onb.3.title"), body: t("onb.3.body") },
    { icon: KeyRound, title: t("onb.4.title"), body: t("onb.4.body") },
  ];

  const close = () => {
    localStorage.setItem(SEEN_KEY, "1");
    setOpen(false);
  };

  const next = () => (step < slides.length - 1 ? setStep((s) => s + 1) : close());
  const slide = slides[step];
  const Icon = slide.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] grid place-items-center bg-black/70 backdrop-blur-lg"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 14 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="glass-strong rounded-3xl p-8 w-[440px] max-w-[92vw] text-center shadow-2xl shadow-black/50"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="relative grid place-items-center w-20 h-20 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-3xl accent-gradient opacity-25 blur-xl" />
                  <div className="relative grid place-items-center w-20 h-20 rounded-3xl accent-gradient">
                    <Icon size={38} className="text-white" strokeWidth={2} />
                  </div>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight mb-2">{slide.title}</h2>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed px-2">
                  {slide.body}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Indicadores */}
            <div className="flex justify-center gap-1.5 mt-7 mb-6">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "w-6 accent-gradient" : "w-1.5 bg-white/15"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={close}
                className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors px-2"
              >
                {t("onb.skip")}
              </button>
              <button
                onClick={next}
                className="inline-flex items-center gap-2 accent-gradient text-white px-5 h-11 rounded-xl text-sm font-medium shadow-lg shadow-[#6d8bff]/25"
              >
                {step < slides.length - 1 ? t("onb.next") : t("onb.start")}
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
