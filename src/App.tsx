import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TitleBar } from "./components/TitleBar";
import { Sidebar } from "./components/Sidebar";
import { Toasts } from "./components/Toasts";
import { RestoreOverlay } from "./components/RestoreOverlay";
import { Onboarding } from "./components/Onboarding";
import { useStore } from "./store";

import { Dashboard } from "./views/Dashboard";
import { PostFormat } from "./views/PostFormat";
import { Optimize } from "./views/Optimize";
import { Debloat } from "./views/Debloat";
import { Install } from "./views/Install";
import { Uninstall } from "./views/Uninstall";
import { Cleanup } from "./views/Cleanup";
import { Repair } from "./views/Repair";
import { Startup } from "./views/Startup";
import { Network } from "./views/Network";
import { WindowsUpdate } from "./views/WindowsUpdate";
import { Activate } from "./views/Activate";
import { Settings } from "./views/Settings";
import { Hosts } from "./views/Hosts";

const VIEWS = {
  dashboard: Dashboard,
  postformat: PostFormat,
  optimize: Optimize,
  debloat: Debloat,
  install: Install,
  uninstall: Uninstall,
  cleanup: Cleanup,
  repair: Repair,
  startup: Startup,
  network: Network,
  wupdate: WindowsUpdate,
  activate: Activate,
  hosts: Hosts,
  settings: Settings,
};

export default function App() {
  const view = useStore((s) => s.view);
  const loadSystem = useStore((s) => s.loadSystem);
  const ViewComponent = VIEWS[view];

  useEffect(() => {
    loadSystem();
  }, [loadSystem]);

  return (
    <div className="relative h-full w-full flex flex-col text-[var(--color-text)] overflow-hidden">
      {/* Fondo: degradado + orbes difuminados */}
      <div className="absolute inset-0 -z-10 bg-[#0a0c1a]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(1100px 600px at 12% -8%, #1c2150 0%, transparent 55%), radial-gradient(900px 700px at 100% 110%, #2a1850 0%, transparent 55%), linear-gradient(160deg, #0a0c1a 0%, #0d1024 100%)",
          }}
        />
        <div
          className="absolute w-[420px] h-[420px] rounded-full blur-[120px] opacity-30"
          style={{
            background: "#5b7cfa",
            top: "-80px",
            left: "20%",
            animation: "float-orb 14s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[380px] h-[380px] rounded-full blur-[120px] opacity-25"
          style={{
            background: "#a06bff",
            bottom: "-60px",
            right: "8%",
            animation: "float-orb 18s ease-in-out infinite reverse",
          }}
        />
      </div>

      <TitleBar />

      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="p-7 max-w-5xl mx-auto"
            >
              <ViewComponent />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Toasts />
      <RestoreOverlay />
      <Onboarding />
    </div>
  );
}
