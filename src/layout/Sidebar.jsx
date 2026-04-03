import { LayoutGrid, ReceiptText, Wallet, BarChart3, History, Timer, RefreshCcw, Building2, ChevronLeft, ChevronRight, BookOpenText, Landmark, HandCoins } from "lucide-react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const companyLinks = [
  { to: "/dashboard", icon: LayoutGrid, label: "Dashboard", permission: "VIEW_DASHBOARD" },
  { to: "/company/profile", icon: Building2, label: "Company", roles: ["ADMIN", "MANAGER"] },
  { to: "/company/subscription", icon: Timer, label: "Subscription", roles: ["ADMIN", "MANAGER"] },
  { to: "/company/users", icon: Building2, label: "Users", roles: ["ADMIN"] },
  { to: "/invoices", icon: ReceiptText, label: "Invoices", permission: "MANAGE_INVOICES" },
  { to: "/payments", icon: Wallet, label: "Payments", permission: "RECORD_PAYMENTS" },
  { to: "/ledger", icon: BookOpenText, label: "Ledger", permission: "VIEW_REPORTS" },
  { to: "/expenses", icon: HandCoins, label: "Expenses", roles: ["ADMIN", "ACCOUNTANT", "MANAGER"] },
  { to: "/finance", icon: Landmark, label: "Finance", permission: "VIEW_REPORTS" },
  { to: "/reports", icon: BarChart3, label: "Reports", permission: "VIEW_REPORTS" },
  { to: "/activity-logs", icon: History, label: "Activity Logs", permission: "VIEW_ACTIVITY_LOGS" },
  { to: "/login-timeline", icon: Timer, label: "Login Timeline", roles: ["ADMIN", "MANAGER"] },
  { to: "/tally-sync", icon: RefreshCcw, label: "Tally Sync", permission: "SYNC_TALLY" }
];

const superAdminLinks = [
  { to: "/super-admin/overview", icon: LayoutGrid, label: "Overview" },
  { to: "/super-admin/renewals", icon: Timer, label: "Renewals" },
  { to: "/super-admin/plan-requests", icon: ReceiptText, label: "Plan Requests" },
  { to: "/super-admin/audit", icon: History, label: "Audit Trail" },
  { to: "/super-admin/subscriptions", icon: Building2, label: "Subscriptions" }
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const links = user?.role === "SUPER_ADMIN"
    ? superAdminLinks
    : companyLinks.filter((link) => {
      if (link.roles && !link.roles.includes(user?.role)) {
        return false;
      }
      if (link.permission) {
        return (user?.permissions || []).includes(link.permission);
      }
      return true;
    });

  return (
    <>
      <motion.aside
        className={`glass sticky top-3 hidden h-[calc(100vh-1.5rem)] shrink-0 self-start overflow-hidden rounded-2xl p-3 md:block ${collapsed ? "w-20" : "w-64"}`}
        animate={{ width: collapsed ? 80 : 256 }}
        transition={{ duration: 0.2 }}
      >
        <div className="pointer-events-none absolute -right-10 top-10 h-36 w-36 rounded-full bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 blur-2xl" />
        <div className="mb-6 flex items-center justify-between px-2">
          {!collapsed && <p className="gradient-text text-xl font-semibold">SettleFlow</p>}
          <button onClick={onToggle} className="rounded-lg border border-white/20 p-1.5 text-slate-500 transition hover:bg-white/10">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <nav className="space-y-1">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative z-[1] flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500/80 to-cyan-500/70 text-white shadow-glow"
                    : "text-slate-600 hover:-translate-y-0.5 hover:bg-white/20 dark:text-slate-300 dark:hover:bg-white/10"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </motion.aside>

      <div className="glass fixed bottom-3 left-3 right-3 z-40 rounded-2xl p-2 md:hidden">
        <nav className="grid grid-cols-5 gap-1">
          {links.slice(0, 10).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center rounded-xl px-2 py-1.5 text-[10px] ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500/80 to-cyan-500/70 text-white"
                    : "text-slate-600 hover:bg-white/20 dark:text-slate-300"
                }`
              }
            >
              <item.icon className="h-3.5 w-3.5" />
              <span className="mt-1 truncate">{item.label.split(" ")[0]}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
}
