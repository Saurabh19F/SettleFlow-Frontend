import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Download, Plus, Send, Trash2, AlertTriangle } from "lucide-react";
import { exchangeApi, gstinApi, invoiceApi, reminderApi } from "../../api/services";
import PageHeader from "../../components/PageHeader";
import GlassCard from "../../components/GlassCard";
import Badge from "../../components/Badge";
import PaginationControls from "../../components/PaginationControls";
import SearchInputWithSuggestions from "../../components/SearchInputWithSuggestions";
import { formatDateTimeDMY } from "../../utils/dateTime";
import { collectSuggestions } from "../../utils/suggestions";

const currencies = ["INR", "USD", "EUR", "GBP", "AED"];
const ITEMS_PER_PAGE = 10;

const emptyItem = { description: "", hsnCode: "", quantity: "1", rate: "0", taxPercent: "18" };

const baseForm = {
  invoiceNumber: "",
  date: new Date().toISOString().slice(0, 10),
  dueDate: "",
  customerName: "",
  customerGstin: "",
  clientAddress: "",
  clientContact: "",
  currency: "INR",
  baseCurrency: "INR",
  exchangeRate: "1",
  taxMode: "SPLIT",
  amountInWords: "",
  termsAndConditions: "Payment due within agreed terms.",
  bankDetails: "",
  upiQrData: "",
  logoUrl: "",
  signatureUrl: "",
  stampUrl: "",
  items: [{ ...emptyItem }]
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState(baseForm);
  const [month, setMonth] = useState("");
  const [error, setError] = useState("");
  const [meta, setMeta] = useState("");
  const [loadingAction, setLoadingAction] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const load = async () => {
    try {
      const response = await invoiceApi.list(month ? { month } : undefined);
      setInvoices(response.data.data || []);
      setPage(1);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [month]);

  const taxableAmount = useMemo(
    () => round(form.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0), 0)),
    [form.items]
  );

  const totalTax = useMemo(
    () => round(form.items.reduce((sum, item) => {
      const line = Number(item.quantity || 0) * Number(item.rate || 0);
      return sum + (line * Number(item.taxPercent || 0)) / 100;
    }, 0)),
    [form.items]
  );

  const grandTotal = useMemo(() => round(taxableAmount + totalTax), [taxableAmount, totalTax]);

  const createInvoice = async (event) => {
    event.preventDefault();
    setError("");
    setMeta("");
    try {
      const payload = {
        ...form,
        amount: grandTotal,
        exchangeRate: Number(form.exchangeRate || 1),
        items: form.items.map((item) => ({
          description: item.description,
          hsnCode: item.hsnCode,
          quantity: Number(item.quantity || 0),
          rate: Number(item.rate || 0),
          taxPercent: Number(item.taxPercent || 0)
        }))
      };
      await invoiceApi.create(payload);
      setForm({ ...baseForm, dueDate: "" });
      setMeta("Invoice created successfully.");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const verifyCustomerGstin = async () => {
    if (!form.customerGstin.trim()) {
      setMeta("Enter customer GSTIN first.");
      return;
    }
    try {
      const response = await gstinApi.validate(form.customerGstin.trim());
      const data = response.data.data;
      setMeta(data.valid ? `GSTIN verified (${data.source})` : `GSTIN invalid: ${data.message}`);
    } catch (err) {
      setMeta(err.message);
    }
  };

  const fetchRate = async () => {
    try {
      const response = await exchangeApi.rate({ base: form.currency, target: form.baseCurrency });
      const data = response.data.data;
      setForm((prev) => ({ ...prev, exchangeRate: String(data.rate) }));
      setMeta(`Rate loaded: 1 ${data.baseCurrency} = ${data.rate} ${data.targetCurrency}`);
    } catch (err) {
      setMeta(err.message);
    }
  };

  const downloadPdf = async (invoice) => {
    try {
      setLoadingAction(invoice.id + "-pdf");
      const response = await invoiceApi.downloadPdf(invoice.id);
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${invoice.invoiceNumber || "invoice"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAction("");
    }
  };

  const sendReminder = async (invoiceId, channel) => {
    try {
      setLoadingAction(invoiceId + channel);
      const response = await reminderApi.sendPaymentReminder(invoiceId, channel);
      setMeta(response.data.data?.message || "Reminder sent.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAction("");
    }
  };

  const markBadDebt = async (invoice) => {
    const reason = window.prompt("Reason for bad debt", invoice.badDebtReason || "Marked by finance team") || "Marked manually";
    try {
      setLoadingAction(invoice.id + "-baddebt");
      await invoiceApi.markBadDebt(invoice.id, reason);
      setMeta(`Invoice ${invoice.invoiceNumber} marked as bad debt.`);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAction("");
    }
  };

  const addItem = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, { ...emptyItem }] }));
  };

  const removeItem = (index) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const updateItem = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    }));
  };

  const outstanding = useMemo(
    () => invoices.filter((item) => item.status !== "PAID").reduce((sum, item) => sum + (item.outstandingAmountInBaseCurrency || item.outstandingAmount || 0), 0),
    [invoices]
  );

  const filteredInvoices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const matchesStatus = statusFilter === "ALL" || invoice.status === statusFilter;
      if (!q) {
        return matchesStatus;
      }
      const haystack = [
        invoice.invoiceNumber || "",
        invoice.customerName || "",
        invoice.customerGstin || "",
        invoice.status || ""
      ]
        .join(" ")
        .toLowerCase();
      return matchesStatus && haystack.includes(q);
    });
  }, [invoices, query, statusFilter]);

  const searchSuggestions = useMemo(
    () => collectSuggestions(invoices, ["invoiceNumber", "customerName", "customerGstin", "status"]),
    [invoices]
  );

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE));
  const pageInvoices = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInvoices, page]);
  const fromRow = filteredInvoices.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const toRow = Math.min(page * ITEMS_PER_PAGE, filteredInvoices.length);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  return (
    <div>
      <PageHeader
        title="Invoice Module"
        description="Create GST invoices with tax breakdown, PDF generation, reminders, and outstanding tracking."
        action={
          <select value={month} onChange={(event) => setMonth(event.target.value)} className="field w-40">
            <option value="">All Months</option>
            {Array.from({ length: 12 }).map((_, idx) => (
              <option key={idx + 1} value={idx + 1}>{new Date(2000, idx, 1).toLocaleString("en", { month: "long" })}</option>
            ))}
          </select>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <GlassCard title="Create GST Invoice" className="xl:col-span-2">
          <form onSubmit={createInvoice} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Input label="Invoice Number (optional)" value={form.invoiceNumber} onChange={(value) => setForm((prev) => ({ ...prev, invoiceNumber: value }))} required={false} />
              <Input label="Date" type="date" value={form.date} onChange={(value) => setForm((prev) => ({ ...prev, date: value }))} />
              <Input label="Due Date" type="date" value={form.dueDate} onChange={(value) => setForm((prev) => ({ ...prev, dueDate: value }))} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Client Name" value={form.customerName} onChange={(value) => setForm((prev) => ({ ...prev, customerName: value }))} />
              <Input label="Client Contact" value={form.clientContact} onChange={(value) => setForm((prev) => ({ ...prev, clientContact: value }))} required={false} />
              <label className="md:col-span-2 block text-sm text-slate-600 dark:text-slate-200">
                Client Address
                <textarea
                  className="field mt-1 min-h-20"
                  value={form.clientAddress}
                  onChange={(event) => setForm((prev) => ({ ...prev, clientAddress: event.target.value }))}
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Input label="Client GSTIN" value={form.customerGstin} onChange={(value) => setForm((prev) => ({ ...prev, customerGstin: value.toUpperCase() }))} required={false} />
              <button type="button" onClick={verifyCustomerGstin} className="self-end rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-500">Validate GSTIN</button>
              <Select label="Tax Mode" value={form.taxMode} onChange={(value) => setForm((prev) => ({ ...prev, taxMode: value }))} options={["SPLIT", "IGST"]} />
            </div>

            <div className="rounded-2xl border border-white/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Item List</p>
                <button type="button" onClick={addItem} className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/15 px-2 py-1 text-xs text-indigo-500">
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </button>
              </div>
              <div className="space-y-2">
                {form.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2">
                    <input className="field col-span-12 md:col-span-3" placeholder="Description" value={item.description} onChange={(event) => updateItem(index, "description", event.target.value)} required />
                    <input className="field col-span-6 md:col-span-2" placeholder="HSN" value={item.hsnCode} onChange={(event) => updateItem(index, "hsnCode", event.target.value)} />
                    <input className="field col-span-3 md:col-span-2" placeholder="Qty" type="number" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} />
                    <input className="field col-span-3 md:col-span-2" placeholder="Rate" type="number" value={item.rate} onChange={(event) => updateItem(index, "rate", event.target.value)} />
                    <input className="field col-span-3 md:col-span-2" placeholder="Tax %" type="number" value={item.taxPercent} onChange={(event) => updateItem(index, "taxPercent", event.target.value)} />
                    <button type="button" onClick={() => removeItem(index)} className="col-span-3 md:col-span-1 rounded-lg bg-rose-500/15 px-2 text-rose-500" disabled={form.items.length === 1}>
                      <Trash2 className="mx-auto h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Select label="Currency" value={form.currency} onChange={(value) => setForm((prev) => ({ ...prev, currency: value }))} options={currencies} />
              <Select label="Base Currency" value={form.baseCurrency} onChange={(value) => setForm((prev) => ({ ...prev, baseCurrency: value }))} options={currencies} />
              <div className="flex items-end gap-2">
                <Input label="Exchange Rate" value={form.exchangeRate} onChange={(value) => setForm((prev) => ({ ...prev, exchangeRate: value }))} />
                <button type="button" onClick={fetchRate} className="mb-0.5 inline-flex items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-500">
                  <ArrowLeftRight className="h-3.5 w-3.5" /> Fetch
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Amount in Words" value={form.amountInWords} onChange={(value) => setForm((prev) => ({ ...prev, amountInWords: value }))} required={false} />
              <Input label="UPI QR Data" value={form.upiQrData} onChange={(value) => setForm((prev) => ({ ...prev, upiQrData: value }))} required={false} />
              <Input label="Bank Details" value={form.bankDetails} onChange={(value) => setForm((prev) => ({ ...prev, bankDetails: value }))} required={false} />
              <Input label="Terms & Conditions" value={form.termsAndConditions} onChange={(value) => setForm((prev) => ({ ...prev, termsAndConditions: value }))} required={false} />
              <Input label="Company Logo URL" value={form.logoUrl} onChange={(value) => setForm((prev) => ({ ...prev, logoUrl: value }))} required={false} />
              <Input label="Signature URL" value={form.signatureUrl} onChange={(value) => setForm((prev) => ({ ...prev, signatureUrl: value }))} required={false} />
              <Input label="Stamp URL" value={form.stampUrl} onChange={(value) => setForm((prev) => ({ ...prev, stampUrl: value }))} required={false} />
            </div>

            <div className="rounded-xl border border-white/20 bg-white/30 p-3 text-sm dark:bg-slate-900/50">
              <p>Taxable: INR {taxableAmount.toLocaleString()}</p>
              <p>Total Tax: INR {totalTax.toLocaleString()}</p>
              <p className="font-semibold">Grand Total: {form.currency} {grandTotal.toLocaleString()}</p>
            </div>

            <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-white">
              <Plus className="h-4 w-4" /> Save Invoice
            </button>
          </form>

          {(error || meta) && (
            <p className={`mt-3 text-sm ${error ? "text-rose-500" : "text-emerald-500"}`}>{error || meta}</p>
          )}
        </GlassCard>

        <GlassCard title="Quick Totals" subtitle="Receivables snapshot">
          <div className="space-y-2 text-sm">
            <p className="text-slate-600 dark:text-slate-300">Outstanding Pool: INR {outstanding.toLocaleString()}</p>
            <p className="text-slate-600 dark:text-slate-300">Taxable Value: INR {taxableAmount.toLocaleString()}</p>
            <p className="text-slate-600 dark:text-slate-300">Tax Value: INR {totalTax.toLocaleString()}</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">Current Draft: {form.currency} {grandTotal.toLocaleString()}</p>
          </div>
        </GlassCard>
      </div>

      <GlassCard title="Invoices" subtitle="Professional A4 PDF, reminders, and tracking" className="mt-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SearchInputWithSuggestions
            value={query}
            onChange={setQuery}
            placeholder="Search invoice, client, GSTIN"
            suggestions={searchSuggestions}
          />
          <div className="flex flex-wrap gap-1">
            {["ALL", "DRAFT", "PENDING", "PARTIAL", "PAID", "OVERDUE", "BAD_DEBT"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-2 py-1 text-xs ${
                  statusFilter === status ? "bg-indigo-500/20 text-indigo-500" : "bg-slate-500/15 text-slate-600 dark:text-slate-300"
                }`}
              >
                {status === "ALL" ? "All Statuses" : status}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {pageInvoices.map((invoice) => (
            <div key={invoice.id} className="rounded-xl border border-white/10 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">{invoice.customerName}</p>
                  {invoice.customerGstin && <p className="text-xs text-slate-500 dark:text-slate-300">GSTIN: {invoice.customerGstin}</p>}
                </div>
                <Badge tone={invoice.status === "PAID" ? "emerald" : invoice.status === "OVERDUE" ? "rose" : "amber"}>
                  {invoice.status}
                </Badge>
              </div>

              <div className="mt-2 grid gap-2 text-xs text-slate-600 dark:text-slate-300 md:grid-cols-2">
                <p>Total: {invoice.currency || "INR"} {Number(invoice.amount || 0).toLocaleString()}</p>
                <p>Outstanding: {invoice.baseCurrency || "INR"} {Number(invoice.outstandingAmountInBaseCurrency || invoice.outstandingAmount || 0).toLocaleString()}</p>
                <p>Due: {formatDateTimeDMY(invoice.dueDate)}</p>
                <p>Created: {formatDateTimeDMY(invoice.date)}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                <button
                  onClick={() => downloadPdf(invoice)}
                  disabled={loadingAction === invoice.id + "-pdf"}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/15 px-2 py-1 text-xs text-indigo-500"
                >
                  <Download className="h-3.5 w-3.5" /> PDF
                </button>
                <button
                  onClick={() => sendReminder(invoice.id, "EMAIL")}
                  disabled={loadingAction === invoice.id + "EMAIL"}
                  className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/15 px-2 py-1 text-xs text-cyan-500"
                >
                  <Send className="h-3.5 w-3.5" /> Email
                </button>
                <button
                  onClick={() => sendReminder(invoice.id, "WHATSAPP")}
                  disabled={loadingAction === invoice.id + "WHATSAPP"}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-1 text-xs text-emerald-500"
                >
                  <Send className="h-3.5 w-3.5" /> WhatsApp
                </button>
                <button
                  onClick={() => markBadDebt(invoice)}
                  disabled={loadingAction === invoice.id + "-baddebt"}
                  className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 px-2 py-1 text-xs text-rose-500"
                >
                  <AlertTriangle className="h-3.5 w-3.5" /> Bad debt
                </button>
              </div>
            </div>
          ))}
          {pageInvoices.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-300">
              No invoices found for the current filter.
            </p>
          )}
        </div>

        <PaginationControls
          page={page}
          totalPages={totalPages}
          fromRow={fromRow}
          toRow={toRow}
          totalRows={filteredInvoices.length}
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
      <input className="field mt-1" value={value} type={type} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block text-sm text-slate-600 dark:text-slate-200">
      {label}
      <select className="field mt-1" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

