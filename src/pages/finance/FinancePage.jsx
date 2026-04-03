import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { financeApi, reminderApi } from "../../api/services";
import PageHeader from "../../components/PageHeader";
import GlassCard from "../../components/GlassCard";
import MetricCard from "../../components/MetricCard";
import PaginationControls from "../../components/PaginationControls";
import SearchInputWithSuggestions from "../../components/SearchInputWithSuggestions";
import { formatDateTimeDMY } from "../../utils/dateTime";
import { collectSuggestions } from "../../utils/suggestions";

const colors = ["#6366f1", "#22d3ee", "#f59e0b", "#ef4444"];
const ITEMS_PER_PAGE = 10;

export default function FinancePage() {
  const [summary, setSummary] = useState({
    totalReceived: 0,
    totalExpenses: 0,
    profit: 0,
    outstanding: 0,
    cashFlow: [],
    aging: [],
    clientBalances: []
  });
  const [credit, setCredit] = useState({ warning: false, creditLimit: 0, outstanding: 0 });
  const [overdue, setOverdue] = useState([]);
  const [error, setError] = useState("");
  const [balanceQuery, setBalanceQuery] = useState("");
  const [overdueQuery, setOverdueQuery] = useState("");
  const [balancePage, setBalancePage] = useState(1);
  const [overduePage, setOverduePage] = useState(1);

  const load = async () => {
    try {
      setError("");
      const [summaryResponse, creditResponse, overdueResponse] = await Promise.all([
        financeApi.summary(),
        reminderApi.creditLimitWarning(),
        reminderApi.overdueAlerts()
      ]);
      setSummary(summaryResponse.data.data || {});
      setCredit(creditResponse.data.data || {});
      setOverdue(overdueResponse.data.data || []);
      setBalancePage(1);
      setOverduePage(1);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const metricRows = useMemo(() => [
    { label: "Total Received", value: summary.totalReceived || 0, tone: "emerald" },
    { label: "Total Expenses", value: summary.totalExpenses || 0, tone: "amber" },
    { label: "Profit / Loss", value: summary.profit || 0, tone: "indigo" },
    { label: "Outstanding", value: summary.outstanding || 0, tone: "rose" }
  ], [summary]);

  const filteredBalances = useMemo(() => {
    const q = balanceQuery.trim().toLowerCase();
    if (!q) {
      return summary.clientBalances || [];
    }
    return (summary.clientBalances || []).filter((row) => String(row.client || "").toLowerCase().includes(q));
  }, [summary.clientBalances, balanceQuery]);

  const filteredOverdue = useMemo(() => {
    const q = overdueQuery.trim().toLowerCase();
    if (!q) {
      return overdue;
    }
    return overdue.filter((row) => {
      const haystack = [row.invoiceNumber || "", row.client || "", row.dueDate || ""].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [overdue, overdueQuery]);

  const balanceSuggestions = useMemo(
    () => collectSuggestions(summary.clientBalances || [], ["client"]),
    [summary.clientBalances]
  );

  const overdueSuggestions = useMemo(
    () => collectSuggestions(overdue, ["invoiceNumber", "client", "dueDate"]),
    [overdue]
  );

  const balanceTotalPages = Math.max(1, Math.ceil(filteredBalances.length / ITEMS_PER_PAGE));
  const overdueTotalPages = Math.max(1, Math.ceil(filteredOverdue.length / ITEMS_PER_PAGE));

  const balanceRows = useMemo(() => {
    const start = (balancePage - 1) * ITEMS_PER_PAGE;
    return filteredBalances.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBalances, balancePage]);

  const overdueRows = useMemo(() => {
    const start = (overduePage - 1) * ITEMS_PER_PAGE;
    return filteredOverdue.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOverdue, overduePage]);

  const balanceFrom = filteredBalances.length === 0 ? 0 : (balancePage - 1) * ITEMS_PER_PAGE + 1;
  const balanceTo = Math.min(balancePage * ITEMS_PER_PAGE, filteredBalances.length);
  const overdueFrom = filteredOverdue.length === 0 ? 0 : (overduePage - 1) * ITEMS_PER_PAGE + 1;
  const overdueTo = Math.min(overduePage * ITEMS_PER_PAGE, filteredOverdue.length);

  useEffect(() => {
    if (balancePage > balanceTotalPages) {
      setBalancePage(balanceTotalPages);
    }
  }, [balancePage, balanceTotalPages]);

  useEffect(() => {
    if (overduePage > overdueTotalPages) {
      setOverduePage(overdueTotalPages);
    }
  }, [overduePage, overdueTotalPages]);

  useEffect(() => {
    setBalancePage(1);
  }, [balanceQuery]);

  useEffect(() => {
    setOverduePage(1);
  }, [overdueQuery]);

  return (
    <div>
      <PageHeader title="Finance Module" description="Profit & loss, cash flow, client balances, and aging insights." />

      {error && <p className="mb-3 text-sm text-rose-500">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricRows.map((row) => (
          <MetricCard
            key={row.label}
            title={row.label}
            value={`INR ${Number(row.value).toLocaleString()}`}
            tone={row.tone}
            hint="Updated from current finance snapshot"
          />
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <GlassCard title="Cash Flow" subtitle="Inflow vs outflow (last 6 months)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.cashFlow || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="inflow" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="outflow" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard title="Aging Report" subtitle="0-30, 30-60, 60-90, 90+ days">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={summary.aging || []} dataKey="value" nameKey="bucket" outerRadius={100} label>
                  {(summary.aging || []).map((entry, index) => (
                    <Cell key={entry.bucket} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <GlassCard title="Client Balances" subtitle="Outstanding per client">
          <div className="mb-3">
            <SearchInputWithSuggestions
              value={balanceQuery}
              onChange={setBalanceQuery}
              placeholder="Search client"
              suggestions={balanceSuggestions}
              className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            {balanceRows.map((row) => (
              <div key={row.client} className="rounded-xl border border-white/10 p-3">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{row.client}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Balance: INR {Number(row.balance || 0).toLocaleString()}</p>
              </div>
            ))}
            {balanceRows.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-300">
                No client balances found.
              </p>
            )}
          </div>

          <PaginationControls
            page={balancePage}
            totalPages={balanceTotalPages}
            fromRow={balanceFrom}
            toRow={balanceTo}
            totalRows={filteredBalances.length}
            onPrev={() => setBalancePage((prev) => Math.max(1, prev - 1))}
            onNext={() => setBalancePage((prev) => Math.min(balanceTotalPages, prev + 1))}
          />
        </GlassCard>

        <GlassCard title="Risk Alerts" subtitle="Credit limits and overdue invoices">
          <div className="rounded-xl border border-white/20 bg-white/30 p-3 dark:bg-slate-900/50">
            <p className={`text-sm font-medium ${credit.warning ? "text-rose-500" : "text-emerald-500"}`}>
              {credit.warning ? "Credit limit exceeded" : "Credit utilization healthy"}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Limit: INR {Number(credit.creditLimit || 0).toLocaleString()} | Outstanding: INR {Number(credit.outstanding || 0).toLocaleString()}
            </p>
          </div>

          <div className="mt-3">
            <SearchInputWithSuggestions
              value={overdueQuery}
              onChange={setOverdueQuery}
              placeholder="Search invoice or client"
              suggestions={overdueSuggestions}
              className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-3 space-y-2">
            {overdueRows.map((row) => (
              <div key={`${row.invoiceNumber}-${row.client}`} className="rounded-xl border border-white/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{row.invoiceNumber}</p>
                  <p className="text-xs font-semibold text-rose-500">INR {Number(row.outstanding || 0).toLocaleString()}</p>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Client: {row.client}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Due: {formatDateTimeDMY(row.dueDate)}</p>
              </div>
            ))}
            {overdueRows.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-300">
                No overdue alerts found.
              </p>
            )}
          </div>

          <PaginationControls
            page={overduePage}
            totalPages={overdueTotalPages}
            fromRow={overdueFrom}
            toRow={overdueTo}
            totalRows={filteredOverdue.length}
            onPrev={() => setOverduePage((prev) => Math.max(1, prev - 1))}
            onNext={() => setOverduePage((prev) => Math.min(overdueTotalPages, prev + 1))}
          />
        </GlassCard>
      </div>
    </div>
  );
}
