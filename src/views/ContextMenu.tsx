import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MousePointer2,
  Monitor,
  Trash2,
  Wifi,
  Zap,
  Wrench,
  CheckCircle2,
  XCircle,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Card, PageHeader } from "../components/ui";
import { useStore, useT } from "../store";
import {
  contextMenuInstalled,
  installContextMenu,
  uninstallContextMenu,
} from "../lib/tauri";

interface ToolItem {
  emoji: string;
  name: string;
  desc: string;
}

interface ToolGroup {
  categoryKey: string;
  color: string;
  icon: LucideIcon;
  items: ToolItem[];
}

const TOOL_GROUPS: ToolGroup[] = [
  {
    categoryKey: "cm.cat.system",
    color: "var(--color-accent)",
    icon: Monitor,
    items: [
      { emoji: "↺", name: "Reiniciar Explorador", desc: "Reinicia explorer.exe sin cerrar sesión" },
      { emoji: "⊞", name: "Reconstruir caché de iconos", desc: "Elimina IconCache.db y reinicia el Explorador" },
      { emoji: "▦", name: "Limpiar caché de miniaturas", desc: "Elimina thumbcache_* y reinicia el Explorador" },
    ],
  },
  {
    categoryKey: "cm.cat.cleanup",
    color: "#f97316",
    icon: Trash2,
    items: [
      { emoji: "◈", name: "Liberar memoria", desc: "Fuerza GC y reduce el Working Set de los procesos" },
      { emoji: "✕", name: "Eliminar temporales", desc: "Borra %TEMP% y C:\\Windows\\Temp" },
      { emoji: "◯", name: "Vaciar papelera", desc: "Vacía la papelera sin confirmación" },
      { emoji: "◉", name: "Mostrar/ocultar archivos ocultos", desc: "Alterna la visibilidad de archivos ocultos" },
    ],
  },
  {
    categoryKey: "cm.cat.network",
    color: "#22c55e",
    icon: Wifi,
    items: [
      { emoji: "◎", name: "Vaciar caché DNS", desc: "ipconfig /flushdns" },
      { emoji: "⊡", name: "Copiar IP local", desc: "Copia la IP al portapapeles en silencio" },
      { emoji: "⟳", name: "Resetear adaptadores de red", desc: "Ejecuta netsh winsock/ip reset (requiere UAC)" },
    ],
  },
  {
    categoryKey: "cm.cat.power",
    color: "#a855f7",
    icon: Zap,
    items: [
      { emoji: "▣", name: "Apagar pantalla", desc: "Apaga el monitor sin bloquear la sesión" },
      { emoji: "◑", name: "Modo noche", desc: "Abre la configuración de luz nocturna" },
      { emoji: "⚡", name: "Plan de energía  ▶", desc: "Submenú: Alto rendimiento / Equilibrado / Ahorro" },
    ],
  },
  {
    categoryKey: "cm.cat.tools",
    color: "#f59e0b",
    icon: Wrench,
    items: [
      { emoji: "▤", name: "Administrador de tareas", desc: "Lanza taskmgr.exe" },
      { emoji: "◧", name: "Editor de Registro", desc: "Lanza regedit.exe" },
      { emoji: "▷", name: "PowerShell como admin", desc: "Abre una consola elevada" },
      { emoji: "▸", name: "CMD como admin", desc: "Abre el símbolo del sistema elevado" },
      { emoji: "⚡", name: "Abrir PoxiOptimizer", desc: "Lanza PoxiOptimizer directamente" },
    ],
  },
];

function SectionHeader({
  icon: Icon,
  title,
  color,
}: {
  icon: LucideIcon;
  title: string;
  color: string;
}) {
  return (
    <p className="text-sm font-semibold mb-2 flex items-center gap-2.5">
      <span
        className="grid place-items-center w-7 h-7 rounded-lg shrink-0"
        style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
      >
        <Icon size={14} style={{ color }} />
      </span>
      {title}
    </p>
  );
}

export function ContextMenu() {
  const t = useT();
  const pushToast = useStore((s) => s.pushToast);
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    contextMenuInstalled()
      .then(setInstalled)
      .catch(() => setInstalled(false));
  }, []);

  const toggle = async () => {
    setBusy(true);
    try {
      if (installed) {
        await uninstallContextMenu();
        setInstalled(false);
        pushToast(t("cm.removed"), "success");
      } else {
        await installContextMenu();
        setInstalled(true);
        pushToast(t("cm.installed"), "success");
      }
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const totalTools = TOOL_GROUPS.reduce((n, g) => n + g.items.length, 0);

  return (
    <div>
      <PageHeader icon={MousePointer2} title={t("cm.title")} subtitle={t("cm.subtitle")} />

      {/* Tarjeta de estado + toggle */}
      <Card className="p-0 mb-4 overflow-hidden">
        {/* Banda de estado */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div
                  className="grid place-items-center w-10 h-10 rounded-xl shrink-0"
                  style={{ background: "color-mix(in srgb, var(--color-accent) 18%, transparent)" }}
                >
                  <MousePointer2 size={20} style={{ color: "var(--color-accent)" }} />
                </div>
                <div>
                  <p className="font-semibold text-sm leading-tight">PoxiTools ⚡</p>
                  <p className="text-xs text-[var(--color-text-dim)]">
                    Clic derecho → submenú con {totalTools} herramientas
                  </p>
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mt-2">
                {t("cm.desc")}
              </p>
            </div>

            {/* Badge de estado */}
            <div className="shrink-0 mt-0.5">
              {installed === null ? (
                <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-dim)] px-3 py-1.5 rounded-full glass">
                  <Loader2 size={12} className="animate-spin" />
                  {t("cm.statusChecking")}
                </span>
              ) : installed ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: "color-mix(in srgb, var(--color-success) 15%, transparent)", color: "var(--color-success)" }}>
                  <CheckCircle2 size={13} />
                  {t("cm.statusActive")}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-dim)] px-3 py-1.5 rounded-full glass">
                  <XCircle size={13} />
                  {t("cm.statusInactive")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Botón de acción */}
        <div className="px-5 pb-5">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={toggle}
            disabled={busy || installed === null}
            className={`h-11 px-6 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 ${
              installed
                ? "glass hover:bg-[var(--color-surface-hover)]"
                : "accent-gradient text-white shadow-lg shadow-[#6d8bff]/30"
            }`}
          >
            {busy ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <MousePointer2 size={15} />
            )}
            {installed ? t("cm.deactivateBtn") : t("cm.activateBtn")}
          </motion.button>
        </div>
      </Card>

      {/* Lista de herramientas incluidas */}
      <Card className="p-5">
        <p className="text-sm font-semibold mb-4">{t("cm.tools")}</p>
        <div className="space-y-5">
          {TOOL_GROUPS.map((group) => (
            <div key={group.categoryKey}>
              <SectionHeader
                icon={group.icon}
                title={t(group.categoryKey)}
                color={group.color}
              />
              <div className="space-y-0.5 ml-1">
                {group.items.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    <span className="text-base w-6 text-center shrink-0 select-none">
                      {item.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{item.name}</p>
                      <p className="text-xs text-[var(--color-text-dim)] leading-tight mt-0.5 truncate">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
