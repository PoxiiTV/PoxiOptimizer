import { create } from "zustand";
import { translate, type Lang } from "./lib/i18n";
import {
  getSystemInfo,
  getActivationStatus,
  isAdmin,
  type SystemInfo,
  type ActivationStatus,
} from "./lib/tauri";

export type View =
  | "dashboard"
  | "optimize"
  | "debloat"
  | "install"
  | "uninstall"
  | "cleanup"
  | "activate"
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
}));

/** Hook de traducción ligado al idioma actual del store. */
export function useT() {
  const lang = useStore((s) => s.lang);
  return (key: string) => translate(lang, key);
}
