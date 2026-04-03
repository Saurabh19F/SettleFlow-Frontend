import { Bell, Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="glass relative flex flex-col gap-3 overflow-hidden rounded-2xl px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />
      <div className="min-w-0">
        <p className="truncate text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300 sm:text-xs sm:tracking-[0.25em]">
          Premium Collection Suite
        </p>
        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
          {user?.role === "SUPER_ADMIN" ? "Super Admin Console" : (user?.companyName || "SettleFlow Cloud")}
        </p>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={toggleTheme}
          className="rounded-xl border border-white/20 bg-white/30 p-2 text-slate-600 transition hover:-translate-y-0.5 hover:bg-white/50 dark:bg-slate-900/40 dark:text-slate-200"
          aria-label="toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button className="rounded-xl border border-white/20 bg-white/30 p-2 text-slate-600 transition hover:-translate-y-0.5 hover:bg-white/50 dark:bg-slate-900/40 dark:text-slate-200" aria-label="notifications">
          <Bell className="h-4 w-4" />
        </button>
        <button
          onClick={handleLogout}
          className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-2 text-rose-500 transition hover:-translate-y-0.5 hover:bg-rose-500/15"
          aria-label="logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
