import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Plus, Trash2, Shield, RotateCcw, Save, Info, Loader2 } from "lucide-react";
import { Badge, Button, Card, PageHeader } from "../components/ui";
import { useStore, useT } from "../store";
import { getHosts, setHosts, resetHosts } from "../lib/tauri";

interface HostEntry {
  id: string;
  enabled: boolean;
  ip: string;
  hostname: string;
  comment: string;
  isComment: boolean;
}

// Listado de dominios de telemetría de Microsoft para bloquear
const TELEMETRY_BLOCK: { ip: string; hostname: string; comment: string }[] = [
  { ip: "0.0.0.0", hostname: "telemetry.microsoft.com", comment: "MS telemetry" },
  { ip: "0.0.0.0", hostname: "vortex.data.microsoft.com", comment: "MS telemetry" },
  { ip: "0.0.0.0", hostname: "settings-win.data.microsoft.com", comment: "MS telemetry" },
  { ip: "0.0.0.0", hostname: "df.telemetry.microsoft.com", comment: "MS telemetry" },
  { ip: "0.0.0.0", hostname: "watson.telemetry.microsoft.com", comment: "MS Watson" },
  { ip: "0.0.0.0", hostname: "watson.ppe.telemetry.microsoft.com", comment: "MS Watson" },
  { ip: "0.0.0.0", hostname: "sqm.telemetry.microsoft.com", comment: "MS SQM" },
  { ip: "0.0.0.0", hostname: "sqm.microsoft.com", comment: "MS SQM" },
  { ip: "0.0.0.0", hostname: "feedback.windows.com", comment: "MS feedback" },
  { ip: "0.0.0.0", hostname: "msedge.api.cdp.microsoft.com", comment: "Edge telemetry" },
  { ip: "0.0.0.0", hostname: "telemetry.appex.bing.net", comment: "Bing telemetry" },
  { ip: "0.0.0.0", hostname: "i1.services.social.microsoft.com", comment: "MS social" },
  { ip: "0.0.0.0", hostname: "diagnostics.support.microsoft.com", comment: "MS diagnostics" },
];

function parseHosts(raw: string): HostEntry[] {
  return raw.split("\n").map((line, i) => {
    const trimmed = line.trim();
    const id = String(i);

    // Línea vacía o comentario puro
    if (!trimmed) {
      return { id, enabled: false, ip: "", hostname: "", comment: "", isComment: true };
    }

    // Intenta detectar entrada deshabilitada: "# IP hostname [# comment]"
    const disabledMatch = trimmed.match(
      /^#\s+((?:\d{1,3}\.){3}\d{1,3}|::1|::)\s+(\S+)(?:\s*#\s*(.*))?$/
    );
    if (disabledMatch) {
      return {
        id,
        enabled: false,
        ip: disabledMatch[1],
        hostname: disabledMatch[2],
        comment: disabledMatch[3] ?? "",
        isComment: false,
      };
    }

    // Comentario puro
    if (trimmed.startsWith("#")) {
      return { id, enabled: false, ip: "", hostname: "", comment: line, isComment: true };
    }

    // Entrada habilitada: "IP hostname [# comment]"
    const match = trimmed.match(
      /^((?:\d{1,3}\.){3}\d{1,3}|::1|::)\s+(\S+)(?:\s*#\s*(.*))?$/
    );
    if (match) {
      return {
        id,
        enabled: true,
        ip: match[1],
        hostname: match[2],
        comment: match[3] ?? "",
        isComment: false,
      };
    }

    return { id, enabled: false, ip: "", hostname: "", comment: line, isComment: true };
  });
}

function serializeHosts(entries: HostEntry[]): string {
  return entries
    .map((e) => {
      if (e.isComment) return e.comment;
      const cmt = e.comment ? ` # ${e.comment}` : "";
      const line = `${e.ip} ${e.hostname}${cmt}`;
      return e.enabled ? line : `# ${line}`;
    })
    .join("\n");
}

export function Hosts() {
  const t = useT();
  const pushToast = useStore((s) => s.pushToast);
  const logAction = useStore((s) => s.logAction);

  const [entries, setEntries] = useState<HostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Formulario para añadir entrada
  const [showAdd, setShowAdd] = useState(false);
  const [newIp, setNewIp] = useState("0.0.0.0");
  const [newHost, setNewHost] = useState("");
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    getHosts()
      .then((raw) => setEntries(parseHosts(raw)))
      .catch((e) => pushToast(String(e), "error"))
      .finally(() => setLoading(false));
  }, [pushToast]);

  const activeEntries = entries.filter((e) => !e.isComment);

  const toggleEntry = (id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e))
    );
    setDirty(true);
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setDirty(true);
  };

  const addEntry = () => {
    if (!newHost.trim() || !newIp.trim()) return;
    const id = `new-${Date.now()}`;
    setEntries((prev) => [
      ...prev,
      { id, enabled: true, ip: newIp.trim(), hostname: newHost.trim(), comment: newComment.trim(), isComment: false },
    ]);
    setNewHost("");
    setNewComment("");
    setShowAdd(false);
    setDirty(true);
  };

  const addTelemetryBlock = () => {
    const existing = new Set(entries.map((e) => e.hostname));
    const toAdd = TELEMETRY_BLOCK.filter((t) => !existing.has(t.hostname));
    if (toAdd.length === 0) {
      pushToast(t("hosts.telemetryAdded") + " (ya estaban)", "info");
      return;
    }
    const newEntries: HostEntry[] = toAdd.map((b, i) => ({
      id: `tel-${Date.now()}-${i}`,
      enabled: true,
      ip: b.ip,
      hostname: b.hostname,
      comment: b.comment,
      isComment: false,
    }));
    setEntries((prev) => [...prev, ...newEntries]);
    setDirty(true);
    pushToast(`${t("hosts.telemetryAdded")} (${toAdd.length})`, "success");
  };

  const doSave = async () => {
    setSaving(true);
    try {
      await setHosts(serializeHosts(entries));
      setDirty(false);
      pushToast(t("hosts.saved"), "success");
      await logAction({ kind: "hosts", label: "Archivo hosts guardado", can_undo: false });
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const doReset = async () => {
    if (!confirm(t("hosts.resetConfirm"))) return;
    setResetting(true);
    try {
      await resetHosts();
      const raw = await getHosts();
      setEntries(parseHosts(raw));
      setDirty(false);
      pushToast(t("hosts.saved"), "success");
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div>
      <PageHeader icon={Globe} title={t("hosts.title")} subtitle={t("hosts.subtitle")} />

      {/* Info */}
      <Card className="p-4 mb-4 flex items-start gap-3 border-[var(--color-accent)]/20">
        <Info size={16} className="text-[var(--color-accent)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{t("hosts.info")}</p>
      </Card>

      {/* Acciones rápidas */}
      <div className="flex flex-wrap gap-2.5 mb-5">
        <Button variant="ghost" icon={Shield} onClick={addTelemetryBlock}>
          {t("hosts.blockTelemetry")}
        </Button>
        <Button variant="ghost" icon={Plus} onClick={() => setShowAdd((v) => !v)}>
          {t("hosts.add")}
        </Button>
        <Button variant="ghost" icon={resetting ? Loader2 : RotateCcw} onClick={doReset} loading={resetting}>
          {t("hosts.reset")}
        </Button>
        {dirty && (
          <Button variant="primary" icon={saving ? Loader2 : Save} onClick={doSave} loading={saving}>
            {t("hosts.save")}
          </Button>
        )}
      </div>

      {/* Formulario añadir entrada */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-4 mb-4">
              <p className="text-sm font-semibold mb-3">{t("hosts.add")}</p>
              <div className="grid grid-cols-[120px_1fr_1fr] gap-2 mb-3">
                <input
                  className="glass rounded-xl px-3 py-2 text-sm bg-transparent border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)]"
                  placeholder={t("hosts.addIp")}
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                />
                <input
                  className="glass rounded-xl px-3 py-2 text-sm bg-transparent border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)]"
                  placeholder={t("hosts.addHost")}
                  value={newHost}
                  onChange={(e) => setNewHost(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addEntry()}
                />
                <input
                  className="glass rounded-xl px-3 py-2 text-sm bg-transparent border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)]"
                  placeholder={t("hosts.addComment")}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addEntry()}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="primary" onClick={addEntry} disabled={!newHost.trim()}>
                  Añadir
                </Button>
                <Button variant="ghost" onClick={() => setShowAdd(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de entradas */}
      {loading ? (
        <p className="text-sm text-[var(--color-text-muted)] text-center py-10">{t("common.loading")}</p>
      ) : activeEntries.length === 0 ? (
        <Card className="p-8 text-center">
          <Globe size={32} className="mx-auto mb-3 text-[var(--color-text-dim)]" />
          <p className="text-sm text-[var(--color-text-muted)]">{t("hosts.noEntries")}</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Cabecera */}
          <div className="grid grid-cols-[40px_110px_1fr_1fr_40px] gap-2 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)] border-b border-[var(--color-border)]">
            <span></span>
            <span>IP</span>
            <span>Dominio</span>
            <span>Comentario</span>
            <span></span>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            <AnimatePresence initial={false}>
              {activeEntries.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`grid grid-cols-[40px_110px_1fr_1fr_40px] gap-2 px-4 py-3 items-center transition-colors ${
                    entry.enabled
                      ? "hover:bg-[var(--color-surface-hover)]"
                      : "opacity-50 hover:opacity-70"
                  }`}
                >
                  {/* Toggle */}
                  <button
                    onClick={() => toggleEntry(entry.id)}
                    className={`w-8 h-5 rounded-full transition-all relative shrink-0 ${
                      entry.enabled ? "accent-gradient" : "bg-[var(--color-surface)]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        entry.enabled ? "translate-x-3" : "translate-x-0.5"
                      }`}
                    />
                  </button>

                  <span className="text-xs font-mono text-[var(--color-text-muted)] truncate">{entry.ip}</span>
                  <span className="text-sm font-medium truncate">{entry.hostname}</span>
                  <span className="text-xs text-[var(--color-text-dim)] truncate">{entry.comment}</span>

                  {/* Borrar */}
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-[var(--color-text-dim)] hover:text-[var(--color-danger)] transition-colors p-1 rounded-lg hover:bg-[var(--color-danger)]/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      )}

      {/* Total + estado guardado */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-[var(--color-text-dim)]">
          {activeEntries.filter((e) => e.enabled).length} activas · {activeEntries.filter((e) => !e.enabled).length} desactivadas
        </p>
        {dirty && (
          <Badge tone="danger">Cambios sin guardar</Badge>
        )}
      </div>
    </div>
  );
}
