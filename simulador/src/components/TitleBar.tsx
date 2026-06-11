import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X, Sparkles } from "lucide-react";

export function TitleBar() {
  const appWindow = getCurrentWindow();

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
        <span className="text-[10px] px-2 py-px rounded-md bg-[var(--color-warning)]/20 text-[var(--color-warning)] font-semibold tracking-wide">
          SIMULACIÓN
        </span>
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
