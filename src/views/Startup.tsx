import { useEffect, useMemo, useState } from "react";
import { Rocket, Power } from "lucide-react";
import {
  Badge,
  Card,
  CenterSpinner,
  EmptyState,
  PageHeader,
  SearchInput,
  Toggle,
} from "../components/ui";
import { useStore, useT } from "../store";
import { listStartup, setStartup, type StartupItem } from "../lib/tauri";

export function Startup() {
  const t = useT();
  const pushToast = useStore((s) => s.pushToast);
  const logAction = useStore((s) => s.logAction);
  const [items, setItems] = useState<StartupItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await listStartup());
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
    () => items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase())),
    [items, query],
  );

  const toggle = async (item: StartupItem, enable: boolean) => {
    const key = item.location + item.name;
    setBusy(key);
    setItems((prev) =>
      prev.map((x) => (x.name === item.name && x.location === item.location ? { ...x, enabled: enable } : x)),
    );
    try {
      const msg = await setStartup(item.name, item.location, enable);
      pushToast(msg, "success");
      await logAction({ kind: "startup", label: `Inicio ${enable ? "activado" : "desactivado"}: ${item.name}`, can_undo: false });
    } catch (e) {
      setItems((prev) =>
        prev.map((x) =>
          x.name === item.name && x.location === item.location ? { ...x, enabled: !enable } : x,
        ),
      );
      pushToast(String(e), "error");
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <CenterSpinner label={t("common.loading")} />;

  return (
    <div>
      <PageHeader icon={Rocket} title={t("startup.title")} subtitle={t("startup.subtitle")} />

      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder={t("common.search")} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Power} label={t("common.empty")} />
      ) : (
        <Card className="divide-y divide-[var(--color-border)]">
          {filtered.map((item) => (
            <div key={item.location + item.name} className="flex items-center gap-3.5 p-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <Badge tone="muted">{item.location}</Badge>
                </div>
                <p className="text-xs text-[var(--color-text-dim)] truncate">{item.command}</p>
              </div>
              <Toggle
                checked={item.enabled}
                disabled={busy === item.location + item.name}
                onChange={(v) => toggle(item, v)}
              />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
