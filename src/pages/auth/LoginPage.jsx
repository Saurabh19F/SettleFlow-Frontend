import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login({
        email: form.email.trim().toLowerCase(),
        password: form.password
      });
      navigate(user.role === "SUPER_ADMIN" ? "/super-admin/overview" : "/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.form
        onSubmit={onSubmit}
        className="glass w-full max-w-md rounded-2xl p-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="gradient-text text-3xl font-semibold">SettleFlow</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Secure login for your payment collection workspace.</p>

        <div className="mt-6 space-y-4">
          <Input label="Email" type="email" value={form.email} onChange={(value) => setForm((prev) => ({ ...prev, email: value }))} />
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(value) => setForm((prev) => ({ ...prev, password: value }))}
            action={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-xs text-cyan-500"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            }
          />
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <button
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">
          New company? <Link className="text-indigo-500" to="/register">Create account</Link>
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
          Forgot password? <Link className="text-cyan-500" to="/forgot-password">Reset here</Link>
        </p>
      </motion.form>
    </div>
  );
}

function Input({ label, type, value, onChange, action }) {
  return (
    <label className="block text-sm text-slate-600 dark:text-slate-200">
      <span className="flex items-center justify-between">
        <span>{label}</span>
        {action}
      </span>
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
