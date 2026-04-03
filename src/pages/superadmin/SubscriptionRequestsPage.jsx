import { useEffect, useMemo, useState } from "react";
import { subscriptionApi } from "../../api/services";
import PageHeader from "../../components/PageHeader";
import GlassCard from "../../components/GlassCard";
import Badge from "../../components/Badge";
import { formatDateTimeDMY } from "../../utils/dateTime";
import PaginationControls from "../../components/PaginationControls";
import SearchInputWithSuggestions from "../../components/SearchInputWithSuggestions";
import { collectSuggestions } from "../../utils/suggestions";

const statusFilters = ["ALL", "PENDING", "APPROVED", "REJECTED"];
const ITEMS_PER_PAGE = 10;

const formatLabel = (value) =>
  String(value || "")
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

export default function SubscriptionRequestsPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [noteDrafts, setNoteDrafts] = useState({});
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const load = async (nextStatus = status) => {
    try {
      const response = await subscriptionApi.listChangeRequests(
        nextStatus === "ALL" ? undefined : { status: nextStatus }
      );
      const items = response.data.data || [];
      setRows(items);
      setPage(1);
      setNoteDrafts((prev) => {
        const next = { ...prev };
        for (const item of items) {
          if (next[item.id] === undefined) {
            next[item.id] = "";
          }
        }
        return next;
      });
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load(status);
  }, [status]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (!q) {
        return true;
      }
      const haystack = [
        row.companyName || "",
        row.currentPlan || "",
        row.currentCycle || "",
        row.requestedPlan || "",
        row.requestedCycle || "",
        row.reason || "",
        row.requestedByName || ""
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, query]);

  const searchSuggestions = useMemo(
    () =>
      collectSuggestions(rows, [
        "companyName",
        "currentPlan",
        "currentCycle",
        "requestedPlan",
        "requestedCycle",
        "reason",
        "requestedByName"
      ]),
    [rows]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const pageRows = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, page]);
  const fromRow = filteredRows.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const toRow = Math.min(page * ITEMS_PER_PAGE, filteredRows.length);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const decide = async (id, decision) => {
    try {
      await subscriptionApi.decideChangeRequest(id, {
        decision,
        note: noteDrafts[id] || ""
      });
      load(status);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Plan Requests"
        description="Requests from admins to upgrade or downgrade subscription plan/cycle."
      />

      <GlassCard>
        {error && <p className="mb-3 text-sm text-rose-500">{error}</p>}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-300">Filter:</span>
          {statusFilters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`rounded-lg px-2 py-1 text-xs ${
                status === item ? "bg-indigo-500/20 text-indigo-500" : "bg-slate-500/15 text-slate-500"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mb-3">
          <SearchInputWithSuggestions
            value={query}
            onChange={setQuery}
            placeholder="Search company, plan, requester"
            suggestions={searchSuggestions}
            className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-3">
          {pageRows.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-300">No requests for the selected filter.</p>
          )}
          {pageRows.map((row) => (
            <div key={row.id} className="rounded-xl border border-white/10 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{row.companyName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">
                    {formatLabel(row.currentPlan)} / {formatLabel(row.currentCycle)} {" -> "} {formatLabel(row.requestedPlan)} / {formatLabel(row.requestedCycle)}
                  </p>
                </div>
                <Badge tone={row.status === "APPROVED" ? "emerald" : row.status === "REJECTED" ? "rose" : "amber"}>
                  {row.status}
                </Badge>
              </div>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">
                Requested by {row.requestedByName || "-"} on {formatDateTimeDMY(row.createdAt)}
              </p>
              {row.reason && <p className="mt-1 text-xs text-slate-600 dark:text-slate-200">Reason: {row.reason}</p>}
              {row.reviewedByName && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                  Reviewed by {row.reviewedByName} on {formatDateTimeDMY(row.reviewedAt)} {row.reviewNote ? `- ${row.reviewNote}` : ""}
                </p>
              )}

              {row.status === "PENDING" && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    value={noteDrafts[row.id] || ""}
                    onChange={(event) => setNoteDrafts((prev) => ({ ...prev, [row.id]: event.target.value }))}
                    placeholder="Optional decision note"
                    className="rounded-lg border border-white/20 bg-transparent px-3 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => decide(row.id, "APPROVED")}
                    className="rounded-lg bg-emerald-500/15 px-3 py-1 text-xs text-emerald-500"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => decide(row.id, "REJECTED")}
                    className="rounded-lg bg-rose-500/15 px-3 py-1 text-xs text-rose-500"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <PaginationControls
          page={page}
          totalPages={totalPages}
          fromRow={fromRow}
          toRow={toRow}
          totalRows={filteredRows.length}
          onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        />
      </GlassCard>
    </div>
  );
}
