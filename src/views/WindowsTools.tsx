import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wrench, ExternalLink } from "lucide-react";
import { CenterSpinner, PageHeader } from "../components/ui";
import { useStore, useT } from "../store";
import { getWindowsTools, openWindowsTool, type WinTool } from "../lib/tauri";

export function WindowsTools() {
  const t = useT();
  const pushToast = useStore((s) => s.pushToast);
  const [tools, setTools] = useState<WinTool[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWindowsTools()
      .then(setTools)
      .catch((e) => pushToast(String(e), "error"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = async (id: string) => {
    setBusy(id);
    try {
      await openWindowsTool(id);
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setTimeout(() => setBusy((b) => (b === id ? null : b)), 800);
    }
  };

  if (loading) return <CenterSpinner label={t("common.loading")} />;

  const categories = [...new Set(tools.map((tool) => tool.category))];

  return (
    <div>
      <PageHeader icon={Wrench} title={t("wintools.title")} subtitle={t("wintools.subtitle")} />

      {categories.map((cat) => (
        <div key={cat} className="mb-6">
          <p className="text-sm font-semibold text-[var(--color-text-muted)] mb-2.5">
            {t(`wintools.cat.${cat}`)}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {tools
              .filter((tool) => tool.category === cat)
              .map((tool) => (
                <motion.button
                  key={tool.id}
                  whileTap={{ scale: 0.96 }}
                  disabled={busy === tool.id}
                  onClick={() => open(tool.id)}
                  className="glass rounded-xl p-3.5 text-left hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-60 group flex flex-col gap-1.5 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm leading-snug">{tool.label}</p>
                    <ExternalLink
                      size={13}
                      className="text-[var(--color-text-dim)] shrink-0 mt-0.5 group-hover:text-[var(--color-accent)] transition-colors"
                    />
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] leading-snug line-clamp-2">
                    {tool.desc}
                  </p>
                </motion.button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
