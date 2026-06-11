import { useEffect, useMemo, useState } from "react";
import { Download, Check, Loader2, AlertTriangle, Search, Package } from "lucide-react";
import {
  Button,
  Card,
  Checkbox,
  PageHeader,
  SearchInput,
  EmptyState,
} from "../components/ui";
import { useStore, useT } from "../store";
import { wingetAvailable, installApp, wingetSearch, type WingetResult } from "../lib/tauri";
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

  // Búsqueda en vivo en winget
  const [results, setResults] = useState<WingetResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const searchMode = query.trim().length >= 2;

  useEffect(() => {
    wingetAvailable().then(setAvailable).catch(() => setAvailable(false));
  }, []);

  // Debounce de la búsqueda en vivo.
  useEffect(() => {
    if (!searchMode) {
      setResults(null);
      return;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      wingetSearch(query.trim())
        .then((r) => setResults(r))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 450);
    return () => clearTimeout(handle);
  }, [query, searchMode]);

  const byCat = useMemo(
    () =>
      APP_CATEGORIES.map((cat) => ({
        cat,
        items: APPS.filter((a) => a.category === cat),
      })).filter((g) => g.items.length),
    [],
  );

  const toggle = (id: string) =>
    setSel((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const installOne = async (id: string) => {
    setStatus((s) => ({ ...s, [id]: "installing" }));
    try {
      await installApp(id);
      setStatus((s) => ({ ...s, [id]: "done" }));
      pushToast(`${id} ✅`, "success");
    } catch (e) {
      setStatus((s) => ({ ...s, [id]: "error" }));
      pushToast(String(e), "error");
    }
  };

  const installSelected = async () => {
    setWorking(true);
    for (const id of [...sel]) await installOne(id);
    setWorking(false);
    setSel(new Set());
  };

  const renderRow = (id: string, name: string, desc: string, selectable: boolean) => {
    const st = status[id] ?? "idle";
    return (
      <label
        key={id}
        className="glass rounded-xl p-3.5 flex items-center gap-3 cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors"
      >
        {st === "installing" ? (
          <Loader2 size={20} className="animate-spin-slow text-[var(--color-accent)] shrink-0" />
        ) : st === "done" ? (
          <div className="grid place-items-center w-5 h-5 rounded-md bg-[var(--color-success)] shrink-0">
            <Check size={13} className="text-white" strokeWidth={3} />
          </div>
        ) : selectable ? (
          <Checkbox checked={sel.has(id)} onChange={() => toggle(id)} />
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault();
              installOne(id);
            }}
            className="grid place-items-center w-7 h-7 rounded-lg accent-gradient shrink-0"
          >
            <Download size={15} className="text-white" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{name}</p>
          <p className="text-xs text-[var(--color-text-muted)] truncate">{desc}</p>
        </div>
      </label>
    );
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
          <SearchInput value={query} onChange={setQuery} placeholder={t("install.searchPlaceholder")} />
        </div>
        {!searchMode && (
          <Button
            icon={Download}
            disabled={sel.size === 0 || available === false}
            loading={working}
            onClick={installSelected}
          >
            {t("install.installSelected")} ({sel.size})
          </Button>
        )}
      </div>

      {searchMode ? (
        // ---- Resultados de winget en vivo ----
        <div>
          <p className="text-sm font-semibold mb-2.5 text-[var(--color-text-muted)] flex items-center gap-2">
            <Search size={14} /> {t("install.liveResults")}
            {searching && <Loader2 size={14} className="animate-spin-slow" />}
          </p>
          {!searching && results && results.length === 0 ? (
            <EmptyState icon={Package} label={t("common.empty")} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(results ?? []).map((r) =>
                renderRow(r.id, r.name, `${r.id}${r.version ? " · " + r.version : ""}`, false),
              )}
            </div>
          )}
        </div>
      ) : (
        // ---- Catálogo curado ----
        <div className="flex flex-col gap-6">
          {byCat.map((group) => (
            <div key={group.cat}>
              <p className="text-sm font-semibold mb-2.5 text-[var(--color-text-muted)]">{group.cat}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.items.map((app) => renderRow(app.id, app.name, app.desc, true))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
