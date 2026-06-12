import { useEffect, useMemo, useState } from "react";
import { Trash2, PackageOpen, Lock } from "lucide-react";
import {
  Badge,
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
import { listAppx, removeAppx, type AppxItem } from "../lib/tauri";

export function Debloat() {
  const t = useT();
  const pushToast = useStore((s) => s.pushToast);
  const showBusy = useStore((s) => s.showBusy);
  const updateBusy = useStore((s) => s.updateBusy);
  const hideBusy = useStore((s) => s.hideBusy);
  const [apps, setApps] = useState<AppxItem[]>([]);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listAppx();
      setApps(list);
      // Preseleccionar bloatware recomendado.
      setSel(new Set(list.filter((a) => a.recommended).map((a) => a.name)));
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
      apps.filter((a) =>
        a.display.toLowerCase().includes(query.toLowerCase()) ||
        a.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [apps, query],
  );

  const toggle = (name: string) => {
    setSel((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const doRemove = async () => {
    setConfirm(false);
    setWorking(true);
    const targets = [...sel];
    showBusy(t("debloat.title"), `Eliminando ${targets.length} aplicación${targets.length !== 1 ? "es" : ""}…`);
    let ok = 0;
    for (let i = 0; i < targets.length; i++) {
      const name = targets[i];
      const display = apps.find((a) => a.name === name)?.display ?? name;
      updateBusy(`${display} (${i + 1}/${targets.length})`);
      try {
        await removeAppx(name);
        ok++;
      } catch {
        /* sigue */
      }
    }
    setWorking(false);
    hideBusy();
    setSel(new Set());
    pushToast(`${ok}/${targets.length} ${t("common.done").toLowerCase()}`, ok ? "success" : "error");
    load().catch(() => {});
  };

  if (loading) return <CenterSpinner label={t("common.loading")} />;

  return (
    <div>
      <PageHeader icon={Trash2} title={t("debloat.title")} subtitle={t("debloat.subtitle")} />

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <SearchInput value={query} onChange={setQuery} placeholder={t("common.search")} />
        </div>
        <Button
          variant="danger"
          icon={Trash2}
          disabled={sel.size === 0}
          loading={working}
          onClick={() => setConfirm(true)}
        >
          {t("debloat.removeSelected")} ({sel.size})
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={PackageOpen} label={t("common.empty")} />
      ) : (
        <Card className="divide-y divide-[var(--color-border)]">
          {filtered.map((app) => (
            <label
              key={app.name}
              className={`flex items-center gap-3.5 p-3.5 ${
                app.protected ? "opacity-55" : "cursor-pointer hover:bg-[var(--color-surface-hover)]"
              } transition-colors`}
            >
              <Checkbox
                checked={sel.has(app.name)}
                disabled={app.protected}
                onChange={() => toggle(app.name)}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{app.display}</p>
                <p className="text-xs text-[var(--color-text-dim)] truncate">{app.name}</p>
              </div>
              {app.protected ? (
                <Badge tone="muted">
                  <Lock size={10} className="mr-1" /> {t("common.protected")}
                </Badge>
              ) : app.recommended ? (
                <Badge tone="danger">{t("common.recommended")}</Badge>
              ) : null}
            </label>
          ))}
        </Card>
      )}

      <ConfirmDialog
        open={confirm}
        title={t("debloat.confirm")}
        body={[...sel].slice(0, 6).map((n) => apps.find((a) => a.name === n)?.display).join(", ")}
        confirmLabel={t("debloat.removeSelected")}
        onConfirm={doRemove}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
