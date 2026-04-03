import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { authApi } from "../../api/services";

const COUNTRY_CODES = ["+91", "+1", "+44", "+61", "+971", "+65"];

export default function RegisterCompanyPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: "",
    adminName: "",
    email: "",
    password: "",
    gstin: "",
    address: "",
    creditLimit: "0"
  });
  const [phoneCode, setPhoneCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        creditLimit: Number(form.creditLimit || 0),
        phone: `${phoneCode}${phoneNumber.replace(/\D/g, "")}`
      };
      await authApi.registerCompany(payload);
      setSuccess("Company registered successfully. Please login.");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.form
        onSubmit={submit}
        className="glass w-full max-w-lg rounded-2xl p-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Create Company Workspace</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Launch a secure tenant with an admin account in under a minute.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            ["Company Name", "companyName"],
            ["Admin Name", "adminName"],
            ["Email", "email"],
            ["Password", "password"],
            ["GSTIN (optional)", "gstin"],
            ["Credit Limit", "creditLimit"]
          ].map(([label, key]) => (
            <label key={key} className={`block text-sm text-slate-600 dark:text-slate-200 ${key === "password" ? "md:col-span-2" : ""}`}>
              {label}
              <input
                className="field mt-1"
                type={key === "password" ? "password" : key === "email" ? "email" : key === "creditLimit" ? "number" : "text"}
                value={form[key]}
                onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
                required={key !== "gstin"}
              />
            </label>
          ))}
          <label className="md:col-span-2 block text-sm text-slate-600 dark:text-slate-200">
            Address
            <textarea
              className="field mt-1 min-h-24"
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              required
            />
          </label>
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-600 dark:text-slate-200">
              Phone
            </label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              <select
                value={phoneCode}
                onChange={(event) => setPhoneCode(event.target.value)}
                className="field"
              >
                {COUNTRY_CODES.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              <input
                className="field col-span-2"
                type="tel"
                inputMode="numeric"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value.replace(/\D/g, ""))}
                placeholder="Phone number"
                required
              />
            </div>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}
        {success && <p className="mt-3 text-sm text-emerald-500">{success}</p>}

        <button
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Registering..." : "Create Company"}
        </button>

        <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">
          Already onboarded? <Link className="text-indigo-500" to="/login">Sign in</Link>
        </p>
      </motion.form>
    </div>
  );
}
