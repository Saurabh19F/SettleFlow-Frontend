import { useEffect, useMemo, useState } from "react";
import { timelineApi } from "../../api/services";
import PageHeader from "../../components/PageHeader";
import GlassCard from "../../components/GlassCard";
import Badge from "../../components/Badge";
import SearchInputWithSuggestions from "../../components/SearchInputWithSuggestions";
import { formatDateTimeDMY } from "../../utils/dateTime";
import { collectSuggestions } from "../../utils/suggestions";

const ITEMS_PER_PAGE = 10;

export default function LoginTimelinePage() {
  const [sessions, setSessions] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await timelineApi.list();
        setSessions(response.data.data || []);
        setPage(1);
      } catch {
        setSessions([]);
        setPage(1);
      }
    };
    load();
  }, []);

  const statusOptions = useMemo(() => {
    const values = Array.from(new Set(sessions.map((row) => row.status).filter(Boolean)));
    return ["ALL", "ACTIVE", ...values];
  }, [sessions]);

  const searchSuggestions = useMemo(
    () => collectSuggestions(sessions, ["userName", "userId", "status", "ipAddress", "deviceInfo"]),
    [sessions]
  );

  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions.filter((session) => {
      const isActive = !session.logoutAt;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" ? isActive : session.status === statusFilter);
      if (!q) {
        return matchesStatus;
      }
      const haystack = [
        session.userName || "",
        session.userId || "",
        session.status || "",
        session.ipAddress || "",
        session.deviceInfo || ""
      ]
        .join(" ")
        .toLowerCase();
      return matchesStatus && haystack.includes(q);
    });
  }, [sessions, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / ITEMS_PER_PAGE));
  const pageSessions = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredSessions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSessions, page]);
  const fromRow = filteredSessions.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const toRow = Math.min(page * ITEMS_PER_PAGE, filteredSessions.length);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  const stats = useMemo(() => {
    const active = sessions.filter((session) => !session.logoutAt).length;
    const failed = sessions.filter((session) => String(session.status || "").toUpperCase() !== "SUCCESS").length;
    return { total: sessions.length, active, failed };
  }, [sessions]);

  const toneForSession = (session) => {
    if (!session.logoutAt) {
      return "amber";
    }
    return session.status === "SUCCESS" ? "emerald" : "rose";
  };

  return (
    <div>
      <PageHeader title="Login Timeline" description="Track session entries, exits, and status for all tenant users." />
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <MetricCard title="Total Sessions" value={stats.total} hint="All timeline entries" />
        <MetricCard title="Active Sessions" value={stats.active} hint="No logout captured yet" tone="amber" />
        <MetricCard title="Failed Sessions" value={stats.failed} hint="Non-success statuses" tone="rose" />
      </div>

      <GlassCard>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SearchInputWithSuggestions
            value={query}
            onChange={setQuery}
            placeholder="Search user, status, IP, device"
            suggestions={searchSuggestions}
          />
          <div className="flex flex-wrap gap-1">
            {statusOptions.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-2 py-1 text-xs ${
                  statusFilter === status ? "bg-indigo-500/20 text-indigo-500" : "bg-slate-500/15 text-slate-600 dark:text-slate-300"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {pageSessions.map((session) => (
            <div key={session.id} className="rounded-xl border border-white/10 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{session.userName || session.userId || "Unknown"}</p>
                <Badge tone={toneForSession(session)}>
                  {!session.logoutAt ? "ACTIVE" : (session.status || "UNKNOWN")}
                </Badge>
              </div>
              <div className="mt-2 grid gap-2 text-xs text-slate-600 dark:text-slate-300 md:grid-cols-2">
                <p>Login: {formatDateTimeDMY(session.loginAt)}</p>
                <p>Logout: {session.logoutAt ? formatDateTimeDMY(session.logoutAt) : "Active"}</p>
                <p>IP: {session.ipAddress || "-"}</p>
                <p>Device: {session.deviceInfo || "-"}</p>
              </div>
            </div>
          ))}
          {pageSessions.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-300">
              No login timeline records found for the current filter.
            </p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs">
          <p className="text-slate-500 dark:text-slate-300">
            Showing {fromRow}-{toRow} of {filteredSessions.length}
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

