import { useEffect, useMemo, useState } from "react";
import { subscriptionApi } from "../../api/services";
import PageHeader from "../../components/PageHeader";
import GlassCard from "../../components/GlassCard";
import Badge from "../../components/Badge";
import { formatDateTimeDMY } from "../../utils/dateTime";
import PaginationControls from "../../components/PaginationControls";
import SearchInputWithSuggestions from "../../components/SearchInputWithSuggestions";
import { collectSuggestions } from "../../utils/suggestions";

const formatDateTime = (value) => {
  return formatDateTimeDMY(value);
};
const ITEMS_PER_PAGE = 10;

export default function AuditTrailPage() {
  const [auditTrail, setAuditTrail] = useState([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await subscriptionApi.dashboard();
        setAuditTrail(response.data.data?.auditTrail || []);
        setPage(1);
      } catch (err) {
        setError(err.message);
      }
    };
    load();
  }, []);

  const filteredAudit = useMemo(() => {
    const q = query.trim().toLowerCase();
    return auditTrail.filter((item) => {
      if (!q) {
        return true;
      }
      const haystack = [item.companyName || "", item.action || "", item.details || "", item.actorName || ""].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [auditTrail, query]);

  const searchSuggestions = useMemo(
    () => collectSuggestions(auditTrail, ["companyName", "action", "details", "actorName"]),
    [auditTrail]
  );

  const totalPages = Math.max(1, Math.ceil(filteredAudit.length / ITEMS_PER_PAGE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredAudit.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAudit, page]);
  const fromRow = filteredAudit.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const toRow = Math.min(page * ITEMS_PER_PAGE, filteredAudit.length);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  return (
    <div>
      <PageHeader title="Audit Trail" description="Track subscription actions performed by super admin." />
      <GlassCard subtitle="Latest plan, cycle, and renewal actions">
        {error && <p className="mb-3 text-sm text-rose-500">{error}</p>}
        <div className="mb-3">
          <SearchInputWithSuggestions
            value={query}
            onChange={setQuery}
            placeholder="Search company, action, actor"
            suggestions={searchSuggestions}
            className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          {pageItems.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-300">No super admin actions logged yet.</p>
          )}
          {pageItems.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-100">{item.companyName}</p>
                <Badge tone={item.action === "RENEW" ? "emerald" : "indigo"}>{item.action}</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{item.details}</p>
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-400">
                By {item.actorName || "Unknown"} at {formatDateTime(item.createdAt)}
              </p>
            </div>
          ))}
        </div>
        <PaginationControls
          page={page}
          totalPages={totalPages}
          fromRow={fromRow}
          toRow={toRow}
          totalRows={filteredAudit.length}
          onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        />
      </GlassCard>
    </div>
  );
}
