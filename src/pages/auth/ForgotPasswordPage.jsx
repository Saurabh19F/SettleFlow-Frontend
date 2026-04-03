import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { authApi } from "../../api/services";

export default function ForgotPasswordPage() {
  const [requestForm, setRequestForm] = useState({ email: "" });
  const [resetForm, setResetForm] = useState({ email: "", otp: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  const requestOtp = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoadingRequest(true);
    try {
      await authApi.forgotPassword(requestForm);
      setMessage("OTP sent to your registered phone via Twilio.");
      setResetForm((prev) => ({ ...prev, email: requestForm.email }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingRequest(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoadingReset(true);
    try {
      await authApi.resetPassword(resetForm);
      setMessage("Password updated. You can now sign in.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div className="glass w-full max-w-2xl rounded-2xl p-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Recover Access</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Request OTP and reset your password securely.</p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <form onSubmit={requestOtp} className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">1. Request OTP</h2>
            <Input label="Email" type="email" value={requestForm.email} onChange={(value) => setRequestForm({ email: value })} />
            <button
              disabled={loadingRequest}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2.5 text-white disabled:opacity-60"
            >
              {loadingRequest ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>

          <form onSubmit={resetPassword} className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">2. Reset Password</h2>
            <Input label="Email" type="email" value={resetForm.email} onChange={(value) => setResetForm((s) => ({ ...s, email: value }))} />
            <Input label="OTP" value={resetForm.otp} onChange={(value) => setResetForm((s) => ({ ...s, otp: value }))} />
            <Input label="New Password" type="password" value={resetForm.newPassword} onChange={(value) => setResetForm((s) => ({ ...s, newPassword: value }))} />
            <button
              disabled={loadingReset}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2.5 text-white disabled:opacity-60"
            >
              {loadingReset ? "Updating..." : "Reset Password"}
            </button>
          </form>
        </div>

        {error && <p className="mt-4 text-sm text-rose-500">{error}</p>}
        {message && <p className="mt-4 text-sm text-emerald-500">{message}</p>}

        <p className="mt-6 text-sm text-slate-500 dark:text-slate-300">
          Back to <Link className="text-indigo-500" to="/login">login</Link>
        </p>
      </motion.div>
    </div>
  );
}

function Input({ label, type = "text", value, onChange }) {
  return (
    <label className="block text-sm text-slate-600 dark:text-slate-200">
      {label}
      <input
        className="field mt-1"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </label>
  );
}
