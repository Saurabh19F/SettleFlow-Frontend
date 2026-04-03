import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AppLayout from "./layout/AppLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterCompanyPage from "./pages/auth/RegisterCompanyPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import UsersPage from "./pages/company/UsersPage";
import CompanyProfilePage from "./pages/company/CompanyProfilePage";
import SubscriptionRequestPage from "./pages/company/SubscriptionRequestPage";
import InvoicesPage from "./pages/invoices/InvoicesPage";
import PaymentsPage from "./pages/payments/PaymentsPage";
import ReportsPage from "./pages/reports/ReportsPage";
import LedgerPage from "./pages/ledger/LedgerPage";
import ExpensesPage from "./pages/expenses/ExpensesPage";
import FinancePage from "./pages/finance/FinancePage";
import ActivityLogsPage from "./pages/activity/ActivityLogsPage";
import LoginTimelinePage from "./pages/timeline/LoginTimelinePage";
import TallySyncPage from "./pages/tally/TallySyncPage";
import SubscriptionPage from "./pages/superadmin/SubscriptionPage";
import OverviewPage from "./pages/superadmin/OverviewPage";
import RenewalsPage from "./pages/superadmin/RenewalsPage";
import AuditTrailPage from "./pages/superadmin/AuditTrailPage";
import SubscriptionRequestsPage from "./pages/superadmin/SubscriptionRequestsPage";
import UnauthorizedPage from "./pages/common/UnauthorizedPage";
import LoadingScreen from "./components/LoadingScreen";
import RoleGate from "./routes/RoleGate";

const COMPANY_ROLES = ["ADMIN", "MANAGER", "ACCOUNTANT", "EMPLOYEE", "COLLECTOR", "VIEWER"];

function HomeRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "SUPER_ADMIN") {
    return <Navigate to="/super-admin/overview" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterCompanyPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route element={<RoleGate requireAuth />}>
        <Route element={<AppLayout />}>
          <Route element={<RoleGate roles={COMPANY_ROLES} />}>
            <Route path="/dashboard" element={<RoleGate permissions={["VIEW_DASHBOARD"]}><DashboardPage /></RoleGate>} />
            <Route path="/company/profile" element={<RoleGate roles={["ADMIN", "MANAGER"]}><CompanyProfilePage /></RoleGate>} />
            <Route path="/company/subscription" element={<RoleGate roles={["ADMIN", "MANAGER"]}><SubscriptionRequestPage /></RoleGate>} />
            <Route path="/company/users" element={<RoleGate roles={["ADMIN"]}><UsersPage /></RoleGate>} />
            <Route path="/invoices" element={<RoleGate permissions={["MANAGE_INVOICES"]}><InvoicesPage /></RoleGate>} />
            <Route path="/payments" element={<RoleGate permissions={["RECORD_PAYMENTS"]}><PaymentsPage /></RoleGate>} />
            <Route path="/ledger" element={<RoleGate permissions={["VIEW_REPORTS"]}><LedgerPage /></RoleGate>} />
            <Route path="/expenses" element={<RoleGate roles={["ADMIN", "ACCOUNTANT", "MANAGER"]}><ExpensesPage /></RoleGate>} />
            <Route path="/finance" element={<RoleGate permissions={["VIEW_REPORTS"]}><FinancePage /></RoleGate>} />
            <Route path="/reports" element={<RoleGate permissions={["VIEW_REPORTS"]}><ReportsPage /></RoleGate>} />
            <Route path="/activity-logs" element={<RoleGate permissions={["VIEW_ACTIVITY_LOGS"]}><ActivityLogsPage /></RoleGate>} />
            <Route path="/login-timeline" element={<RoleGate roles={["ADMIN", "MANAGER"]}><LoginTimelinePage /></RoleGate>} />
            <Route path="/tally-sync" element={<RoleGate permissions={["SYNC_TALLY"]}><TallySyncPage /></RoleGate>} />
          </Route>
          <Route path="/super-admin/overview" element={<RoleGate roles={["SUPER_ADMIN"]}><OverviewPage /></RoleGate>} />
          <Route path="/super-admin/renewals" element={<RoleGate roles={["SUPER_ADMIN"]}><RenewalsPage /></RoleGate>} />
          <Route path="/super-admin/audit" element={<RoleGate roles={["SUPER_ADMIN"]}><AuditTrailPage /></RoleGate>} />
          <Route path="/super-admin/plan-requests" element={<RoleGate roles={["SUPER_ADMIN"]}><SubscriptionRequestsPage /></RoleGate>} />
          <Route path="/super-admin/requests" element={<RoleGate roles={["SUPER_ADMIN"]}><Navigate to="/super-admin/plan-requests" replace /></RoleGate>} />
          <Route path="/super-admin/subscriptions" element={<RoleGate roles={["SUPER_ADMIN"]}><SubscriptionPage /></RoleGate>} />
          <Route path="/super-admin" element={<RoleGate roles={["SUPER_ADMIN"]}><Navigate to="/super-admin/overview" replace /></RoleGate>} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
