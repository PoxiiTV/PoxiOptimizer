import { motion } from "framer-motion";
import {
  Home,
  Gauge,
  Trash2,
  Download,
  PackageX,
  Sparkles,
  RefreshCcw,
  KeyRound,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useStore, useT, type View } from "../store";

interface Item {
  view: View;
  icon: LucideIcon;
  labelKey: string;
}

const GROUPS: { titleKey: string; items: Item[] }[] = [
  {
    titleKey: "nav.group.system",
    items: [
      { view: "dashboard", icon: Home, labelKey: "nav.dashboard" },
      { view: "optimize", icon: Gauge, labelKey: "nav.optimize" },
      { view: "cleanup", icon: Sparkles, labelKey: "nav.cleanup" },
    ],
  },
  {
    titleKey: "nav.group.apps",
    items: [
      { view: "debloat", icon: Trash2, labelKey: "nav.debloat" },
      { view: "install", icon: Download, labelKey: "nav.install" },
      { view: "uninstall", icon: PackageX, labelKey: "nav.uninstall" },
    ],
  },
  {
    titleKey: "nav.group.other",
    items: [
      { view: "wupdate", icon: RefreshCcw, labelKey: "nav.wupdate" },
      { view: "activate", icon: KeyRound, labelKey: "nav.activate" },
      { view: "settings", icon: Settings, labelKey: "nav.settings" },
    ],
  },
];

export function Sidebar() {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const t = useT();

  return (
    <nav className="w-[228px] shrink-0 border-r border-[var(--color-border)] flex flex-col py-4 px-3 gap-5 overflow-y-auto">
      {GROUPS.map((group) => (
        <div key={group.titleKey}>
          <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
            {t(group.titleKey)}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = view === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => setView(item.view)}
                  className={`relative flex items-center gap-3 px-3 h-10 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "text-white"
                      : "text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface)]"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      transition={{ type: "spring", stiffness: 500, damping: 36 }}
                      className="absolute inset-0 rounded-xl accent-gradient opacity-90 shadow-lg shadow-[#6d8bff]/20"
                    />
                  )}
                  <item.icon
                    size={18}
                    strokeWidth={2.1}
                    className="relative z-10 shrink-0"
                  />
                  <span className="relative z-10">{t(item.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
