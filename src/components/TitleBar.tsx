import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X, Sparkles } from "lucide-react";
import { useStore } from "../store";

export function TitleBar() {
  const appWindow = getCurrentWindow();
  const isAdmin = useStore((s) => s.isAdmin);

  return (
    <div
      data-tauri-drag-region
      className="h-12 flex items-center justify-between px-4 shrink-0 border-b border-[var(--color-border)] select-none"
    >
      <div data-tauri-drag-region className="flex items-center gap-2.5 pointer-events-none">
        <div className="grid place-items-center w-7 h-7 rounded-lg accent-gradient">
          <Sparkles size={16} className="text-white" strokeWidth={2.4} />
        </div>
        <span className="font-semibold text-[15px] tracking-tight">
          Poxi<span className="text-gradient">Optimizer</span>
        </span>
        {isAdmin && (
          <span className="text-[10px] px-1.5 py-px rounded-md bg-white/8 text-[var(--color-text-dim)] font-medium">
            admin
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => appWindow.minimize()}
          className="grid place-items-center w-9 h-8 rounded-lg text-[var(--color-text-muted)] hover:bg-white/8 hover:text-white transition-colors"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={() => appWindow.toggleMaximize()}
          className="grid place-items-center w-9 h-8 rounded-lg text-[var(--color-text-muted)] hover:bg-white/8 hover:text-white transition-colors"
        >
          <Square size={13} />
        </button>
        <button
          onClick={() => appWindow.close()}
          className="grid place-items-center w-9 h-8 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-danger)] hover:text-white transition-colors"
        >
          <X size={17} />
        </button>
      </div>
    </div>
  );
}
