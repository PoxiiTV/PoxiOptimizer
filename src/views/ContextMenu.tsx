import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Check,
  Save,
  type LucideIcon,
} from "lucide-react";
import { Card, PageHeader } from "../components/ui";
import { useStore, useT } from "../store";
import {
  contextMenuInstalled,
  installContextMenu,
  uninstallContextMenu,
  getClassicContextMenu,
  setClassicContextMenu,
} from "../lib/tauri";

interface ToolItem {
  id: string;
  emoji: string;
  name: string;
  desc: string;
}

interface ToolGroup {
  categoryKey: string;
  color: string;
  icon: LucideIcon;
  items: ToolItem[];
  menu: 1 | 2; // a qué entrada del menú contextual pertenece
}

const TOOL_GROUPS: ToolGroup[] = [
  {
    categoryKey: "cm.cat.system",
    color: "var(--color-accent)",
    icon: Monitor,
    menu: 1,
    items: [
      { id: "01_RestartExplorer", emoji: "🔄", name: "Reiniciar Explorador",        desc: "Reinicia explorer.exe sin cerrar sesión" },
      { id: "02_RebuildIcons",    emoji: "🖼️", name: "Reconstruir caché de iconos", desc: "Elimina IconCache.db y reinicia el Explorador" },
      { id: "03_ClearThumbs",     emoji: "🗂️", name: "Limpiar caché de miniaturas", desc: "Elimina thumbcache_* y reinicia el Explorador" },
    ],
  },
  {
    categoryKey: "cm.cat.cleanup",
    color: "#f97316",
    icon: Trash2,
    menu: 1,
    items: [
      { id: "04_FreeMemory",     emoji: "🧹", name: "Liberar memoria",              desc: "Fuerza GC y reduce el Working Set de los procesos" },
      { id: "05_DeleteTemp",     emoji: "🗑️", name: "Eliminar temporales",          desc: "Borra %TEMP% y C:\\Windows\\Temp" },
      { id: "06_EmptyRecycleBin",emoji: "♻️", name: "Vaciar papelera",              desc: "Vacía la papelera sin confirmación" },
      { id: "07_ToggleHidden",   emoji: "👁️", name: "Mostrar/ocultar ocultos",      desc: "Alterna la visibilidad de archivos ocultos" },
    ],
  },
  {
    categoryKey: "cm.cat.network",
    color: "#22c55e",
    icon: Wifi,
    menu: 1,
    items: [
      { id: "08_FlushDNS",     emoji: "🌐", name: "Vaciar caché DNS",           desc: "ipconfig /flushdns" },
      { id: "09_CopyIP",       emoji: "📋", name: "Copiar IP local",            desc: "Copia la IP al portapapeles" },
      { id: "10_ResetNetwork", emoji: "🔌", name: "Resetear adaptadores de red",desc: "netsh winsock/ip reset (requiere UAC)" },
      { id: "11_PingGoogle",   emoji: "📡", name: "Ping a Google",              desc: "Abre CMD y hace ping a 8.8.8.8" },
    ],
  },
  {
    categoryKey: "cm.cat.power",
    color: "#a855f7",
    icon: Zap,
    menu: 2,
    items: [
      { id: "12_TurnOffScreen", emoji: "🖥️", name: "Apagar pantalla",     desc: "Apaga el monitor sin bloquear la sesión" },
      { id: "13_NightLight",    emoji: "🌙", name: "Modo noche",           desc: "Abre la configuración de luz nocturna" },
      { id: "14_LockScreen",    emoji: "🔒", name: "Bloquear pantalla",    desc: "Bloquea la sesión al instante (Win+L)" },
      { id: "15_PowerPlan",     emoji: "⚡", name: "Plan de energía  ▶",  desc: "Submenú: Alto rendimiento / Equilibrado / Ahorro" },
    ],
  },
  {
    categoryKey: "cm.cat.tools",
    color: "#f59e0b",
    icon: Wrench,
    menu: 2,
    items: [
      { id: "16_TaskMgr",       emoji: "📊", name: "Administrador de tareas",       desc: "Lanza taskmgr.exe" },
      { id: "17_RegEdit",       emoji: "📝", name: "Editor de Registro",            desc: "Lanza regedit.exe" },
      { id: "18_PsAdmin",       emoji: "💻", name: "PowerShell como admin",         desc: "Abre una consola elevada" },
      { id: "19_CmdAdmin",      emoji: "⌨️", name: "CMD como admin",               desc: "Abre el símbolo del sistema elevado" },
      { id: "20_DevMgmt",       emoji: "⚙️", name: "Administrador de dispositivos", desc: "devmgmt.msc — drivers y hardware" },
      { id: "21_Msconfig",      emoji: "🔧", name: "Configuración del sistema",     desc: "msconfig — inicio, servicios, arranque" },
      { id: "22_PoxiOptimizer", emoji: "⚡", name: "Abrir PoxiOptimizer",          desc: "Lanza PoxiOptimizer directamente" },
    ],
  },
];

const ALL_IDS = TOOL_GROUPS.flatMap((g) => g.items.map((i) => i.id));
const LS_KEY  = "poxitools_enabled_items";

function loadEnabled(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {}
  return new Set(ALL_IDS);
}

function SectionHeader({ icon: Icon, title, color }: { icon: LucideIcon; title: string; color: string }) {
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
  const t        = useT();
  const pushToast = useStore((s) => s.pushToast);

  const [installed,     setInstalled]     = useState<boolean | null>(null);
  const [busy,          setBusy]          = useState(false);
  const [enabled,       setEnabled]       = useState<Set<string>>(loadEnabled);
  const [dirty,         setDirty]         = useState(false);
  const [classicMenu,   setClassicMenu]   = useState<boolean | null>(null);
  const [classicBusy,   setClassicBusy]   = useState(false);

  useEffect(() => {
    contextMenuInstalled()
      .then(setInstalled)
      .catch(() => setInstalled(false));
    getClassicContextMenu()
      .then(setClassicMenu)
      .catch(() => setClassicMenu(false));
  }, []);

  const toggleClassicMenu = async () => {
    setClassicBusy(true);
    try {
      const next = !classicMenu;
      await setClassicContextMenu(next);
      setClassicMenu(next);
      pushToast(
        next ? "Menú clásico activado · Explorer reiniciado" : "Menú moderno de W11 restaurado",
        "success"
      );
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setClassicBusy(false);
    }
  };

  const toggle = async () => {
    setBusy(true);
    try {
      if (installed) {
        await uninstallContextMenu();
        setInstalled(false);
        pushToast(t("cm.removed"), "success");
      } else {
        const ids = Array.from(enabled);
        localStorage.setItem(LS_KEY, JSON.stringify(ids));
        await installContextMenu(ids);
        setInstalled(true);
        setDirty(false);
        pushToast(t("cm.installed"), "success");
      }
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const toggleItem = (id: string) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setDirty(true);
  };

  const toggleAll = () => {
    const allOn = enabled.size === ALL_IDS.length;
    setEnabled(allOn ? new Set() : new Set(ALL_IDS));
    setDirty(true);
  };

  const saveConfig = async () => {
    const ids = Array.from(enabled);
    localStorage.setItem(LS_KEY, JSON.stringify(ids));
    if (!installed) {
      setDirty(false);
      pushToast("Preferencias guardadas", "success");
      return;
    }
    setBusy(true);
    try {
      await installContextMenu(ids);
      setDirty(false);
      pushToast("Menú actualizado correctamente", "success");
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const totalEnabled = enabled.size;
  const allOn        = totalEnabled === ALL_IDS.length;

  return (
    <div>
      <PageHeader icon={MousePointer2} title={t("cm.title")} subtitle={t("cm.subtitle")} />

      {/* Tarjeta: menú clásico de Windows */}
      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">Menú clásico de Windows</p>
            <p className="text-xs text-[var(--color-text-dim)] mt-0.5 leading-relaxed">
              Desactiva el menú moderno de W11 y muestra siempre el clásico.
              <span className="block mt-0.5 text-[var(--color-text-muted)]">
                PoxiTools solo aparece en el menú clásico — activa esto para verlo siempre sin "Mostrar más opciones".
              </span>
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleClassicMenu}
            disabled={classicBusy || classicMenu === null}
            className="shrink-0 relative w-11 h-6 rounded-full transition-colors duration-200 disabled:opacity-40 focus:outline-none"
            style={{
              background: classicMenu
                ? "var(--color-accent)"
                : "var(--color-border)",
            }}
            aria-label="Toggle menú clásico"
          >
            {classicBusy ? (
              <Loader2
                size={12}
                className="absolute inset-0 m-auto animate-spin text-white"
              />
            ) : (
              <motion.span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
                animate={{ x: classicMenu ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        </div>
      </Card>

      {/* Tarjeta de estado */}
      <Card className="p-0 mb-4 overflow-hidden">
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
                    2 submenús · {ALL_IDS.length} herramientas en el clic derecho
                  </p>
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mt-2">
                {t("cm.desc")}
              </p>
            </div>

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
            {busy ? <Loader2 size={15} className="animate-spin" /> : <MousePointer2 size={15} />}
            {installed ? t("cm.deactivateBtn") : t("cm.activateBtn")}
          </motion.button>
        </div>
      </Card>

      {/* Tarjeta de personalización */}
      <Card className="p-5">
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold">{t("cm.tools")}</p>
          <button
            onClick={toggleAll}
            className="text-xs text-[var(--color-accent)] hover:underline transition-opacity"
          >
            {allOn ? "Desmarcar todo" : "Marcar todo"}
          </button>
        </div>

        {/* Lista de herramientas */}
        <div className="space-y-5">
          {TOOL_GROUPS.map((group, i) => (
            <div key={group.categoryKey}>
              {/* Separador entre menú 1 y menú 2 */}
              {i > 0 && TOOL_GROUPS[i - 1].menu !== group.menu && (
                <div className="flex items-center gap-3 mb-5 -mt-1">
                  <div className="h-px flex-1 bg-[var(--color-border)]" />
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-[var(--color-text-dim)] px-2 py-0.5 rounded glass">
                    PoxiTools ⚡ · Utilidades
                  </span>
                  <div className="h-px flex-1 bg-[var(--color-border)]" />
                </div>
              )}
              {i === 0 && (
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-[var(--color-text-dim)] px-2 py-0.5 rounded glass">
                    PoxiTools ⚡ · Sistema
                  </span>
                  <div className="h-px flex-1 bg-[var(--color-border)]" />
                </div>
              )}
              <SectionHeader icon={group.icon} title={t(group.categoryKey)} color={group.color} />
              <div className="space-y-0.5 ml-1">
                {group.items.map((item) => {
                  const on = enabled.has(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors text-left"
                    >
                      <span className="text-base w-6 text-center shrink-0 select-none">
                        {item.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium leading-tight transition-opacity ${on ? "" : "opacity-40"}`}>
                          {item.name}
                        </p>
                        <p className={`text-xs text-[var(--color-text-dim)] leading-tight mt-0.5 truncate transition-opacity ${on ? "" : "opacity-30"}`}>
                          {item.desc}
                        </p>
                      </div>
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all ${
                          on
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                            : "border-[var(--color-border)]"
                        }`}
                      >
                        <AnimatePresence>
                          {on && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ duration: 0.12 }}
                            >
                              <Check size={11} className="text-white" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer: contador + botón guardar */}
        <div className="mt-5 pt-4 border-t border-[var(--color-border)] flex items-center justify-between gap-4">
          <p className="text-xs text-[var(--color-text-dim)]">
            <span className="font-semibold text-[var(--color-text)]">{totalEnabled}</span>
            {" / "}{ALL_IDS.length} herramientas activadas
          </p>

          <AnimatePresence>
            {dirty && (
              <motion.button
                key="save"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                whileTap={{ scale: 0.97 }}
                onClick={saveConfig}
                disabled={busy}
                className="accent-gradient text-white px-4 h-9 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-[#6d8bff]/25 disabled:opacity-50"
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {installed ? "Guardar y aplicar" : "Guardar preferencias"}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
