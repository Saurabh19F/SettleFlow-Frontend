import { useEffect, useMemo, useState } from "react";
import { activityApi } from "../../api/services";
import PageHeader from "../../components/PageHeader";
import GlassCard from "../../components/GlassCard";
import Badge from "../../components/Badge";
import SearchInputWithSuggestions from "../../components/SearchInputWithSuggestions";
import { formatDateTimeDMY } from "../../utils/dateTime";
import { collectSuggestions } from "../../utils/suggestions";

const ITEMS_PER_PAGE = 10;

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await activityApi.list();
        setLogs(response.data.data || []);
        setPage(1);
      } catch {
        setLogs([]);
        setPage(1);
      }
    };
    load();
  }, []);

  const modules = useMemo(() => {
    const values = Array.from(new Set(logs.map((log) => log.module).filter(Boolean)));
    return ["ALL", ...values];
  }, [logs]);

  const searchSuggestions = useMemo(
    () => collectSuggestions(logs, ["userName", "userId", "module", "action", "details"]),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesModule = moduleFilter === "ALL" || log.module === moduleFilter;
      if (!q) {
        return matchesModule;
      }
      const haystack = [
        log.userName || "",
        log.userId || "",
        log.module || "",
        log.action || "",
        log.details || ""
      ]
        .join(" ")
        .toLowerCase();
      return matchesModule && haystack.includes(q);
    });
  }, [logs, query, moduleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));
  const pageLogs = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, page]);
  const fromRow = filteredLogs.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const toRow = Math.min(page * ITEMS_PER_PAGE, filteredLogs.length);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [query, moduleFilter]);

  const stats = useMemo(() => {
    const uniqueActors = new Set(logs.map((log) => log.userId || log.userName).filter(Boolean)).size;
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const todayEvents = logs.filter((log) => {
      const parsed = new Date(log.createdAt);
      if (Number.isNaN(parsed.getTime())) {
        return false;
      }
      const key = `${parsed.getFullYear()}-${parsed.getMonth()}-${parsed.getDate()}`;
      return key === todayKey;
    }).length;
    return { uniqueActors, todayEvents };
  }, [logs]);

  const toneForAction = (action) => {
    const normalized = String(action || "").toUpperCase();
    if (normalized.includes("DELETE")) {
      return "rose";
    }
    if (normalized.includes("CREATE")) {
      return "emerald";
    }
    if (normalized.includes("UPDATE")) {
      return "amber";
    }
    return "indigo";
  };

  return (
    <div>
      <PageHeader title="Activity Logs" description="Immutable audit trail for invoice, payment, and data changes." />
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <MetricCard title="Total Events" value={logs.length} hint="All recorded logs" />
        <MetricCard title="Unique Actors" value={stats.uniqueActors} hint="Distinct users in logs" tone="emerald" />
        <MetricCard title="Today Events" value={stats.todayEvents} hint="Events created today" tone="amber" />
      </div>

      <GlassCard>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SearchInputWithSuggestions
            value={query}
            onChange={setQuery}
            placeholder="Search actor, action, module, details"
            suggestions={searchSuggestions}
          />
          <div className="flex flex-wrap gap-1">
            {modules.map((moduleName) => (
              <button
                key={moduleName}
                type="button"
                onClick={() => setModuleFilter(moduleName)}
                className={`rounded-lg px-2 py-1 text-xs ${
                  moduleFilter === moduleName ? "bg-indigo-500/20 text-indigo-500" : "bg-slate-500/15 text-slate-600 dark:text-slate-300"
                }`}
              >
                {moduleName === "ALL" ? "All Modules" : moduleName}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {pageLogs.map((log) => (
            <div key={log.id} className="rounded-xl border border-white/10 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{log.userName || log.userId || "Unknown"}</p>
                <p className="text-xs text-slate-500 dark:text-slate-300">{formatDateTimeDMY(log.createdAt)}</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone={toneForAction(log.action)}>{log.action || "ACTION"}</Badge>
                <Badge tone="slate">{log.module || "MODULE"}</Badge>
              </div>
              <p className="mt-2 rounded-lg bg-slate-500/10 px-2 py-2 text-xs text-slate-600 dark:text-slate-300">
                {log.details || "-"}
              </p>
            </div>
          ))}
          {pageLogs.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-300">
              No activity logs found for the current filter.
            </p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs">
          <p className="text-slate-500 dark:text-slate-300">
            Showing {fromRow}-{toRow} of {filteredLogs.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="rounded-lg bg-slate-500/15 px-3 py-1 text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200"
            >
              Prev
            </button>
            <span className="text-slate-500 dark:text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="rounded-lg bg-indigo-500/15 px-3 py-1 text-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function MetricCard({ title, value, hint, tone = "indigo" }) {
  const toneMap = {
    indigo: "text-indigo-500",
    rose: "text-rose-500",
    amber: "text-amber-500",
    emerald: "text-emerald-500"
  };
  return (
    <GlassCard>
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">{title}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneMap[tone] || toneMap.indigo}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{hint}</p>
    </GlassCard>
  );
}

