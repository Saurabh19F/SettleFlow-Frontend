import { useEffect, useMemo, useState } from "react";
import { companyApi } from "../../api/services";
import PageHeader from "../../components/PageHeader";
import GlassCard from "../../components/GlassCard";
import Badge from "../../components/Badge";
import MetricCard from "../../components/MetricCard";
import PaginationControls from "../../components/PaginationControls";
import SearchInputWithSuggestions from "../../components/SearchInputWithSuggestions";
import { formatDateTimeDMY } from "../../utils/dateTime";
import { collectSuggestions } from "../../utils/suggestions";

const plans = ["BASIC", "GROWTH", "ENTERPRISE", "CUSTOMIZE"];
const cycles = ["MONTHLY", "YEARLY"];
const requestStatus = ["ALL", "PENDING", "APPROVED", "REJECTED"];
const ITEMS_PER_PAGE = 10;

const formatLabel = (value) =>
  String(value || "")
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

export default function SubscriptionRequestPage() {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    requestedPlan: "GROWTH",
    requestedCycle: "MONTHLY",
    reason: ""
  });

  const load = async () => {
    try {
      const [profileResponse, requestsResponse] = await Promise.all([
        companyApi.profile(),
        companyApi.listSubscriptionRequests()
      ]);
      setProfile(profileResponse.data.data || null);
      setRequests(requestsResponse.data.data || []);
      setPage(1);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      const payload = {
        requestedPlan: form.requestedPlan,
        requestedCycle: form.requestedPlan === "BASIC" ? "TRIAL" : form.requestedCycle,
        reason: form.reason.trim()
      };
      await companyApi.createSubscriptionRequest(payload);
      setSuccess("Request sent to super admin successfully.");
      setForm((prev) => ({ ...prev, reason: "" }));
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredRequests = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((item) => {
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      if (!q) {
        return matchesStatus;
      }
      const haystack = [
        item.currentPlan || "",
        item.currentCycle || "",
        item.requestedPlan || "",
        item.requestedCycle || "",
        item.reason || "",
        item.status || ""
      ]
        .join(" ")
        .toLowerCase();
      return matchesStatus && haystack.includes(q);
    });
  }, [requests, query, statusFilter]);

  const searchSuggestions = useMemo(
    () => collectSuggestions(requests, ["currentPlan", "currentCycle", "requestedPlan", "requestedCycle", "reason", "status"]),
    [requests]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));
  const pageRequests = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, page]);

  const fromRow = filteredRequests.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const toRow = Math.min(page * ITEMS_PER_PAGE, filteredRequests.length);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((item) => item.status === "PENDING").length,
      approved: requests.filter((item) => item.status === "APPROVED").length
    };
  }, [requests]);

  return (
    <div>
      <PageHeader
        title="Subscription Requests"
        description="View your current subscription and request plan or cycle changes from super admin."
      />

      {error && <p className="mb-3 text-sm text-rose-500">{error}</p>}
      {success && <p className="mb-3 text-sm text-emerald-500">{success}</p>}

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <MetricCard title="Requests" value={stats.total} hint="Total submitted" />
        <MetricCard title="Pending" value={stats.pending} hint="Awaiting review" tone="amber" />
        <MetricCard title="Approved" value={stats.approved} hint="Accepted by super admin" tone="emerald" />
      </div>

      <GlassCard title="Current Subscription" subtitle="Managed by super admin">
        {!profile ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">Loading current subscription...</p>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge tone="indigo">Plan: {formatLabel(profile.subscriptionPlan)}</Badge>
              <Badge tone={profile.subscriptionBillingCycle === "MONTHLY" ? "emerald" : profile.subscriptionBillingCycle === "YEARLY" ? "indigo" : "amber"}>
                Cycle: {formatLabel(profile.subscriptionBillingCycle)}
              </Badge>
              <Badge tone="amber">Start: {formatDateTimeDMY(profile.subscriptionStartedAt)}</Badge>
              <Badge tone="rose">End: {formatDateTimeDMY(profile.subscriptionEndsAt)}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-300">Features:</span>
              {(profile.specialFeatures || []).length === 0 ? (
                <span className="rounded-full bg-slate-500/15 px-3 py-1 text-xs text-slate-700 dark:text-slate-200">
                  No special features
                </span>
              ) : (
                (profile.specialFeatures || []).map((feature) => (
                  <span key={feature} className="rounded-full bg-slate-500/15 px-3 py-1 text-xs text-slate-700 dark:text-slate-200">
                    {formatLabel(feature)}
                  </span>
                ))
              )}
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard title="Request Plan/Cycle Change" subtitle="This request goes directly to super admin" className="mt-4">
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-600 dark:text-slate-200">
            Requested Plan
            <select
              value={form.requestedPlan}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  requestedPlan: event.target.value,
                  requestedCycle: event.target.value === "BASIC" ? "TRIAL" : (prev.requestedCycle === "TRIAL" ? "MONTHLY" : prev.requestedCycle)
                }))
              }
              className="field mt-1"
            >
              {plans.map((plan) => (
                <option key={plan} value={plan}>{formatLabel(plan)}</option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-600 dark:text-slate-200">
            Requested Cycle
            <select
              value={form.requestedPlan === "BASIC" ? "TRIAL" : form.requestedCycle}
              onChange={(event) => setForm((prev) => ({ ...prev, requestedCycle: event.target.value }))}
              className="field mt-1"
              disabled={form.requestedPlan === "BASIC"}
            >
              {form.requestedPlan === "BASIC" ? (
                <option value="TRIAL">Trial (7 days)</option>
              ) : (
                cycles.map((cycle) => (
                  <option key={cycle} value={cycle}>{formatLabel(cycle)}</option>
                ))
              )}
            </select>
          </label>

          <label className="text-sm text-slate-600 dark:text-slate-200 md:col-span-2">
            Reason (optional)
            <textarea
              value={form.reason}
              onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
              placeholder="Why do you want this subscription change?"
              className="field mt-1 min-h-24"
              maxLength={500}
            />
          </label>

          <div className="md:col-span-2">
            <button className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-white">
              Send Request
            </button>
          </div>
        </form>
      </GlassCard>

      <GlassCard title="Request History" subtitle="Track request status updates" className="mt-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SearchInputWithSuggestions
            value={query}
            onChange={setQuery}
            placeholder="Search plan, cycle, reason"
            suggestions={searchSuggestions}
          />
          <div className="flex flex-wrap gap-1">
            {requestStatus.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-2 py-1 text-xs ${
                  statusFilter === status ? "bg-indigo-500/20 text-indigo-500" : "bg-slate-500/15 text-slate-600 dark:text-slate-300"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {pageRequests.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {formatLabel(item.currentPlan)} / {formatLabel(item.currentCycle)} {" -> "} {formatLabel(item.requestedPlan)} / {formatLabel(item.requestedCycle)}
                </p>
                <Badge tone={item.status === "APPROVED" ? "emerald" : item.status === "REJECTED" ? "rose" : "amber"}>
                  {item.status}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Reason: {item.reason || "-"}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                Created: {formatDateTimeDMY(item.createdAt)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                Reviewed by: {item.reviewedByName || "-"}
                {item.reviewedAt ? ` at ${formatDateTimeDMY(item.reviewedAt)}` : ""}
              </p>
            </div>
          ))}
          {pageRequests.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-300">
              No subscription requests yet.
            </p>
          )}
        </div>

        <PaginationControls
          page={page}
          totalPages={totalPages}
          fromRow={fromRow}
          toRow={toRow}
          totalRows={filteredRequests.length}
          onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        />
      </GlassCard>
    </div>
  );
}

