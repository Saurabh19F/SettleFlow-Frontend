import client from "./client";

export const authApi = {
  registerCompany: (payload) => client.post("/auth/register-company", payload),
  login: (payload) => client.post("/auth/login", payload),
  logout: () => client.post("/auth/logout"),
  forgotPassword: (payload) => client.post("/auth/forgot-password", payload),
  resetPassword: (payload) => client.post("/auth/reset-password", payload)
};

export const dashboardApi = {
  metrics: () => client.get("/reports/dashboard")
};

export const companyApi = {
  profile: () => client.get("/company/profile"),
  updateProfile: (payload) => client.put("/company/profile", payload),
  listSubscriptionRequests: () => client.get("/company/subscription-requests"),
  createSubscriptionRequest: (payload) => client.post("/company/subscription-requests", payload),
  listUsers: () => client.get("/users"),
  createUser: (payload) => client.post("/users", payload),
  updateUser: (id, payload) => client.put(`/users/${id}`, payload),
  deleteUser: (id) => client.delete(`/users/${id}`),
  roles: () => client.get("/roles")
};

export const invoiceApi = {
  list: (params) => client.get("/invoices", { params }),
  getById: (id) => client.get(`/invoices/${id}`),
  create: (payload) => client.post("/invoices", payload),
  update: (id, payload) => client.put(`/invoices/${id}`, payload),
  delete: (id) => client.delete(`/invoices/${id}`),
  markBadDebt: (id, reason) => client.put(`/invoices/${id}/mark-bad-debt`, null, { params: { reason } }),
  downloadPdf: (id) => client.get(`/invoices/${id}/pdf`, { responseType: "blob" })
};

export const paymentApi = {
  list: () => client.get("/payments"),
  create: (payload) => client.post("/payments", payload),
  update: (id, payload) => client.put(`/payments/${id}`, payload)
};

export const reportApi = {
  revenue: () => client.get("/reports/revenue"),
  outstanding: () => client.get("/reports/outstanding"),
  userActivity: () => client.get("/reports/user-activity")
};

export const activityApi = {
  list: () => client.get("/activity-logs")
};

export const timelineApi = {
  list: () => client.get("/login-timeline")
};

export const tallyApi = {
  importInvoices: () => client.post("/tally/import-invoices"),
  exportPayments: () => client.post("/tally/export-payments"),
  status: () => client.get("/tally/status"),
  exportLedgerJson: () => client.get("/tally/export/ledger.json", { responseType: "blob" }),
  exportVouchersCsv: () => client.get("/tally/export/vouchers.csv", { responseType: "blob" })
};

export const subscriptionApi = {
  listCompanies: () => client.get("/super-admin/companies"),
  dashboard: () => client.get("/super-admin/companies/dashboard"),
  updateCompany: (id, payload) => client.put(`/super-admin/companies/${id}/subscription`, payload),
  renewCompany: (id) => client.post(`/super-admin/companies/${id}/renew`),
  listChangeRequests: (params) => client.get("/super-admin/subscription-requests", { params }),
  decideChangeRequest: (id, payload) => client.post(`/super-admin/subscription-requests/${id}/decision`, payload),
  deleteCompany: (id) => client.delete(`/super-admin/companies/${id}`)
};

export const ledgerApi = {
  list: (clientName) => client.get("/ledger", { params: clientName ? { client: clientName } : undefined })
};

export const expenseApi = {
  list: () => client.get("/expenses"),
  create: (payload) => client.post("/expenses", payload),
  remove: (id) => client.delete(`/expenses/${id}`),
  monthlyReport: (year) => client.get("/expenses/monthly-report", { params: { year } })
};

export const financeApi = {
  summary: () => client.get("/finance/summary")
};

export const reminderApi = {
  sendPaymentReminder: (invoiceId, channel) => client.post(`/reminders/payment/${invoiceId}`, null, { params: { channel } }),
  overdueAlerts: () => client.get("/reminders/overdue-alerts"),
  creditLimitWarning: () => client.get("/reminders/credit-limit-warning")
};

export const exchangeApi = {
  rate: (params) => client.get("/exchange/rate", { params })
};

export const gstinApi = {
  validate: (gstin) => client.get(`/gstin/validate/${gstin}`)
};
