import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, UserPlus, XCircle } from "lucide-react";
import { companyApi } from "../../api/services";
import PageHeader from "../../components/PageHeader";
import GlassCard from "../../components/GlassCard";
import Badge from "../../components/Badge";
import MetricCard from "../../components/MetricCard";
import PaginationControls from "../../components/PaginationControls";
import SearchInputWithSuggestions from "../../components/SearchInputWithSuggestions";
import { collectSuggestions } from "../../utils/suggestions";

const COUNTRY_CODES = ["+91", "+1", "+44", "+61", "+971", "+65"];
const DESIGNATION_OPTIONS = ["ADMIN", "ACCOUNTANT", "VIEWER", "COLLECTOR", "MANAGER", "EMPLOYEE"];
const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "INTERN"];
const SHIFT_OPTIONS = ["DAY", "NIGHT"];
const WORKING_DAY_OPTIONS = ["MON_FRI", "MON_SAT", "ALL_DAYS"];
const ITEMS_PER_PAGE = 10;

const defaultForm = {
  fullName: "",
  gender: "MALE",
  dateOfBirth: "",
  profilePhotoUrl: "",
  phoneCode: "+91",
  phone: "",
  email: "",
  designation: "EMPLOYEE",
  joiningDate: "",
  employmentType: "FULL_TIME",
  workLocation: "",
  shiftTiming: "DAY",
  workingDays: "MON_FRI",
  reportingManager: "",
  username: "",
  password: ""
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingUserId, setEditingUserId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const load = async () => {
    try {
      const usersResponse = await companyApi.listUsers();
      setUsers(usersResponse.data.data || []);
      setPage(1);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const buildPayload = () => {
    const role = form.designation === "EMPLOYEE" ? "EMPLOYEE" : form.designation;
    return {
      fullName: form.fullName,
      gender: form.gender,
      dateOfBirth: form.dateOfBirth,
      profilePhotoUrl: form.profilePhotoUrl || "",
      phone: form.phone ? `${form.phoneCode}${form.phone.replace(/\D/g, "")}` : "",
      email: form.email,
      currentAddress: "",
      permanentAddress: "",
      emergencyContactNumber: "",
      aadhaarNumber: "",
      panCardNumber: "",
      passportNumber: "",
      department: "",
      designation: form.designation,
      joiningDate: form.joiningDate,
      employmentType: form.employmentType,
      workLocation: form.workLocation,
      salaryMonthly: null,
      bankName: "",
      bankAccountNumber: "",
      ifscCode: "",
      uanOrPfNumber: "",
      shiftTiming: form.shiftTiming,
      workingDays: form.workingDays,
      leaveBalance: null,
      reportingManager: form.reportingManager,
      username: form.username,
      password: form.password,
      role
    };
  };

  const createOrUpdateUser = async (event) => {
    event.preventDefault();
    try {
      const payload = buildPayload();
      if (editingUserId) {
        if (!payload.password) {
          delete payload.password;
        }
        await companyApi.updateUser(editingUserId, payload);
      } else {
        await companyApi.createUser(payload);
      }
      resetForm();
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteUser = async (id) => {
    try {
      await companyApi.deleteUser(id);
      if (editingUserId === id) {
        resetForm();
      }
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (user) => {
    setEditingUserId(user.id);
    setShowForm(true);
    const fullPhone = user.phone || "";
    const codeMatch = COUNTRY_CODES.find((code) => fullPhone.startsWith(code));
    const phoneCode = codeMatch || "+91";
    const phone = codeMatch ? fullPhone.slice(codeMatch.length) : fullPhone.replace(/^\+\d{1,3}/, "");

    setForm({
      fullName: user.fullName || "",
      gender: user.gender || "MALE",
      dateOfBirth: user.dateOfBirth || "",
      profilePhotoUrl: user.profilePhotoUrl || "",
      phoneCode,
      phone: phone || "",
      email: user.email || "",
      designation: user.designation || user.role || "EMPLOYEE",
      joiningDate: user.joiningDate || "",
      employmentType: user.employmentType || "FULL_TIME",
      workLocation: user.workLocation || "",
      shiftTiming: user.shiftTiming || "DAY",
      workingDays: user.workingDays || "MON_FRI",
      reportingManager: user.reportingManager || "",
      username: user.username || "",
      password: ""
    });
    setError("");
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditingUserId(null);
  };

  const roleOptions = useMemo(() => {
    const values = Array.from(new Set(users.map((user) => user.role).filter(Boolean)));
    return ["ALL", ...Array.from(new Set([...DESIGNATION_OPTIONS, ...values]))];
  }, [users]);

  const searchSuggestions = useMemo(
    () => collectSuggestions(users, ["fullName", "employeeId", "email", "phone", "role", "designation", "username"]),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      if (!q) {
        return matchesRole;
      }
      const haystack = [
        user.fullName || "",
        user.employeeId || "",
        user.email || "",
        user.phone || "",
        user.role || "",
        user.designation || "",
        user.username || ""
      ]
        .join(" ")
        .toLowerCase();
      return matchesRole && haystack.includes(q);
    });
  }, [users, query, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const pageUsers = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, page]);

  const fromRow = filteredUsers.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const toRow = Math.min(page * ITEMS_PER_PAGE, filteredUsers.length);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [query, roleFilter]);

  const stats = useMemo(() => {
    const adminCount = users.filter((user) => user.role === "ADMIN").length;
    const employeeCount = users.filter((user) => user.role === "EMPLOYEE").length;
    return { total: users.length, adminCount, employeeCount };
  }, [users]);

  return (
    <div className="pb-20 md:pb-0">
      <PageHeader title="Company Users" description="Simplified employee registration and directory management." />
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <MetricCard title="Total Users" value={stats.total} hint="All registered users" />
        <MetricCard title="Admins" value={stats.adminCount} hint="Admin role users" tone="amber" />
        <MetricCard title="Employees" value={stats.employeeCount} hint="Employee role users" tone="emerald" />
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500/15 px-3 py-2 text-sm text-indigo-500 sm:w-auto"
        >
          <UserPlus className="h-4 w-4" /> Add Team Member
        </button>
      </div>

      <div className="space-y-4">
        <GlassCard
          title="User Directory"
          subtitle="Search, filter, edit and manage users"
          action={<span className="rounded-lg bg-indigo-500/15 px-2 py-1 text-xs text-indigo-500">{filteredUsers.length} users</span>}
        >
          {error && <p className="mb-3 text-sm text-rose-500">{error}</p>}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SearchInputWithSuggestions
              value={query}
              onChange={setQuery}
              placeholder="Search name, employee ID, username"
              suggestions={searchSuggestions}
            />
            <div className="w-full overflow-x-auto">
              <div className="flex w-max gap-1 pr-2">
                {roleOptions.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setRoleFilter(role)}
                    className={`whitespace-nowrap rounded-lg px-2 py-1 text-xs ${
                      roleFilter === role ? "bg-indigo-500/20 text-indigo-500" : "bg-slate-500/15 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {role === "ALL" ? "All Roles" : formatDesignation(role)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {pageUsers.map((user) => (
              <div key={user.id} className="rounded-xl border border-white/10 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user.fullName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">{user.employeeId || "-"} | {formatDesignation(user.designation || user.role || "-")}</p>
                    <p className="break-all text-xs text-slate-500 dark:text-slate-300">{user.email}</p>
                    <p className="break-all text-xs text-slate-500 dark:text-slate-300">{user.phone || "-"} | @{user.username || "-"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{user.role}</Badge>
                    <button
                      type="button"
                      onClick={() => startEdit(user)}
                      className="rounded-lg p-1 text-indigo-500 transition hover:bg-indigo-500/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteUser(user.id)}
                      className="rounded-lg p-1 text-rose-500 transition hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {pageUsers.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-300">
                No users found for the selected filter.
              </p>
            )}
          </div>

          <PaginationControls
            page={page}
            totalPages={totalPages}
            fromRow={fromRow}
            toRow={toRow}
            totalRows={filteredUsers.length}
            onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          />
        </GlassCard>

        <GlassCard
          title={editingUserId ? "Edit Team Member" : "Add Team Member"}
          subtitle="Compact Employee Registration"
          action={
            showForm ? (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-500/15 px-2 py-1 text-xs text-slate-600 dark:text-slate-200"
              >
                <XCircle className="h-3.5 w-3.5" /> Hide Form
              </button>
            ) : null
          }
        >
          {!showForm ? (
            <div className="rounded-xl border border-dashed border-white/20 p-4 text-sm text-slate-500 dark:text-slate-300">
              Form hidden to keep page clean. Click <span className="font-semibold text-indigo-500">Add Team Member</span> to open.
            </div>
          ) : (
            <form className="grid gap-3 md:grid-cols-2" onSubmit={createOrUpdateUser}>
              <SectionTitle title="Basic Information" className="md:col-span-2" />
              <Input label="Full Name" value={form.fullName} onChange={(v) => setForm((s) => ({ ...s, fullName: v }))} />
              <SelectInput label="Gender" value={form.gender} onChange={(v) => setForm((s) => ({ ...s, gender: v }))} options={["MALE", "FEMALE", "OTHER"]} />
              <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(v) => setForm((s) => ({ ...s, dateOfBirth: v }))} />
              <Input label="Profile Photo URL (optional)" required={false} value={form.profilePhotoUrl} onChange={(v) => setForm((s) => ({ ...s, profilePhotoUrl: v }))} />

              <SectionTitle title="Contact Details" className="md:col-span-2" />
              <PhoneInput
                label="Mobile Number"
                code={form.phoneCode}
                number={form.phone}
                onCodeChange={(value) => setForm((s) => ({ ...s, phoneCode: value }))}
                onNumberChange={(value) => setForm((s) => ({ ...s, phone: value }))}
              />
              <Input label="Email Address" type="email" value={form.email} onChange={(v) => setForm((s) => ({ ...s, email: v }))} />

              <SectionTitle title="Job Information" className="md:col-span-2" />
              <SelectInput
                label="Designation"
                value={form.designation}
                onChange={(v) => setForm((s) => ({ ...s, designation: v }))}
                options={DESIGNATION_OPTIONS}
                formatOption={formatDesignation}
              />
              <Input label="Joining Date" type="date" value={form.joiningDate} onChange={(v) => setForm((s) => ({ ...s, joiningDate: v }))} />
              <SelectInput
                label="Employment Type"
                value={form.employmentType}
                onChange={(v) => setForm((s) => ({ ...s, employmentType: v }))}
                options={EMPLOYMENT_TYPES}
                formatOption={formatEmploymentType}
              />
              <Input label="Work Location" value={form.workLocation} onChange={(v) => setForm((s) => ({ ...s, workLocation: v }))} />

              <SectionTitle title="Attendance & Work Details" className="md:col-span-2" />
              <SelectInput
                label="Shift Timing"
                value={form.shiftTiming}
                onChange={(v) => setForm((s) => ({ ...s, shiftTiming: v }))}
                options={SHIFT_OPTIONS}
                formatOption={formatShift}
              />
              <SelectInput
                label="Working Days"
                value={form.workingDays}
                onChange={(v) => setForm((s) => ({ ...s, workingDays: v }))}
                options={WORKING_DAY_OPTIONS}
                formatOption={formatWorkingDays}
              />
              <Input label="Manager / Reporting Person" value={form.reportingManager} onChange={(v) => setForm((s) => ({ ...s, reportingManager: v }))} />
              <div />

              <SectionTitle title="Login & System Access" className="md:col-span-2" />
              <Input label="Username" value={form.username} onChange={(v) => setForm((s) => ({ ...s, username: v }))} />
              <Input
                label={editingUserId ? "Password (leave blank to keep old)" : "Password"}
                type="password"
                required={!editingUserId}
                value={form.password}
                onChange={(v) => setForm((s) => ({ ...s, password: v }))}
              />

              <button className="md:col-span-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-white">
                <UserPlus className="h-4 w-4" /> {editingUserId ? "Save Changes" : "Register Employee"}
              </button>
            </form>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function SectionTitle({ title, className = "" }) {
  return <p className={`text-sm font-semibold text-indigo-500 ${className}`}>{title}</p>;
}

function Input({ label, value, onChange, type = "text", required = true }) {
  return (
    <label className="block text-sm text-slate-600 dark:text-slate-200">
      {label}
      <input
        className="mt-1 w-full rounded-xl border border-white/30 bg-white/20 px-3 py-2 outline-none ring-indigo-400 focus:ring-2 dark:border-white/10 dark:bg-slate-800/60"
        value={value}
        type={type}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

function SelectInput({ label, value, onChange, options, required = true, formatOption = (option) => option }) {
  return (
    <label className="block text-sm text-slate-600 dark:text-slate-200">
      {label}
      <select
        className="mt-1 w-full rounded-xl border border-white/30 bg-white/20 px-3 py-2 dark:border-white/10 dark:bg-slate-800/60"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      >
        {options.map((option) => (
          <option key={option} value={option}>{formatOption(option)}</option>
        ))}
      </select>
    </label>
  );
}

function PhoneInput({ label, code, number, onCodeChange, onNumberChange }) {
  return (
    <label className="block text-sm text-slate-600 dark:text-slate-200">
      {label}
      <div className="mt-1 grid grid-cols-4 gap-2">
        <select
          className="rounded-xl border border-white/30 bg-white/20 px-3 py-2 dark:border-white/10 dark:bg-slate-800/60"
          value={code}
          onChange={(event) => onCodeChange(event.target.value)}
        >
          {COUNTRY_CODES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <input
          className="col-span-3 rounded-xl border border-white/30 bg-white/20 px-3 py-2 outline-none ring-indigo-400 focus:ring-2 dark:border-white/10 dark:bg-slate-800/60"
          type="tel"
          inputMode="numeric"
          value={number}
          onChange={(event) => onNumberChange(event.target.value.replace(/\D/g, ""))}
          required
        />
      </div>
    </label>
  );
}

function formatEmploymentType(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatWorkingDays(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatShift(value) {
  return value === "DAY" ? "Day" : value === "NIGHT" ? "Night" : value;
}

function formatDesignation(value) {
  if (value === "EMPLOYEE") {
    return "Employees";
  }
  return String(value || "")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
