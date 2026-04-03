import { useEffect, useMemo, useState } from "react";
import { Wallet2 } from "lucide-react";
import { paymentApi, invoiceApi } from "../../api/services";
import PageHeader from "../../components/PageHeader";
import GlassCard from "../../components/GlassCard";
import Badge from "../../components/Badge";
import MetricCard from "../../components/MetricCard";
import PaginationControls from "../../components/PaginationControls";
import SearchInputWithSuggestions from "../../components/SearchInputWithSuggestions";
import { formatDateTimeDMY } from "../../utils/dateTime";
import { collectSuggestions } from "../../utils/suggestions";

const init = { invoiceId: "", amount: "", mode: "UPI", remarks: "" };
const modes = ["UPI", "BANK", "BANK_TRANSFER", "CASH", "CHEQUE"];
const ITEMS_PER_PAGE = 10;

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState(init);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const load = async () => {
    try {
      setError("");
      const [paymentResponse, invoiceResponse] = await Promise.all([paymentApi.list(), invoiceApi.list()]);
      setPayments(paymentResponse.data.data || []);
      setInvoices(invoiceResponse.data.data || []);
      setPage(1);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const recordPayment = async (event) => {
    event.preventDefault();
    try {
      await paymentApi.create({ ...form, amount: Number(form.amount) });
      setForm(init);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const total = useMemo(() => payments.reduce((sum, payment) => sum + (payment.amountInBaseCurrency || payment.amount || 0), 0), [payments]);

  const pendingInvoices = useMemo(
    () => invoices.filter((invoice) => Number(invoice.outstandingAmount || 0) > 0),
    [invoices]
  );

  const filteredPayments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments.filter((payment) => {
      const matchesMode = modeFilter === "ALL" || payment.mode === modeFilter;
      if (!q) {
        return matchesMode;
      }
      const haystack = [
        payment.referenceNumber || "",
        payment.customerName || "",
        payment.invoiceNumber || "",
        payment.mode || "",
        payment.status || ""
      ]
        .join(" ")
        .toLowerCase();
      return matchesMode && haystack.includes(q);
    });
  }, [payments, query, modeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / ITEMS_PER_PAGE));
  const pagePayments = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredPayments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPayments, page]);

  const fromRow = filteredPayments.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const toRow = Math.min(page * ITEMS_PER_PAGE, filteredPayments.length);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [query, modeFilter]);

  const stats = useMemo(() => {
    const successful = payments.filter((payment) => String(payment.status || "SUCCESS").toUpperCase() === "SUCCESS").length;
    return { total: payments.length, pendingInvoices: pendingInvoices.length, successful };
  }, [payments, pendingInvoices]);

  const searchSuggestions = useMemo(
    () => collectSuggestions(payments, ["referenceNumber", "customerName", "invoiceNumber", "mode", "status"]),
    [payments]
  );

  return (
    <div>
      <PageHeader title="Payment Module" description="Record UPI/Bank/Cash/Cheque receipts with partial payment support." />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <MetricCard title="Payments" value={stats.total} hint="Recorded entries" />
        <MetricCard title="Successful" value={stats.successful} hint="Status success" tone="emerald" />
        <MetricCard title="Pending Invoices" value={stats.pendingInvoices} hint="Still to collect" tone="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard title="Add Payment" className="lg:col-span-1">
          <form onSubmit={recordPayment} className="space-y-3">
            <label className="block text-sm text-slate-600 dark:text-slate-200">
              Invoice
              <select
                value={form.invoiceId}
                onChange={(event) => setForm((prev) => ({ ...prev, invoiceId: event.target.value }))}
                className="field mt-1"
                required
              >
                <option value="">Select invoice</option>
                {pendingInvoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} | {invoice.customerName} | outstanding {invoice.currency || "INR"} {Number(invoice.outstandingAmount || 0).toLocaleString()}
                  </option>
                ))}
              </select>
            </label>
            <Input label="Amount" type="number" value={form.amount} onChange={(value) => setForm((s) => ({ ...s, amount: value }))} />
            <label className="block text-sm text-slate-600 dark:text-slate-200">
              Mode
              <select
                value={form.mode}
                onChange={(event) => setForm((prev) => ({ ...prev, mode: event.target.value }))}
                className="field mt-1"
              >
                {modes.map((mode) => (
                  <option key={mode} value={mode}>{mode.replace("_", " ")}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-600 dark:text-slate-200">
              Notes
              <textarea
                value={form.remarks}
                onChange={(event) => setForm((prev) => ({ ...prev, remarks: event.target.value }))}
                className="field mt-1 min-h-20"
              />
            </label>
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-white">
              <Wallet2 className="h-4 w-4" /> Record Payment
            </button>
          </form>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-300">Auto-updates invoice status for partial/paid settlement.</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">Total recorded: INR {total.toLocaleString()}</p>
        </GlassCard>

        <GlassCard title="Payment History" subtitle="Searchable, compact payment records" className="lg:col-span-2">
          {error && <p className="mb-2 text-sm text-rose-500">{error}</p>}

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SearchInputWithSuggestions
              value={query}
              onChange={setQuery}
              placeholder="Search reference, client, invoice"
              suggestions={searchSuggestions}
            />
            <div className="flex flex-wrap gap-1">
              {["ALL", ...modes].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setModeFilter(mode)}
                  className={`rounded-lg px-2 py-1 text-xs ${
                    modeFilter === mode ? "bg-indigo-500/20 text-indigo-500" : "bg-slate-500/15 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {mode === "ALL" ? "All Modes" : mode.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {pagePayments.map((payment) => (
              <div key={payment.id} className="rounded-xl border border-white/10 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{payment.referenceNumber || "Payment"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">{payment.customerName || "-"}</p>
                  </div>
                  <Badge tone={String(payment.status || "SUCCESS").toUpperCase() === "SUCCESS" ? "emerald" : "rose"}>
                    {payment.status || "SUCCESS"}
                  </Badge>
                </div>
                <div className="mt-2 grid gap-2 text-xs text-slate-600 dark:text-slate-300 md:grid-cols-2">
                  <p>
                    Amount: {payment.currency || "INR"} {Number(payment.amount || 0).toLocaleString()}
                  </p>
                  <p>
                    Base: {payment.baseCurrency || "INR"} {Number(payment.amountInBaseCurrency || payment.amount || 0).toLocaleString()}
                  </p>
                  <p>Mode: {String(payment.mode || "-").replace("_", " ")}</p>
                  <p>Invoice: {payment.invoiceNumber || "-"}</p>
                  <p className="md:col-span-2">Date: {formatDateTimeDMY(payment.paymentDate)}</p>
                </div>
              </div>
            ))}
            {pagePayments.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-300">
                No payments found for the current filter.
              </p>
            )}
          </div>

          <PaginationControls
            page={page}
            totalPages={totalPages}
            fromRow={fromRow}
            toRow={toRow}
            totalRows={filteredPayments.length}
            onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          />
        </GlassCard>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label className="block text-sm text-slate-600 dark:text-slate-200">
      {label}
      <input className="field mt-1" value={value} type={type} onChange={(event) => onChange(event.target.value)} required />
    </label>
  );
}

