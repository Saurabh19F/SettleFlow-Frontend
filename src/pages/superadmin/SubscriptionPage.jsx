import { Fragment, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { subscriptionApi } from "../../api/services";
import PageHeader from "../../components/PageHeader";
import GlassCard from "../../components/GlassCard";
import Badge from "../../components/Badge";
import SearchInputWithSuggestions from "../../components/SearchInputWithSuggestions";
import { formatDateTimeDMY } from "../../utils/dateTime";
import { collectSuggestions } from "../../utils/suggestions";

const statuses = ["ACTIVE", "SUSPENDED", "FROZEN"];
const cycles = ["MONTHLY", "YEARLY"];

const planCatalog = {
  BASIC: { label: "Basic", minUsers: 3, notes: "Free trial for 7 days" },
  GROWTH: { label: "Growth", minUsers: 10, notes: "Monthly / Yearly" },
  ENTERPRISE: { label: "Enterprise", minUsers: 25, notes: "Monthly / Yearly" },
  CUSTOMIZE: { label: "Customize", minUsers: 3, notes: "Monthly / Yearly + custom features" }
};

const featureOptions = [
  "INVOICE_MANAGEMENT",
  "PAYMENT_COLLECTION",
  "BASIC_REPORTS",
  "AUTO_REMINDERS",
  "GST_AUTO_VALIDATION",
  "TALLY_SYNC",
  "MULTI_CURRENCY",
  "ADVANCED_ANALYTICS",
  "API_ACCESS",
  "PRIORITY_SUPPORT",
  "DEDICATED_SUPPORT",
  "CUSTOM_BRANDING"
];

const planDefaultFeatures = {
  BASIC: ["INVOICE_MANAGEMENT", "PAYMENT_COLLECTION", "BASIC_REPORTS"],
  GROWTH: [
    "INVOICE_MANAGEMENT",
    "PAYMENT_COLLECTION",
    "BASIC_REPORTS",
    "AUTO_REMINDERS",
    "GST_AUTO_VALIDATION",
    "TALLY_SYNC"
  ],
  ENTERPRISE: [...featureOptions],
  CUSTOMIZE: ["INVOICE_MANAGEMENT", "PAYMENT_COLLECTION", "BASIC_REPORTS"]
};

const formatLabel = (value) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

const formatDateTime = (value) => {
  return formatDateTimeDMY(value);
};

const toLocalDateTimeInput = (value) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

const toIso = (value) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
};

export default function SubscriptionPage() {
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState("");
  const [limitDrafts, setLimitDrafts] = useState({});
  const [planDrafts, setPlanDrafts] = useState({});
  const [cycleDrafts, setCycleDrafts] = useState({});
  const [featureDrafts, setFeatureDrafts] = useState({});
  const [startDrafts, setStartDrafts] = useState({});
  const [statusDrafts, setStatusDrafts] = useState({});
  const [adminAccessDrafts, setAdminAccessDrafts] = useState({});
  const [featureDialogCompany, setFeatureDialogCompany] = useState(null);
  const [featureDialogDraft, setFeatureDialogDraft] = useState([]);
  const [editorCompany, setEditorCompany] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [expandedCompanyId, setExpandedCompanyId] = useState(null);

  const load = async () => {
    try {
      const response = await subscriptionApi.listCompanies();
      const items = response.data.data || [];
      setCompanies(items);
      setLimitDrafts(Object.fromEntries(items.map((company) => [company.id, company.userLimit])));
      setPlanDrafts(Object.fromEntries(items.map((company) => [company.id, company.subscriptionPlan || "BASIC"])));
      setCycleDrafts(
        Object.fromEntries(
          items.map((company) => [
            company.id,
            company.subscriptionBillingCycle || (company.subscriptionPlan === "BASIC" ? "TRIAL" : "MONTHLY")
          ])
        )
      );
      setFeatureDrafts(Object.fromEntries(items.map((company) => [company.id, company.specialFeatures || []])));
      setStartDrafts(Object.fromEntries(items.map((company) => [company.id, toLocalDateTimeInput(company.subscriptionStartedAt)])));
      setStatusDrafts(Object.fromEntries(items.map((company) => [company.id, company.status])));
      setAdminAccessDrafts(Object.fromEntries(items.map((company) => [company.id, company.adminAccessEnabled])));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectedPlan = (company) => planDrafts[company.id] || company.subscriptionPlan || "BASIC";
  const selectedCycle = (company) => cycleDrafts[company.id] || company.subscriptionBillingCycle || "TRIAL";
  const selectedStatus = (company) => statusDrafts[company.id] || company.status;
  const selectedAdminAccess = (company) => adminAccessDrafts[company.id] ?? company.adminAccessEnabled;
  const selectedFeatures = (company) => {
    const plan = selectedPlan(company);
    const drafted = featureDrafts[company.id];
    const stored = company.specialFeatures || [];
    if (plan !== "CUSTOMIZE") {
      return planDefaultFeatures[plan] || [];
    }
    if (drafted && drafted.length > 0) {
      return drafted;
    }
    if (stored.length > 0) {
      return stored;
    }
    return planDefaultFeatures.CUSTOMIZE;
  };
  const minimumUsers = (plan) => planCatalog[plan]?.minUsers || 3;

  const payloadFor = (company, overrides = {}) => {
    const plan = overrides.subscriptionPlan || selectedPlan(company);
    const cycle = plan === "BASIC" ? "TRIAL" : overrides.subscriptionBillingCycle || selectedCycle(company) || "MONTHLY";
    const requestedUserLimit = Number(overrides.userLimit ?? company.userLimit ?? minimumUsers(plan));
    const startIso = overrides.subscriptionStartedAt ?? toIso(startDrafts[company.id]) ?? company.subscriptionStartedAt;

    return {
      status: overrides.status ?? selectedStatus(company),
      userLimit: Math.max(minimumUsers(plan), requestedUserLimit),
      adminAccessEnabled: overrides.adminAccessEnabled ?? selectedAdminAccess(company),
      subscriptionPlan: plan,
      subscriptionBillingCycle: cycle,
      subscriptionStartedAt: startIso,
      specialFeatures: plan === "CUSTOMIZE" ? (overrides.specialFeatures || selectedFeatures(company)) : undefined
    };
  };

  const updateCompany = async (id, payload) => {
    try {
      await subscriptionApi.updateCompany(id, payload);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const renewCompany = async (companyId) => {
    try {
      await subscriptionApi.renewCompany(companyId);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditor = (company) => {
    setStatusDrafts((prev) => ({ ...prev, [company.id]: prev[company.id] || company.status }));
    setAdminAccessDrafts((prev) => ({ ...prev, [company.id]: prev[company.id] ?? company.adminAccessEnabled }));
    setEditorCompany(company);
  };

  const saveEditor = async () => {
    if (!editorCompany) {
      return;
    }
    const company = editorCompany;
    const plan = selectedPlan(company);
    const minUsersForPlan = minimumUsers(plan);
    await updateCompany(
      company.id,
      payloadFor(company, {
        status: selectedStatus(company),
        adminAccessEnabled: selectedAdminAccess(company),
        subscriptionPlan: plan,
        subscriptionBillingCycle: plan === "BASIC" ? "TRIAL" : selectedCycle(company),
        userLimit: Math.max(minUsersForPlan, Number(limitDrafts[company.id] ?? company.userLimit))
      })
    );
    setEditorCompany(null);
  };

  const filteredCompanies = companies.filter((company) => {
    const query = searchText.trim().toLowerCase();
    const matchesQuery =
      !query ||
      company.name.toLowerCase().includes(query) ||
      (company.gstin || "").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "ALL" || company.status === statusFilter;
    const matchesPlan = planFilter === "ALL" || (company.subscriptionPlan || "BASIC") === planFilter;
    return matchesQuery && matchesStatus && matchesPlan;
  });

  const metrics = useMemo(() => {
    const total = companies.length;
    const endingSoon = companies.filter((company) => company.subscriptionEndingSoon).length;
    const reachedLimit = companies.filter((company) => company.userLimitReached).length;
    const expired = companies.filter((company) => Number(company.daysUntilSubscriptionEnds) < 0).length;
    const activeUsers = companies.reduce((sum, company) => sum + Number(company.activeUsers || 0), 0);
    return { total, endingSoon, reachedLimit, expired, activeUsers };
  }, [companies]);

  const searchSuggestions = useMemo(
    () => collectSuggestions(companies, ["name", "gstin", "subscriptionPlan", "subscriptionBillingCycle"]),
    [companies]
  );

  return (
    <div>
      <PageHeader title="Subscription Control Center" description="Super admin manages plan, cycle, date-time window and feature access." />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Companies" value={metrics.total} hint="Managed tenants" />
        <MetricCard title="Ending In 7 Days" value={metrics.endingSoon} hint="Needs renewal" />
        <MetricCard title="Expired" value={metrics.expired} hint="Subscription expired" tone="rose" />
        <MetricCard title="User Limit Reached" value={metrics.reachedLimit} hint="At/above capacity" tone="amber" />
        <MetricCard title="Active Users" value={metrics.activeUsers} hint="Currently active users" tone="emerald" />
      </div>

      <GlassCard>
        {error && <p className="mb-2 text-sm text-rose-500">{error}</p>}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SearchInputWithSuggestions
            value={searchText}
            onChange={setSearchText}
            placeholder="Filter by company or GSTIN"
            suggestions={searchSuggestions}
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm sm:w-auto"
          >
            <option value="ALL">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            value={planFilter}
            onChange={(event) => setPlanFilter(event.target.value)}
            className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm sm:w-auto"
          >
            <option value="ALL">All Plans</option>
            {Object.keys(planCatalog).map((plan) => (
              <option key={plan} value={plan}>{planCatalog[plan].label}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-300">Showing {filteredCompanies.length} of {companies.length}</p>
        </div>

        <div className="space-y-2 md:hidden">
          {filteredCompanies.map((company) => {
            const plan = selectedPlan(company);
            const features = selectedFeatures(company);
            const daysLeft = Number(company.daysUntilSubscriptionEnds || 0);
            const displayFeatures = plan === "CUSTOMIZE" ? features : (planDefaultFeatures[plan] || []);
            const isExpanded = expandedCompanyId === company.id;
            return (
              <div key={company.id} className="rounded-xl border border-white/10 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{company.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">{company.gstin || "-"}</p>
                  </div>
                  <Badge tone={company.status === "ACTIVE" ? "emerald" : "rose"}>{company.status}</Badge>
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-300">
                  <p>
                    {planCatalog[company.subscriptionPlan || "BASIC"]?.label || "Basic"} / {formatLabel(company.subscriptionBillingCycle || "TRIAL")}
                  </p>
                  {company.subscriptionEndingSoon && <p className="text-amber-500">Ends within 7 days</p>}
                  {daysLeft < 0 && <p className="text-rose-500">Expired {Math.abs(daysLeft)} day(s) ago</p>}
                  {!company.subscriptionEndingSoon && daysLeft >= 0 && <p className="text-emerald-500">{daysLeft} day(s) left</p>}
                  {company.userLimitReached && <p className="text-rose-500">User limit reached</p>}
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setExpandedCompanyId((prev) => (prev === company.id ? null : company.id))}
                    className="rounded-lg bg-indigo-500/15 px-3 py-1 text-xs text-indigo-500"
                  >
                    {isExpanded ? "Hide Details" : "Show Details"}
                  </button>
                </div>
                {isExpanded && (
                  <div className="mt-3 rounded-xl border border-white/10 p-3">
                    <div className="grid gap-2">
                      <div className="rounded-xl bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">Window</p>
                        <p className="mt-1 text-xs text-slate-700 dark:text-slate-100">Start: {formatDateTime(company.subscriptionStartedAt)}</p>
                        <p className="text-xs text-slate-700 dark:text-slate-100">End: {formatDateTime(company.subscriptionEndsAt)}</p>
                        <p className="text-xs text-slate-700 dark:text-slate-100">Updated: {formatDateTime(company.subscriptionUpdatedAt)}</p>
                      </div>
                      <div className="rounded-xl bg-gradient-to-r from-amber-500/10 to-rose-500/10 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">Usage</p>
                        <p className="mt-1 text-xs text-slate-700 dark:text-slate-100">Active users: <b>{company.activeUsers || 0}</b></p>
                        <p className="text-xs text-slate-700 dark:text-slate-100">Limit: <b>{company.userLimit || 0}</b></p>
                      </div>
                      <div className="rounded-xl bg-gradient-to-r from-fuchsia-500/10 to-violet-500/10 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">Features</p>
                        <p className="mt-1 text-xs text-slate-700 dark:text-slate-100">{displayFeatures.length} feature(s) enabled</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {displayFeatures.map((feature) => (
                            <span key={feature} className="rounded-md bg-slate-500/15 px-2 py-1 text-[10px] text-slate-700 dark:text-slate-200">
                              {formatLabel(feature)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditor(company)}
                        className="rounded-lg bg-indigo-500/15 px-3 py-1.5 text-xs font-medium text-indigo-500"
                      >
                        Edit Subscription
                      </button>
                      <button
                        type="button"
                        onClick={() => renewCompany(company.id)}
                        className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-500"
                      >
                        Renew Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filteredCompanies.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-300">
              No companies match the selected filters.
            </p>
          )}
        </div>

        <div className="hidden overflow-auto md:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-300">
                <th className="py-2">Company</th>
                <th className="py-2">Status</th>
                <th className="py-2">Plan / Cycle</th>
                <th className="py-2">Alerts</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => {
                const plan = selectedPlan(company);
                const features = selectedFeatures(company);
                const daysLeft = Number(company.daysUntilSubscriptionEnds || 0);
                const displayFeatures = plan === "CUSTOMIZE" ? features : (planDefaultFeatures[plan] || []);
                const isExpanded = expandedCompanyId === company.id;

                return (
                  <Fragment key={company.id}>
                    <tr className="border-t border-white/10 align-top">
                      <td className="py-3">
                        <p className="font-medium text-slate-800 dark:text-slate-100">{company.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-300">{company.gstin || "-"}</p>
                      </td>
                      <td className="py-3">
                        <Badge tone={company.status === "ACTIVE" ? "emerald" : "rose"}>{company.status}</Badge>
                      </td>
                      <td className="py-3">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-100">
                          {planCatalog[company.subscriptionPlan || "BASIC"]?.label || "Basic"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-300">{formatLabel(company.subscriptionBillingCycle || "TRIAL")}</p>
                      </td>
                      <td className="py-3 text-xs">
                        {company.subscriptionEndingSoon && <p className="text-amber-500">Ends within 7 days</p>}
                        {daysLeft < 0 && <p className="text-rose-500">Expired {Math.abs(daysLeft)} day(s) ago</p>}
                        {!company.subscriptionEndingSoon && daysLeft >= 0 && <p className="text-emerald-500">{daysLeft} day(s) left</p>}
                        {company.userLimitReached && <p className="text-rose-500">User limit reached</p>}
                      </td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => setExpandedCompanyId((prev) => (prev === company.id ? null : company.id))}
                          className="rounded-lg bg-indigo-500/15 px-3 py-1 text-xs text-indigo-500"
                        >
                          {isExpanded ? "Hide Details" : "Show Details"}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="border-t border-white/10">
                        <td colSpan={5} className="pb-4">
                          <div className="rounded-xl border border-white/10 p-3">
                            <div className="mt-4 grid gap-3 lg:grid-cols-3">
                              <div className="rounded-xl bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 p-3">
                                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">Window</p>
                                <p className="mt-1 text-xs text-slate-700 dark:text-slate-100">Start: {formatDateTime(company.subscriptionStartedAt)}</p>
                                <p className="text-xs text-slate-700 dark:text-slate-100">End: {formatDateTime(company.subscriptionEndsAt)}</p>
                                <p className="text-xs text-slate-700 dark:text-slate-100">Updated: {formatDateTime(company.subscriptionUpdatedAt)}</p>
                              </div>
                              <div className="rounded-xl bg-gradient-to-r from-amber-500/10 to-rose-500/10 p-3">
                                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">Usage</p>
                                <p className="mt-1 text-xs text-slate-700 dark:text-slate-100">
                                  Active users: <b>{company.activeUsers || 0}</b>
                                </p>
                                <p className="text-xs text-slate-700 dark:text-slate-100">
                                  Limit: <b>{company.userLimit || 0}</b>
                                </p>
                              </div>
                              <div className="rounded-xl bg-gradient-to-r from-fuchsia-500/10 to-violet-500/10 p-3">
                                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">Features</p>
                                <p className="mt-1 text-xs text-slate-700 dark:text-slate-100">
                                  {displayFeatures.length} feature(s) enabled
                                </p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {displayFeatures.map((feature) => (
                                    <span key={feature} className="rounded-md bg-slate-500/15 px-2 py-1 text-[10px] text-slate-700 dark:text-slate-200">
                                      {formatLabel(feature)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditor(company)}
                                className="rounded-lg bg-indigo-500/15 px-3 py-1.5 text-xs font-medium text-indigo-500"
                              >
                                Edit Subscription
                              </button>
                              <button
                                type="button"
                                onClick={() => renewCompany(company.id)}
                                className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-500"
                              >
                                Renew Now
                              </button>
                              <p className="text-xs text-slate-500 dark:text-slate-300">
                                Clean mode: advanced fields are now inside editor popup.
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-slate-500 dark:text-slate-300">
                    No companies match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {editorCompany &&
        createPortal(
          <div
            className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-900/60 px-3"
            onClick={() => setEditorCompany(null)}
          >
            <div
              className="w-full max-w-3xl rounded-2xl border border-white/20 bg-white p-4 shadow-xl dark:bg-slate-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Edit Subscription: {editorCompany.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">
                    Organized editor for plan, cycle, window, users, and special features.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditorCompany(null)}
                  className="rounded-lg bg-slate-500/15 px-2 py-1 text-xs text-slate-600 dark:text-slate-200"
                >
                  Close
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs text-slate-600 dark:text-slate-200">
                  Status
                  <select
                    value={selectedStatus(editorCompany)}
                    onChange={(event) =>
                      setStatusDrafts((prev) => ({ ...prev, [editorCompany.id]: event.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-white/20 bg-transparent px-2 py-1"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label className="text-xs text-slate-600 dark:text-slate-200">
                  Plan
                  <select
                    value={selectedPlan(editorCompany)}
                    onChange={(event) => {
                      const nextPlan = event.target.value;
                      setPlanDrafts((prev) => ({ ...prev, [editorCompany.id]: nextPlan }));
                      setCycleDrafts((prev) => ({
                        ...prev,
                        [editorCompany.id]:
                          nextPlan === "BASIC"
                            ? "TRIAL"
                            : (prev[editorCompany.id] === "TRIAL" ? "MONTHLY" : (prev[editorCompany.id] || "MONTHLY"))
                      }));
                      if (nextPlan !== "CUSTOMIZE") {
                        setFeatureDrafts((prev) => ({ ...prev, [editorCompany.id]: planDefaultFeatures[nextPlan] || [] }));
                      } else {
                        setFeatureDrafts((prev) => {
                          const current = prev[editorCompany.id] || editorCompany.specialFeatures || [];
                          return {
                            ...prev,
                            [editorCompany.id]: current.length > 0 ? current : planDefaultFeatures.CUSTOMIZE
                          };
                        });
                      }
                      setLimitDrafts((prev) => ({
                        ...prev,
                        [editorCompany.id]: Math.max(minimumUsers(nextPlan), Number(prev[editorCompany.id] ?? editorCompany.userLimit))
                      }));
                    }}
                    className="mt-1 w-full rounded-lg border border-white/20 bg-transparent px-2 py-1"
                  >
                    {Object.keys(planCatalog).map((catalogPlan) => (
                      <option key={catalogPlan} value={catalogPlan}>
                        {planCatalog[catalogPlan].label} (min {planCatalog[catalogPlan].minUsers})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs text-slate-600 dark:text-slate-200">
                  Billing Cycle
                  <select
                    value={selectedPlan(editorCompany) === "BASIC" ? "TRIAL" : selectedCycle(editorCompany)}
                    onChange={(event) =>
                      setCycleDrafts((prev) => ({ ...prev, [editorCompany.id]: event.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-white/20 bg-transparent px-2 py-1"
                    disabled={selectedPlan(editorCompany) === "BASIC"}
                  >
                    {selectedPlan(editorCompany) === "BASIC" ? (
                      <option value="TRIAL">Trial (7 days)</option>
                    ) : (
                      cycles.map((billingCycle) => (
                        <option key={billingCycle} value={billingCycle}>{formatLabel(billingCycle)}</option>
                      ))
                    )}
                  </select>
                </label>

                <label className="text-xs text-slate-600 dark:text-slate-200">
                  Start Date & Time
                  <input
                    type="datetime-local"
                    value={startDrafts[editorCompany.id] ?? ""}
                    onChange={(event) => setStartDrafts((prev) => ({ ...prev, [editorCompany.id]: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/20 bg-transparent px-2 py-1"
                  />
                </label>

                <label className="text-xs text-slate-600 dark:text-slate-200">
                  User Limit
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setLimitDrafts((prev) => ({
                          ...prev,
                          [editorCompany.id]: Math.max(
                            minimumUsers(selectedPlan(editorCompany)),
                            Number((prev[editorCompany.id] ?? editorCompany.userLimit) - 5)
                          )
                        }))
                      }
                      className="rounded-lg bg-amber-500/15 px-2 py-1 text-xs text-amber-500"
                    >
                      -5
                    </button>
                    <input
                      type="number"
                      min={minimumUsers(selectedPlan(editorCompany))}
                      value={limitDrafts[editorCompany.id] ?? editorCompany.userLimit}
                      onChange={(event) =>
                        setLimitDrafts((prev) => ({
                          ...prev,
                          [editorCompany.id]: Math.max(
                            minimumUsers(selectedPlan(editorCompany)),
                            Number(event.target.value || minimumUsers(selectedPlan(editorCompany)))
                          )
                        }))
                      }
                      className="w-24 rounded-lg border border-white/20 bg-transparent px-2 py-1"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setLimitDrafts((prev) => ({
                          ...prev,
                          [editorCompany.id]: Number(prev[editorCompany.id] ?? editorCompany.userLimit) + 5
                        }))
                      }
                      className="rounded-lg bg-indigo-500/15 px-2 py-1 text-xs text-indigo-500"
                    >
                      +5
                    </button>
                  </div>
                </label>

                <label className="text-xs text-slate-600 dark:text-slate-200">
                  Admin Access
                  <select
                    value={selectedAdminAccess(editorCompany) ? "ENABLED" : "DISABLED"}
                    onChange={(event) =>
                      setAdminAccessDrafts((prev) => ({
                        ...prev,
                        [editorCompany.id]: event.target.value === "ENABLED"
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-white/20 bg-transparent px-2 py-1"
                  >
                    <option value="ENABLED">Enabled</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                </label>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {selectedPlan(editorCompany) === "CUSTOMIZE" ? (
                  <button
                    type="button"
                    onClick={() => {
                      const current = featureDrafts[editorCompany.id] || editorCompany.specialFeatures || [];
                      const seed = current.length > 0 ? current : planDefaultFeatures.CUSTOMIZE;
                      setFeatureDrafts((prev) => ({ ...prev, [editorCompany.id]: seed }));
                      setFeatureDialogDraft(seed);
                      setFeatureDialogCompany(editorCompany);
                    }}
                    className="rounded-lg bg-fuchsia-500/15 px-3 py-1 text-xs text-fuchsia-500"
                  >
                    Customize Features ({selectedFeatures(editorCompany).length})
                  </button>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-300">
                    Features for {planCatalog[selectedPlan(editorCompany)]?.label} are auto-assigned by plan.
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={saveEditor}
                  className="rounded-lg bg-indigo-500/15 px-3 py-1.5 text-sm text-indigo-500"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditorCompany(null)}
                  className="rounded-lg bg-slate-500/15 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {featureDialogCompany &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 px-3"
            onClick={() => setFeatureDialogCompany(null)}
          >
            <div
              className="w-full max-w-2xl rounded-2xl border border-white/20 bg-white p-4 shadow-xl dark:bg-slate-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Customize Features: {featureDialogCompany.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">
                    Select only the features for the Customize plan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFeatureDialogCompany(null)}
                  className="rounded-lg bg-slate-500/15 px-2 py-1 text-xs text-slate-600 dark:text-slate-200"
                >
                  Close
                </button>
              </div>
              <div className="grid gap-1 sm:grid-cols-2">
                {featureOptions.map((feature) => (
                  <label key={feature} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={featureDialogDraft.includes(feature)}
                      onChange={() => {
                        setFeatureDialogDraft((prev) =>
                          prev.includes(feature) ? prev.filter((item) => item !== feature) : [...prev, feature]
                        );
                      }}
                    />
                    <span>{formatLabel(feature)}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const companyId = featureDialogCompany.id;
                    setFeatureDrafts((prev) => ({ ...prev, [companyId]: featureDialogDraft }));
                    await updateCompany(
                      companyId,
                      payloadFor(featureDialogCompany, { specialFeatures: featureDialogDraft })
                    );
                    setFeatureDialogCompany(null);
                  }}
                  className="rounded-lg bg-fuchsia-500/15 px-3 py-1 text-sm text-fuchsia-500"
                >
                  Save Features
                </button>
                <button
                  type="button"
                  onClick={() => setFeatureDialogCompany(null)}
                  className="rounded-lg bg-slate-500/15 px-3 py-1 text-sm text-slate-600 dark:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function MetricCard({ title, value, hint, tone = "indigo" }) {
  const toneMap = {
    indigo: "text-indigo-500",
    rose: "text-rose-500",
    amber: "text-amber-500",
    emerald: "text-emerald-500"
  };
  return (
    <GlassCard>
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">{title}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneMap[tone] || toneMap.indigo}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{hint}</p>
    </GlassCard>
  );
}

