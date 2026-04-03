import { useEffect, useMemo, useState } from "react";
import { subscriptionApi } from "../../api/services";
import PageHeader from "../../components/PageHeader";
import GlassCard from "../../components/GlassCard";
import Badge from "../../components/Badge";
import { formatDateTimeDMY } from "../../utils/dateTime";
import PaginationControls from "../../components/PaginationControls";
import SearchInputWithSuggestions from "../../components/SearchInputWithSuggestions";
import { collectSuggestions } from "../../utils/suggestions";

const formatLabel = (value) =>
  String(value || "")
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

const formatDateTime = (value) => {
  return formatDateTimeDMY(value);
};
const ITEMS_PER_PAGE = 10;

export default function RenewalsPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [renewalWindow, setRenewalWindow] = useState(30);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const load = async () => {
    try {
      const response = await subscriptionApi.dashboard();
      setDashboard(response.data.data || null);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const renewalQueue = useMemo(() => {
    const queue = dashboard?.renewalsQueue || [];
    return queue.filter((row) => {
      const inWindow = Number(row.daysUntilSubscriptionEnds) <= renewalWindow;
      if (!inWindow) {
        return false;
      }
      if (!query.trim()) {
        return true;
      }
      const haystack = [row.companyName || "", row.plan || "", row.cycle || ""].join(" ").toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    });
  }, [dashboard, renewalWindow, query]);

  const searchSuggestions = useMemo(
    () => collectSuggestions(dashboard?.renewalsQueue || [], ["companyName", "plan", "cycle"]),
    [dashboard]
  );

  const totalPages = Math.max(1, Math.ceil(renewalQueue.length / ITEMS_PER_PAGE));
  const pageRows = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return renewalQueue.slice(start, start + ITEMS_PER_PAGE);
  }, [renewalQueue, page]);
  const fromRow = renewalQueue.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const toRow = Math.min(page * ITEMS_PER_PAGE, renewalQueue.length);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [renewalWindow, query]);

  const renewCompany = async (companyId) => {
    try {
      await subscriptionApi.renewCompany(companyId);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <PageHeader title="Renewals Queue" description="Review expiring subscriptions and renew in one click." />
      <GlassCard subtitle="Filter companies expiring in 7 / 15 / 30 days.">
        {error && <p className="mb-3 text-sm text-rose-500">{error}</p>}
        <div className="mb-3 flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setRenewalWindow(7)}
            className={`rounded-lg px-2 py-1 ${renewalWindow === 7 ? "bg-indigo-500/20 text-indigo-500" : "bg-slate-500/15 text-slate-500"}`}
          >
            7 Days
          </button>
          <button
            type="button"
            onClick={() => setRenewalWindow(15)}
            className={`rounded-lg px-2 py-1 ${renewalWindow === 15 ? "bg-indigo-500/20 text-indigo-500" : "bg-slate-500/15 text-slate-500"}`}
          >
            15 Days
          </button>
          <button
            type="button"
            onClick={() => setRenewalWindow(30)}
            className={`rounded-lg px-2 py-1 ${renewalWindow === 30 ? "bg-indigo-500/20 text-indigo-500" : "bg-slate-500/15 text-slate-500"}`}
          >
            30 Days
          </button>
          <p className="text-slate-500 dark:text-slate-300">Showing {renewalQueue.length} item(s)</p>
        </div>
        <div className="mb-3">
          <SearchInputWithSuggestions
            value={query}
            onChange={setQuery}
            placeholder="Search company or plan"
            suggestions={searchSuggestions}
            className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          {pageRows.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-300">No subscriptions in the selected renewal window.</p>
          )}
          {pageRows.map((item) => (
            <div key={item.companyId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 p-3">
              <div className="text-xs">
                <p className="font-semibold text-slate-700 dark:text-slate-100">{item.companyName}</p>
                <p className="text-slate-500 dark:text-slate-300">
                  {formatLabel(item.plan)} / {formatLabel(item.cycle)} | Ends: {formatDateTime(item.subscriptionEndsAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={Number(item.daysUntilSubscriptionEnds) < 0 ? "rose" : "amber"}>
                  {Number(item.daysUntilSubscriptionEnds) < 0
                    ? `Expired ${Math.abs(Number(item.daysUntilSubscriptionEnds))}d`
                    : `${item.daysUntilSubscriptionEnds}d left`}
                </Badge>
                <button
                  type="button"
                  onClick={() => renewCompany(item.companyId)}
                  className="rounded-lg bg-emerald-500/15 px-3 py-1 text-xs text-emerald-500"
                >
                  Renew Now
                </button>
              </div>
            </div>
          ))}
        </div>
        <PaginationControls
          page={page}
          totalPages={totalPages}
          fromRow={fromRow}
          toRow={toRow}
          totalRows={renewalQueue.length}
          onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        />
      </GlassCard>
    </div>
  );
}
