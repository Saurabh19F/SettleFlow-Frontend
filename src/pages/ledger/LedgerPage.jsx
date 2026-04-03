import { useEffect, useMemo, useState } from "react";
import { ledgerApi } from "../../api/services";
import PageHeader from "../../components/PageHeader";
import GlassCard from "../../components/GlassCard";
import MetricCard from "../../components/MetricCard";
import PaginationControls from "../../components/PaginationControls";
import Badge from "../../components/Badge";
import SearchInputWithSuggestions from "../../components/SearchInputWithSuggestions";
import { formatDateTimeDMY } from "../../utils/dateTime";
import { collectSuggestions } from "../../utils/suggestions";

const ITEMS_PER_PAGE = 10;

export default function LedgerPage() {
  const [entries, setEntries] = useState([]);
  const [client, setClient] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const load = async (clientName) => {
    try {
      setError("");
      const response = await ledgerApi.list(clientName || "");
      setEntries(response.data.data || []);
      setPage(1);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load("");
  }, []);

  const summary = useMemo(() => {
    const debit = entries.reduce((sum, item) => sum + (item.debit || 0), 0);
    const credit = entries.reduce((sum, item) => sum + (item.credit || 0), 0);
    const closing = entries.length ? entries[entries.length - 1].runningBalance : 0;
    return { debit, credit, closing };
  }, [entries]);

  const typeOptions = useMemo(() => {
    const values = Array.from(new Set(entries.map((entry) => entry.type).filter(Boolean)));
    return ["ALL", ...values];
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesType = typeFilter === "ALL" || entry.type === typeFilter;
      if (!q) {
        return matchesType;
      }
      const haystack = [entry.reference || "", entry.description || "", entry.type || "", entry.date || ""].join(" ").toLowerCase();
      return matchesType && haystack.includes(q);
    });
  }, [entries, query, typeFilter]);

  const searchSuggestions = useMemo(
    () => collectSuggestions(entries, ["reference", "description", "type", "date"]),
    [entries]
  );

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / ITEMS_PER_PAGE));
  const pageEntries = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEntries, page]);

  const fromRow = filteredEntries.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const toRow = Math.min(page * ITEMS_PER_PAGE, filteredEntries.length);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [query, typeFilter]);

  return (
    <div>
      <PageHeader title="Ledger System" description="Client-wise transaction ledger with running balance." />

      <GlassCard title="Filter Ledger" subtitle="Search by client name">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="field"
            value={client}
            onChange={(event) => setClient(event.target.value)}
            placeholder="Client name"
          />
          <button
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-white"
            onClick={() => load(client)}
          >
            Load Ledger
          </button>
        </div>
      </GlassCard>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MetricCard title="Invoice Entries" value={formatCurrency(summary.debit)} hint="Debit total" />
        <MetricCard title="Payment Entries" value={formatCurrency(summary.credit)} hint="Credit total" tone="emerald" />
        <MetricCard title="Running Balance" value={formatCurrency(summary.closing)} hint="Current closing" tone="amber" />
      </div>

      <GlassCard title="Ledger Entries" subtitle="Compact transaction timeline" className="mt-4">
        {error && <p className="mb-2 text-sm text-rose-500">{error}</p>}

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SearchInputWithSuggestions
            value={query}
            onChange={setQuery}
            placeholder="Search reference or description"
            suggestions={searchSuggestions}
          />
          <div className="flex flex-wrap gap-1">
            {typeOptions.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`rounded-lg px-2 py-1 text-xs ${
                  typeFilter === type ? "bg-indigo-500/20 text-indigo-500" : "bg-slate-500/15 text-slate-600 dark:text-slate-300"
                }`}
              >
                {type === "ALL" ? "All Types" : type}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {pageEntries.map((entry, index) => (
            <div key={`${entry.reference}-${index}`} className="rounded-xl border border-white/10 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{entry.reference || "-"}</p>
                <Badge tone={entry.type === "PAYMENT" ? "emerald" : "indigo"}>{entry.type || "ENTRY"}</Badge>
              </div>
              <div className="mt-2 grid gap-2 text-xs text-slate-600 dark:text-slate-300 md:grid-cols-2">
                <p>Date: {formatDateTimeDMY(entry.date)}</p>
                <p>Description: {entry.description || "-"}</p>
                <p>Debit: {formatCurrency(entry.debit || 0)}</p>
                <p>Credit: {formatCurrency(entry.credit || 0)}</p>
                <p className="md:col-span-2">Balance: {formatCurrency(entry.runningBalance || 0)}</p>
              </div>
            </div>
          ))}
          {pageEntries.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-300">
              No ledger entries found for the current filter.
            </p>
          )}
        </div>

        <PaginationControls
          page={page}
          totalPages={totalPages}
          fromRow={fromRow}
          toRow={toRow}
          totalRows={filteredEntries.length}
          onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        />
      </GlassCard>
    </div>
  );
}

function formatCurrency(value) {
  return `INR ${Number(value || 0).toLocaleString()}`;
}

