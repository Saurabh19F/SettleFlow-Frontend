import { useEffect, useState } from "react";
import { companyApi, reminderApi } from "../../api/services";
import PageHeader from "../../components/PageHeader";
import GlassCard from "../../components/GlassCard";

const initial = {
  name: "",
  gstin: "",
  address: "",
  contact: "",
  creditLimit: 0
};

export default function CompanyProfilePage() {
  const [form, setForm] = useState(initial);
  const [outstanding, setOutstanding] = useState(0);
  const [creditWarning, setCreditWarning] = useState({ warning: false, creditLimit: 0, outstanding: 0 });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      const [profileResponse, warningResponse] = await Promise.all([companyApi.profile(), reminderApi.creditLimitWarning()]);
      const data = profileResponse.data.data;
      setForm({
        name: data.name || "",
        gstin: data.gstin || "",
        address: data.address || "",
        contact: data.contact || "",
        creditLimit: data.creditLimit || 0
      });
      setOutstanding(data.outstandingBalance || 0);
      setCreditWarning(warningResponse.data.data || { warning: false, creditLimit: 0, outstanding: 0 });
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      await companyApi.updateProfile({ ...form, creditLimit: Number(form.creditLimit) });
      setSuccess("Company profile updated");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <PageHeader title="Company Module" description="Manage company details, credit limit, and profile settings." />
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Metric title="Credit Limit" value={form.creditLimit} tone="indigo" />
        <Metric title="Outstanding Balance" value={outstanding} tone={creditWarning.warning ? "rose" : "amber"} />
        <GlassCard>
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">Credit Alert</p>
          <p className={`mt-2 text-sm font-medium ${creditWarning.warning ? "text-rose-500" : "text-emerald-500"}`}>
            {creditWarning.warning ? "Limit exceeded" : "Within safe limit"}
          </p>
        </GlassCard>
      </div>
      <GlassCard title="Company Profile" subtitle="Add/Edit company information" className="mt-4">
        <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
          <Input label="Name" value={form.name} onChange={(v) => setForm((s) => ({ ...s, name: v }))} />
          <Input label="GSTIN" value={form.gstin} onChange={(v) => setForm((s) => ({ ...s, gstin: v.toUpperCase() }))} />
          <Input label="Contact" value={form.contact} onChange={(v) => setForm((s) => ({ ...s, contact: v }))} />
          <Input label="Credit Limit" type="number" value={form.creditLimit} onChange={(v) => setForm((s) => ({ ...s, creditLimit: v }))} />
          <label className="md:col-span-2 text-sm text-slate-600 dark:text-slate-200">
            Address
            <textarea
              value={form.address}
              onChange={(event) => setForm((s) => ({ ...s, address: event.target.value }))}
              className="field mt-1 min-h-24"
              required
            />
          </label>
          <div className="md:col-span-2 flex items-center gap-3">
            <button className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-white">Save Company</button>
            {success && <span className="text-sm text-emerald-500">{success}</span>}
            {error && <span className="text-sm text-rose-500">{error}</span>}
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label className="text-sm text-slate-600 dark:text-slate-200">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field mt-1"
        required
      />
    </label>
  );
}

function Metric({ title, value, tone = "slate" }) {
  const toneMap = {
    slate: "text-slate-900 dark:text-slate-100",
    indigo: "text-indigo-500",
    amber: "text-amber-500",
    rose: "text-rose-500"
  };

  return (
    <GlassCard>
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">{title}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneMap[tone] || toneMap.slate}`}>INR {Number(value || 0).toLocaleString()}</p>
    </GlassCard>
  );
}
