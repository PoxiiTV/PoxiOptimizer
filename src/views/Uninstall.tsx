import { useEffect, useMemo, useState } from "react";
import { PackageX, Box, Loader2 } from "lucide-react";
import {
  Card,
  CenterSpinner,
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
  const [programs, setPrograms] = useState<Program[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [target, setTarget] = useState<Program | null>(null);

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

  const doUninstall = async () => {
    if (!target) return;
    const p = target;
    setTarget(null);
    setBusyId(p.id);
    try {
      const msg = await uninstallProgram(p.id, p.source);
      pushToast(`${p.name}: ${msg}`, "success");
      setPrograms((prev) => prev.filter((x) => x.id !== p.id));
    } catch (e) {
      pushToast(String(e), "error");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <CenterSpinner label={t("common.loading")} />;

  return (
    <div>
      <PageHeader icon={PackageX} title={t("uninstall.title")} subtitle={t("uninstall.subtitle")} />

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <SearchInput value={query} onChange={setQuery} placeholder={t("common.search")} />
        </div>
        <span className="text-xs text-[var(--color-text-dim)] tabular-nums">
          {filtered.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Box} label={t("common.empty")} />
      ) : (
        <Card className="divide-y divide-[var(--color-border)]">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center gap-3.5 p-3.5">
              <div className="grid place-items-center w-9 h-9 rounded-lg bg-white/6 shrink-0">
                <Box size={17} className="text-[var(--color-text-muted)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-[var(--color-text-dim)] truncate">
                  {[p.publisher, p.version].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button
                onClick={() => setTarget(p)}
                disabled={busyId === p.id}
                className="px-3 h-9 rounded-lg text-sm font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/12 transition-colors disabled:opacity-50 shrink-0 inline-flex items-center gap-2"
              >
                {busyId === p.id && <Loader2 size={14} className="animate-spin-slow" />}
                {t("uninstall.uninstall")}
              </button>
            </div>
          ))}
        </Card>
      )}

      <ConfirmDialog
        open={!!target}
        title={t("uninstall.confirm")}
        body={target?.name}
        confirmLabel={t("uninstall.uninstall")}
        onConfirm={doUninstall}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
