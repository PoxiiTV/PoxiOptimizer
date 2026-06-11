import { create } from "zustand";
import { translate, type Lang } from "./lib/i18n";
import {
  getSystemInfo,
  getActivationStatus,
  isAdmin,
  createRestorePoint,
  createRegistryBackup,
  logAction as tauriLogAction,
  type SystemInfo,
  type ActivationStatus,
  type LogEntry,
} from "./lib/tauri";

export type View =
  | "dashboard"
  | "postformat"
  | "optimize"
  | "debloat"
  | "install"
  | "uninstall"
  | "cleanup"
  | "repair"
  | "startup"
  | "network"
  | "wupdate"
  | "activate"
  | "hosts"
  | "settings";

export interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface AppState {
  lang: Lang;
  view: View;
  toasts: Toast[];
  isAdmin: boolean;
  // Datos del sistema cacheados (se cargan una vez por sesión).
  systemInfo: SystemInfo | null;
  activation: ActivationStatus | null;
  systemLoaded: boolean;
  setLang: (lang: Lang) => void;
  setView: (view: View) => void;
  setAdmin: (v: boolean) => void;
  pushToast: (message: string, type?: Toast["type"]) => void;
  dismissToast: (id: number) => void;
  loadSystem: (force?: boolean) => void;
  // Punto de restauración + backup de registro (seguridad antes de optimizar/limpiar)
  restorePointDone: boolean;
  registryBackupDone: boolean;
  prepareStep: "restore" | "backup" | null;
  ensureRestorePoint: () => Promise<boolean>;
  // Historial de acciones
  logAction: (entry: Omit<LogEntry, "id" | "timestamp">) => Promise<void>;
}

const storedLang = (localStorage.getItem("poxi.lang") as Lang) || "es";

let toastSeq = 0;

export const useStore = create<AppState>((set, get) => ({
  lang: storedLang,
  view: "dashboard",
  toasts: [],
  isAdmin: true,
  systemInfo: null,
  activation: null,
  systemLoaded: false,
  setLang: (lang) => {
    localStorage.setItem("poxi.lang", lang);
    set({ lang });
  },
  setView: (view) => set({ view }),
  setAdmin: (isAdmin) => set({ isAdmin }),
  pushToast: (message, type = "info") => {
    const id = ++toastSeq;
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => get().dismissToast(id), 4200);
  },
  dismissToast: (id) =>
    set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  loadSystem: (force = false) => {
    if (get().systemLoaded && !force) return;
    set({ systemLoaded: true });
    // Cada dato se actualiza por separado en cuanto llega; la consulta de
    // activación es lenta (WMI) y no debe retrasar al resto.
    isAdmin().then((v) => set({ isAdmin: v })).catch(() => {});
    getSystemInfo().then((i) => set({ systemInfo: i })).catch(() => {});
    getActivationStatus().then((a) => set({ activation: a })).catch(() => {});
  },
  restorePointDone: false,
  registryBackupDone: false,
  prepareStep: null,
  ensureRestorePoint: async () => {
    if (get().restorePointDone && get().registryBackupDone) return true;

    // — Paso 1: Punto de restauración —
    if (!get().restorePointDone) {
      set({ prepareStep: "restore" });
      try {
        await createRestorePoint("PoxiOptimizer - antes de optimizar");
        set({ restorePointDone: true });
        get().pushToast("Punto de restauración creado ✅", "success");
      } catch {
        set({ restorePointDone: true });
        get().pushToast(
          "No se pudo crear el punto de restauración (System Restore puede estar desactivado). Continúa con cuidado.",
          "error",
        );
      }
    }

    // — Paso 2: Backup del registro —
    if (!get().registryBackupDone) {
      set({ prepareStep: "backup" });
      try {
        const path = await createRegistryBackup();
        const filename = path.split("\\").pop() ?? path;
        set({ registryBackupDone: true });
        get().pushToast(`Backup del registro guardado: ${filename} ✅`, "success");
        await tauriLogAction({
          id: `${Date.now()}-regbak`,
          timestamp: new Date().toISOString(),
          kind: "reg_backup",
          label: `Backup del registro creado: ${filename}`,
          can_undo: false,
        });
      } catch {
        set({ registryBackupDone: true });
        get().pushToast(
          "No se pudo crear el backup del registro. Continúa con precaución.",
          "error",
        );
      }
    }

    set({ prepareStep: null });
    return true;
  },
  logAction: async (partial) => {
    const entry: LogEntry = {
      ...partial,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    try {
      await tauriLogAction(entry);
    } catch {
      // El historial no debe romper el flujo principal
    }
  },
}));

/** Hook de traducción ligado al idioma actual del store. */
export function useT() {
  const lang = useStore((s) => s.lang);
  return (key: string) => translate(lang, key);
}
