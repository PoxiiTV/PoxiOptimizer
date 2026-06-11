import { motion } from "framer-motion";
import { Check, Loader2, Search, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/* ---------------- Encabezado de sección ---------------- */
export function PageHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3.5 mb-6">
      <div className="grid place-items-center w-11 h-11 rounded-xl accent-gradient shrink-0 shadow-lg shadow-[#6d8bff]/20">
        <Icon size={22} className="text-white" strokeWidth={2.2} />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5 max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------------- Tarjeta glass ---------------- */
export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`glass rounded-2xl ${
        hover ? "transition-colors hover:bg-[var(--color-surface-hover)]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------------- Botón primario (gradiente) ---------------- */
export function Button({
  children,
  onClick,
  disabled,
  loading,
  variant = "primary",
  icon: Icon,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "ghost" | "danger" | "success";
  icon?: LucideIcon;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 px-4 h-10 rounded-xl text-sm font-medium select-none transition-all disabled:opacity-40 disabled:cursor-not-allowed";
  const styles = {
    primary:
      "accent-gradient text-white shadow-lg shadow-[#6d8bff]/25 hover:shadow-[#6d8bff]/40",
    ghost:
      "glass text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]",
    danger: "bg-[var(--color-danger)]/90 text-white hover:bg-[var(--color-danger)]",
    success: "bg-[var(--color-success)]/90 text-white hover:bg-[var(--color-success)]",
  }[variant];

  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${styles} ${className}`}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin-slow" />
      ) : (
        Icon && <Icon size={16} strokeWidth={2.2} />
      )}
      {children}
    </motion.button>
  );
}

/* ---------------- Toggle switch ---------------- */
export function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-[46px] h-[26px] rounded-full shrink-0 transition-colors disabled:opacity-40 ${
        checked ? "accent-gradient" : "bg-white/12"
      }`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 600, damping: 32 }}
        className="absolute top-[3px] w-5 h-5 rounded-full bg-white shadow-md"
        style={{ left: checked ? "23px" : "3px" }}
      />
    </button>
  );
}

/* ---------------- Checkbox ---------------- */
export function Checkbox({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`grid place-items-center w-5 h-5 rounded-md border transition-all shrink-0 disabled:opacity-30 ${
        checked
          ? "accent-gradient border-transparent"
          : "border-white/25 hover:border-white/45"
      }`}
    >
      {checked && <Check size={13} className="text-white" strokeWidth={3} />}
    </button>
  );
}

/* ---------------- Badge ---------------- */
export function Badge({
  children,
  tone = "accent",
}: {
  children: ReactNode;
  tone?: "accent" | "success" | "danger" | "muted";
}) {
  const tones = {
    accent: "bg-[var(--color-accent-soft)] text-[#aab6ff]",
    success: "bg-[var(--color-success)]/15 text-[var(--color-success)]",
    danger: "bg-[var(--color-danger)]/15 text-[var(--color-danger)]",
    muted: "bg-white/8 text-[var(--color-text-muted)]",
  }[tone];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${tones}`}
    >
      {children}
    </span>
  );
}

/* ---------------- Buscador ---------------- */
export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search
        size={16}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="glass w-full h-10 rounded-xl pl-10 pr-4 text-sm outline-none placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-accent)]/60 transition-colors"
      />
    </div>
  );
}

/* ---------------- Spinner pantalla ---------------- */
export function CenterSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--color-text-muted)]">
      <Loader2 size={28} className="animate-spin-slow text-[var(--color-accent)]" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

/* ---------------- Estado vacío ---------------- */
export function EmptyState({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--color-text-dim)]">
      <Icon size={40} strokeWidth={1.5} />
      <span className="text-sm">{label}</span>
    </div>
  );
}
