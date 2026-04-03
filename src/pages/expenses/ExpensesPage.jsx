import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { expenseApi } from "../../api/services";
import PageHeader from "../../components/PageHeader";
import GlassCard from "../../components/GlassCard";
import MetricCard from "../../components/MetricCard";
import PaginationControls from "../../components/PaginationControls";
import SearchInputWithSuggestions from "../../components/SearchInputWithSuggestions";
import { formatDateTimeDMY } from "../../utils/dateTime";
import { collectSuggestions } from "../../utils/suggestions";

const initial = {
  category: "",
  amount: "",
  expenseDate: "",
  notes: "",
  receiptUrl: ""
};

const ITEMS_PER_PAGE = 10;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(initial);
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthly, setMonthly] = useState([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const load = async () => {
    try {
      setError("");
      const [expenseResponse, monthlyResponse] = await Promise.all([
        expenseApi.list(),
        expenseApi.monthlyReport(year)
      ]);
      setExpenses(expenseResponse.data.data || []);
      setMonthly(monthlyResponse.data.data || []);
      setPage(1);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [year]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await expenseApi.create({
        ...form,
        amount: Number(form.amount)
      });
      setForm(initial);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await expenseApi.remove(id);
      setExpenses((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const total = useMemo(() => expenses.reduce((sum, item) => sum + (item.amount || 0), 0), [expenses]);

  const categoryOptions = useMemo(() => {
    const values = Array.from(new Set(expenses.map((item) => item.category).filter(Boolean)));
    return ["ALL", ...values];
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter((expense) => {
      const matchesCategory = categoryFilter === "ALL" || expense.category === categoryFilter;
      if (!q) {
        return matchesCategory;
      }
      const haystack = [expense.category || "", expense.notes || "", expense.receiptUrl || ""].join(" ").toLowerCase();
      return matchesCategory && haystack.includes(q);
    });
  }, [expenses, query, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE));
  const pageExpenses = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredExpenses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredExpenses, page]);

  const fromRow = filteredExpenses.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const toRow = Math.min(page * ITEMS_PER_PAGE, filteredExpenses.length);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [query, categoryFilter]);

  const stats = useMemo(() => {
    const categoryCount = new Set(expenses.map((item) => item.category).filter(Boolean)).size;
    const yearCount = expenses.filter((item) => {
      const date = new Date(item.expenseDate);
      return !Number.isNaN(date.getTime()) && date.getFullYear() === year;
    }).length;
    return { totalEntries: expenses.length, categoryCount, yearCount };
  }, [expenses, year]);

  const searchSuggestions = useMemo(
    () => collectSuggestions(expenses, ["category", "notes", "receiptUrl"]),
    [expenses]
  );

  return (
    <div>
      <PageHeader title="Expense Module" description="Track operating costs with receipts and monthly breakdown." />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <MetricCard title="Total Expenses" value={`INR ${total.toLocaleString()}`} hint="All recorded amount" />
        <MetricCard title="Entries" value={stats.totalEntries} hint="Expense records" tone="amber" />
        <MetricCard title={`In ${year}`} value={stats.yearCount} hint="Entries for selected year" tone="emerald" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard title="Add Expense" className="lg:col-span-1">
          <form onSubmit={submit} className="space-y-3">
            <Input label="Category" value={form.category} onChange={(value) => setForm((prev) => ({ ...prev, category: value }))} />
            <Input label="Amount" type="number" value={form.amount} onChange={(value) => setForm((prev) => ({ ...prev, amount: value }))} />
            <Input label="Date" type="date" value={form.expenseDate} onChange={(value) => setForm((prev) => ({ ...prev, expenseDate: value }))} />
            <label className="block text-sm text-slate-600 dark:text-slate-200">
              Notes
              <textarea
                className="field mt-1 min-h-20"
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </label>
            <Input
              label="Receipt URL"
              value={form.receiptUrl}
              required={false}
              onChange={(value) => setForm((prev) => ({ ...prev, receiptUrl: value }))}
            />
            <button className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-white">Save Expense</button>
          </form>
        </GlassCard>

        <GlassCard title="Monthly Expense Report" subtitle="Visualize monthly burn" className="lg:col-span-2">
          <div className="mb-3 flex justify-end">
            <input
              className="field w-28"
              type="number"
              value={year}
              onChange={(event) => setYear(Number(event.target.value || new Date().getFullYear()))}
            />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 14, background: "rgba(15,23,42,0.88)", border: "1px solid rgba(148,163,184,0.2)" }} />
                <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard title="Expense Entries" subtitle="Search and review entries quickly" className="mt-4">
        {error && <p className="mb-2 text-sm text-rose-500">{error}</p>}

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SearchInputWithSuggestions
            value={query}
            onChange={setQuery}
            placeholder="Search category, notes, receipt"
            suggestions={searchSuggestions}
          />
          <div className="flex flex-wrap gap-1">
            {categoryOptions.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setCategoryFilter(category)}
                className={`rounded-lg px-2 py-1 text-xs ${
                  categoryFilter === category ? "bg-indigo-500/20 text-indigo-500" : "bg-slate-500/15 text-slate-600 dark:text-slate-300"
                }`}
              >
                {category === "ALL" ? "All Categories" : category}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {pageExpenses.map((expense) => (
            <div key={expense.id} className="rounded-xl border border-white/10 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{expense.category || "Uncategorized"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">{formatDateTimeDMY(expense.expenseDate)}</p>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">INR {Number(expense.amount || 0).toLocaleString()}</p>
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{expense.notes || "-"}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  {expense.receiptUrl ? (
                    <a className="text-cyan-500 underline" href={expense.receiptUrl} target="_blank" rel="noreferrer">View Receipt</a>
                  ) : "No receipt"}
                </p>
                <button onClick={() => remove(expense.id)} className="rounded-lg bg-rose-500/15 px-2 py-1 text-xs text-rose-500">Delete</button>
              </div>
            </div>
          ))}
          {pageExpenses.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-300">
              No expenses found for the current filter.
            </p>
          )}
        </div>

        <PaginationControls
          page={page}
          totalPages={totalPages}
          fromRow={fromRow}
          toRow={toRow}
          totalRows={filteredExpenses.length}
          onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        />
      </GlassCard>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required = true }) {
  return (
    <label className="block text-sm text-slate-600 dark:text-slate-200">
      {label}
      <input
        className="field mt-1"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

