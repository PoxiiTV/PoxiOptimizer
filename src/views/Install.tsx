import { useEffect, useMemo, useState } from "react";
import { Download, Check, Loader2, AlertTriangle } from "lucide-react";
import {
  Button,
  Card,
  Checkbox,
  PageHeader,
  SearchInput,
} from "../components/ui";
import { useStore, useT } from "../store";
import { wingetAvailable, installApp } from "../lib/tauri";
import { APPS, APP_CATEGORIES } from "../data/apps";

type Status = "idle" | "installing" | "done" | "error";

export function Install() {
  const t = useT();
  const pushToast = useStore((s) => s.pushToast);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [query, setQuery] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    wingetAvailable().then(setAvailable).catch(() => setAvailable(false));
  }, []);

  const filtered = useMemo(
    () =>
      APPS.filter(
        (a) =>
          a.name.toLowerCase().includes(query.toLowerCase()) ||
          a.desc.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  const byCat = useMemo(() => {
    return APP_CATEGORIES.map((cat) => ({
      cat,
      items: filtered.filter((a) => a.category === cat),
    })).filter((g) => g.items.length);
  }, [filtered]);

  const toggle = (id: string) =>
    setSel((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const installSelected = async () => {
    setWorking(true);
    const targets = [...sel];
    for (const id of targets) {
      setStatus((s) => ({ ...s, [id]: "installing" }));
      try {
        await installApp(id);
        setStatus((s) => ({ ...s, [id]: "done" }));
      } catch (e) {
        setStatus((s) => ({ ...s, [id]: "error" }));
        pushToast(String(e), "error");
      }
    }
    setWorking(false);
    setSel(new Set());
    pushToast(t("common.done"), "success");
  };

  return (
    <div>
      <PageHeader icon={Download} title={t("install.title")} subtitle={t("install.subtitle")} />

      {available === false && (
        <Card className="p-4 mb-4 flex items-center gap-3 border-[var(--color-warning)]/30">
          <AlertTriangle className="text-[var(--color-warning)] shrink-0" size={20} />
          <p className="text-sm text-[var(--color-text-muted)]">{t("install.noWinget")}</p>
        </Card>
      )}

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1">
          <SearchInput value={query} onChange={setQuery} placeholder={t("common.search")} />
        </div>
        <Button
          icon={Download}
          disabled={sel.size === 0 || available === false}
          loading={working}
          onClick={installSelected}
        >
          {t("install.installSelected")} ({sel.size})
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {byCat.map((group) => (
          <div key={group.cat}>
            <p className="text-sm font-semibold mb-2.5 text-[var(--color-text-muted)]">
              {group.cat}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {group.items.map((app) => {
                const st = status[app.id] ?? "idle";
                return (
                  <label
                    key={app.id}
                    className="glass rounded-xl p-3.5 flex items-center gap-3 cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    {st === "installing" ? (
                      <Loader2 size={20} className="animate-spin-slow text-[var(--color-accent)] shrink-0" />
                    ) : st === "done" ? (
                      <div className="grid place-items-center w-5 h-5 rounded-md bg-[var(--color-success)] shrink-0">
                        <Check size={13} className="text-white" strokeWidth={3} />
                      </div>
                    ) : (
                      <Checkbox checked={sel.has(app.id)} onChange={() => toggle(app.id)} />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{app.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">{app.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
