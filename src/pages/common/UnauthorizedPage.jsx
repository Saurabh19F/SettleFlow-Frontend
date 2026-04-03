import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="glass flex min-h-[60vh] flex-col items-center justify-center rounded-2xl p-6 text-center">
      <ShieldX className="h-12 w-12 text-rose-500" />
      <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">Access denied</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">You do not have permission to access this module.</p>
    </div>
  );
}