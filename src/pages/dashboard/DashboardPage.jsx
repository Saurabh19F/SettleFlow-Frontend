import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BadgeDollarSign, CircleDollarSign, Clock3, HandCoins } from "lucide-react";
import { dashboardApi } from "../../api/services";
import StatCard from "../../components/StatCard";
import GlassCard from "../../components/GlassCard";
import PageHeader from "../../components/PageHeader";

const fallback = {
  totals: {
    revenue: "$128,440.00",
    outstanding: "$23,910.00",
    expenses: "$42,300.00",
    profit: "$86,140.00"
  },
  trend: [
    { label: "Mon", revenue: 18, outstanding: 8 },
    { label: "Tue", revenue: 21, outstanding: 7 },
    { label: "Wed", revenue: 24, outstanding: 6 },
    { label: "Thu", revenue: 22, outstanding: 7 },
    { label: "Fri", revenue: 30, outstanding: 5 },
    { label: "Sat", revenue: 26, outstanding: 6 }
  ],
  monthly: [
    { month: "Jan", amount: 52 },
    { month: "Feb", amount: 61 },
    { month: "Mar", amount: 76 },
    { month: "Apr", amount: 74 },
    { month: "May", amount: 82 },
    { month: "Jun", amount: 91 }
  ],
  aging: [
    { name: "Current", value: 58 },
    { name: "7-30 Days", value: 25 },
    { name: "31+ Days", value: 17 }
  ]
};

export default function DashboardPage() {
  const [data, setData] = useState(fallback);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await dashboardApi.metrics();
        setData(response.data.data);
      } catch {
        setData(fallback);
      }
    };
    load();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Total Revenue",
        value: data.totals.revenue,
        trend: "Collections booked",
        icon: BadgeDollarSign,
        valueTone: "emerald",
        iconTone: "emerald"
      },
      {
        label: "Outstanding",
        value: data.totals.outstanding,
        trend: "Pending from clients",
        icon: Clock3,
        valueTone: "amber",
        iconTone: "amber"
      },
      {
        label: "Expenses",
        value: data.totals.expenses,
        trend: "Operational outflow",
        icon: HandCoins,
        valueTone: "rose",
        iconTone: "rose"
      },
      {
        label: "Profit",
        value: data.totals.profit,
        trend: "Net position",
        icon: CircleDollarSign,
        valueTone: "indigo",
        iconTone: "indigo"
      }
    ],
    [data]
  );

  return (
    <div>
      <PageHeader title="Dashboard" description="Premium receivables control center with revenue, cash flow, and aging visibility." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <GlassCard title="Revenue vs Outstanding" subtitle="Last 6 days" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="out" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 14, background: "rgba(15,23,42,0.88)", border: "1px solid rgba(148,163,184,0.2)" }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#rev)" strokeWidth={2} />
                <Area type="monotone" dataKey="outstanding" stroke="#06b6d4" fill="url(#out)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard title="Monthly Revenue" subtitle="Collection trend">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 14, background: "rgba(15,23,42,0.88)", border: "1px solid rgba(148,163,184,0.2)" }} />
                <Bar dataKey="amount" fill="url(#barFill)" radius={[10, 10, 0, 0]} />
                <defs>
                  <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard title="Aging Snapshot" subtitle="Receivable quality by overdue bucket" className="mt-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.aging || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
