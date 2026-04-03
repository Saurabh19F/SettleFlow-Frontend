import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { subscriptionApi } from "../../api/services";
import PageHeader from "../../components/PageHeader";
import GlassCard from "../../components/GlassCard";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(amount || 0));

const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

export default function OverviewPage() {
  const [companies, setCompanies] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [companiesResponse, dashboardResponse] = await Promise.allSettled([
          subscriptionApi.listCompanies(),
          subscriptionApi.dashboard()
        ]);
        if (companiesResponse.status !== "fulfilled") {
          throw companiesResponse.reason;
        }
        setCompanies(companiesResponse.value.data.data || []);
        if (dashboardResponse.status === "fulfilled") {
          setDashboard(dashboardResponse.value.data.data || null);
        } else {
          setDashboard(null);
        }
      } catch (err) {
        setError(err.message);
      }
    };
    load();
  }, []);

  const metrics = useMemo(() => {
    const total = companies.length;
    const endingSoon = companies.filter((company) => company.subscriptionEndingSoon).length;
    const reachedLimit = companies.filter((company) => company.userLimitReached).length;
    const expired = companies.filter((company) => Number(company.daysUntilSubscriptionEnds) < 0).length;
    const activeUsers = companies.reduce((sum, company) => sum + Number(company.activeUsers || 0), 0);
    return { total, endingSoon, reachedLimit, expired, activeUsers };
  }, [companies]);

  const cards = dashboard?.revenueCards;

  return (
    <div>
      <PageHeader
        title="Super Admin Overview"
        description="Quick platform-level health and navigation for renewals, audits, and subscription controls."
      />

      {error && <p className="mb-3 text-sm text-rose-500">{error}</p>}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Companies" value={metrics.total} hint="Managed tenants" />
        <MetricCard title="Ending In 7 Days" value={metrics.endingSoon} hint="Needs renewal" />
        <MetricCard title="Expired" value={metrics.expired} hint="Subscription expired" tone="rose" />
        <MetricCard title="User Limit Reached" value={metrics.reachedLimit} hint="At/above capacity" tone="amber" />
        <MetricCard title="Active Users" value={metrics.activeUsers} hint="Currently active users" tone="emerald" />
      </div>

      {cards && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard title="MRR" value={formatCurrency(cards.mrr)} hint="Monthly recurring estimate" />
          <MetricCard title="ARR" value={formatCurrency(cards.arr)} hint="Annual recurring estimate" />
          <MetricCard title="Renewal Rate" value={formatPercent(cards.renewalRate)} hint="Last 30 days" tone="emerald" />
          <MetricCard title="Churn Rate" value={formatPercent(cards.churnRate)} hint="Paid subscription churn" tone="rose" />
          <MetricCard title="Trial To Paid" value={formatPercent(cards.trialToPaidConversion)} hint="Conversion rate" tone="amber" />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-4">
        <QuickNavCard
          title="Renewals Queue"
          subtitle="Expiring 7/15/30 day subscriptions with one-click renew."
          to="/super-admin/renewals"
          cta="Open Renewals"
        />
        <QuickNavCard
          title="Plan Requests"
          subtitle="Approve or reject admin upgrade/downgrade requests."
          to="/super-admin/plan-requests"
          cta="Open Requests"
        />
        <QuickNavCard
          title="Audit Trail"
          subtitle="See who changed plans, limits, and subscription windows."
          to="/super-admin/audit"
          cta="Open Audit Trail"
        />
        <QuickNavCard
          title="Subscriptions"
          subtitle="Manage company plan, cycle, users, and special features."
          to="/super-admin/subscriptions"
          cta="Open Subscriptions"
        />
      </div>
    </div>
  );
}

function QuickNavCard({ title, subtitle, to, cta }) {
  return (
    <GlassCard title={title} subtitle={subtitle}>
      <Link to={to} className="inline-flex rounded-lg bg-indigo-500/15 px-3 py-1 text-sm text-indigo-500">
        {cta}
      </Link>
    </GlassCard>
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
