import { useEffect, useMemo, useState } from "react";
import { PackageX, Box, Loader2 } from "lucide-react";
import {
  Button,
  Card,
  CenterSpinner,
  Checkbox,
  EmptyState,
  PageHeader,
  SearchInput,
} from "../components/ui";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useStore, useT } from "../store";
import { listPrograms, uninstallProgram, type Program } from "../lib/tauri";

export function Uninstall() {
  const t = useT();
  const pushToast = useStore((s) => s.pushToast);
  const showBusy = useStore((s) => s.showBusy);
  const updateBusy = useStore((s) => s.updateBusy);
  const hideBusy = useStore((s) => s.hideBusy);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setPrograms(await listPrograms());
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () =>
      programs.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.publisher.toLowerCase().includes(query.toLowerCase()),
      ),
    [programs, query],
  );

  const toggle = (id: string) =>
    setSel((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const doUninstall = async () => {
    setConfirm(false);
    const targets = programs.filter((p) => sel.has(p.id));
    showBusy(t("uninstall.title"), `Desinstalando ${targets.length} programa${targets.length !== 1 ? "s" : ""}…`);
    let ok = 0;
    for (let i = 0; i < targets.length; i++) {
      const p = targets[i];
      setBusyId(p.id);
      updateBusy(`${p.name} (${i + 1}/${targets.length})`);
      try {
        await uninstallProgram(p.id, p.source);
        setPrograms((prev) => prev.filter((x) => x.id !== p.id));
        ok++;
      } catch (e) {
        pushToast(`${p.name}: ${e}`, "error");
      }
    }
    setBusyId(null);
    hideBusy();
    setSel(new Set());
    pushToast(`${ok}/${targets.length} ${t("common.done").toLowerCase()}`, ok ? "success" : "error");
  };

  if (loading) return <CenterSpinner label={t("common.loading")} />;

  return (
    <div>
      <PageHeader icon={PackageX} title={t("uninstall.title")} subtitle={t("uninstall.subtitle")} />

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <SearchInput value={query} onChange={setQuery} placeholder={t("common.search")} />
        </div>
        <Button
          variant="danger"
          icon={PackageX}
          disabled={sel.size === 0 || busyId !== null}
          loading={busyId !== null}
          onClick={() => setConfirm(true)}
        >
          {t("common.uninstallSelected")} ({sel.size})
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Box} label={t("common.empty")} />
      ) : (
        <Card className="divide-y divide-[var(--color-border)]">
          {filtered.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-3.5 p-3.5 cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <Checkbox checked={sel.has(p.id)} disabled={busyId !== null} onChange={() => toggle(p.id)} />
              <div className="grid place-items-center w-9 h-9 rounded-lg bg-white/6 shrink-0">
                {busyId === p.id ? (
                  <Loader2 size={16} className="animate-spin-slow text-[var(--color-accent)]" />
                ) : (
                  <Box size={17} className="text-[var(--color-text-muted)]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-[var(--color-text-dim)] truncate">
                  {[p.publisher, p.version].filter(Boolean).join(" · ")}
                </p>
              </div>
            </label>
          ))}
        </Card>
      )}

      <ConfirmDialog
        open={confirm}
        title={t("uninstall.confirm")}
        body={programs
          .filter((p) => sel.has(p.id))
          .slice(0, 8)
          .map((p) => p.name)
          .join(", ")}
        confirmLabel={t("common.uninstallSelected")}
        onConfirm={doUninstall}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
