import { create } from "zustand";
import { translate, type Lang } from "./lib/i18n";

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
  setLang: (lang: Lang) => void;
  setView: (view: View) => void;
  setAdmin: (v: boolean) => void;
  pushToast: (message: string, type?: Toast["type"]) => void;
  dismissToast: (id: number) => void;
}

const storedLang = (localStorage.getItem("poxi.lang") as Lang) || "es";

let toastSeq = 0;

export const useStore = create<AppState>((set, get) => ({
  lang: storedLang,
  view: "dashboard",
  toasts: [],
  isAdmin: true,
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
}));

/** Hook de traducción ligado al idioma actual del store. */
export function useT() {
  const lang = useStore((s) => s.lang);
  return (key: string) => translate(lang, key);
}
