import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { reportApi } from "../../api/services";
import PageHeader from "../../components/PageHeader";
import GlassCard from "../../components/GlassCard";
import MetricCard from "../../components/MetricCard";
import PaginationControls from "../../components/PaginationControls";
import SearchInputWithSuggestions from "../../components/SearchInputWithSuggestions";
import { collectSuggestions } from "../../utils/suggestions";

const fallback = {
  revenue: [
    { month: "Jan", amount: 48 },
    { month: "Feb", amount: 62 },
    { month: "Mar", amount: 71 },
    { month: "Apr", amount: 66 },
    { month: "May", amount: 84 },
    { month: "Jun", amount: 97 }
  ],
  outstanding: [
    { name: "Current", value: 58 },
    { name: "7-30 Days", value: 25 },
    { name: "31+ Days", value: 17 }
  ],
  userActivity: [
    { role: "Admin", actions: 120 },
    { role: "Accountant", actions: 210 },
    { role: "Collector", actions: 164 },
    { role: "Manager", actions: 82 }
  ]
};

const pieColors = ["#6366f1", "#22d3ee", "#f59e0b"];
const ITEMS_PER_PAGE = 10;

export default function ReportsPage() {
  const [data, setData] = useState(fallback);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const [revenue, outstanding, userActivity] = await Promise.all([
          reportApi.revenue(),
          reportApi.outstanding(),
          reportApi.userActivity()
        ]);
        setData({
          revenue: revenue.data.data,
          outstanding: outstanding.data.data,
          userActivity: userActivity.data.data
        });
      } catch {
        setData(fallback);
      }
    };
    load();
  }, []);

  const totalRevenue = useMemo(
    () => (data.revenue || []).reduce((sum, row) => sum + Number(row.amount || 0), 0),
    [data.revenue]
  );

  const maxOutstandingBucket = useMemo(() => {
    const rows = data.outstanding || [];
    if (!rows.length) {
      return "-";
    }
    return rows.reduce((best, row) => (Number(row.value || 0) > Number(best.value || 0) ? row : best), rows[0]).name;
  }, [data.outstanding]);

  const filteredActivity = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data.userActivity || []).filter((item) => {
      if (!q) {
        return true;
      }
      return String(item.role || "").toLowerCase().includes(q);
    });
  }, [data.userActivity, query]);

  const searchSuggestions = useMemo(
    () => collectSuggestions(data.userActivity || [], ["role"]),
    [data.userActivity]
  );

  const totalPages = Math.max(1, Math.ceil(filteredActivity.length / ITEMS_PER_PAGE));
  const pageActivity = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredActivity.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredActivity, page]);

  const fromRow = filteredActivity.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const toRow = Math.min(page * ITEMS_PER_PAGE, filteredActivity.length);

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
      <PageHeader title="Reports & Analytics" description="Revenue, outstanding buckets, and team activity trends." />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <MetricCard title="Revenue Points" value={(data.revenue || []).length} hint="Months in chart" />
        <MetricCard title="Revenue Total" value={`INR ${Number(totalRevenue).toLocaleString()}`} hint="Sum of chart values" tone="emerald" />
        <MetricCard title="Top Aging Bucket" value={maxOutstandingBucket} hint="Highest outstanding share" tone="amber" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <GlassCard title="Revenue Report" subtitle="Monthly collections">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 14, background: "rgba(15,23,42,0.88)", border: "1px solid rgba(148,163,184,0.2)" }} />
                <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard title="Outstanding Aging" subtitle="Receivable quality">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.outstanding} dataKey="value" cx="50%" cy="50%" outerRadius={98} label>
                  {(data.outstanding || []).map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard title="User Activity" subtitle="Actions by role" className="mt-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SearchInputWithSuggestions
            value={query}
            onChange={setQuery}
            placeholder="Search role"
            suggestions={searchSuggestions}
          />
        </div>

        <div className="space-y-2">
          {pageActivity.map((item) => (
            <div key={item.role} className="rounded-xl border border-white/10 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.role}</p>
                <p className="text-sm font-semibold text-indigo-500">{item.actions} actions</p>
              </div>
            </div>
          ))}
          {pageActivity.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-300">
              No activity rows found.
            </p>
          )}
        </div>

        <PaginationControls
          page={page}
          totalPages={totalPages}
          fromRow={fromRow}
          toRow={toRow}
          totalRows={filteredActivity.length}
          onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        />
      </GlassCard>
    </div>
  );
}

