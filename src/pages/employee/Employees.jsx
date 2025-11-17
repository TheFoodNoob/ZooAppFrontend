// src/pages/employee/Employees.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import Toast from "../../components/Toast";
import { fetchAuth, parseJsonWithDetail } from "../../utils/fetchAuth";

const ROLES = ["keeper","vet","gate_agent","ops_manager","retail","coordinator","security","admin"];
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRe = /^(\+1\s?)?(?:\(?[2-9][0-9]{2}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})$/;
const MAX_SALARY_CENTS = 1_000_000_000;

export default function Employees() {
  const { token, user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [toast, setToast] = useState({ open: false, type: "success", text: "" });
  const showToast = (type, text) => setToast({ open: true, type, text });

  const [q, setQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    department_id: 1, first_name: "", last_name: "", email: "",
    role: "keeper", job_title: "", password: "",
    phone: "", ssn: "", description: "", salary_cents: "",
  });
  const [fe, setFe] = useState({});

  const Help = ({ children }) => (
    <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>{children}</div>
  );
  const FieldError = ({ msg }) => (msg ? <div style={{ color: "#a40000", fontSize: 12, marginTop: 4 }}>{msg}</div> : null);

  const nulled = (v) => (v === "" ? null : v);
  function cleanEmployeePayload(f) {
    return {
      department_id: Number(f.department_id) || 1,
      first_name: f.first_name.trim(),
      last_name: f.last_name.trim(),
      email: f.email.trim(),
      role: f.role,
      job_title: nulled(f.job_title?.trim?.() ?? ""),
      password: f.password,
      phone: nulled(f.phone?.trim?.() ?? ""),
      ssn: nulled(f.ssn?.trim?.() ?? ""),
      description: nulled(f.description?.trim?.() ?? ""),
      salary_cents: f.salary_cents === "" ? null : Number(f.salary_cents),
    };
  }

  function validateField(name, value) {
    const v = (value ?? "").toString();
    switch (name) {
      case "first_name": {
        const s = v.trim();
        if (!s) return "First name is required.";
        if (s.length > 50) return "First name must be ≤ 50 chars.";
        return "";
      }
      case "last_name": {
        const s = v.trim();
        if (!s) return "Last name is required.";
        if (s.length > 50) return "Last name must be ≤ 50 chars.";
        return "";
      }
      case "email": {
        const s = v.trim();
        if (!s) return "Email is required.";
        if (!emailRe.test(s)) return "Email format is invalid (e.g., name@example.com).";
        if (s.length > 100) return "Email must be ≤ 100 chars.";
        return "";
      }
      case "password": {
        const s = v;
        if (!s) return "Temporary password is required.";
        if (s.length < 8) return "Password must be at least 8 characters.";
        if (!/[A-Za-z]/.test(s) || !/\d/.test(s))
          return "Password must contain at least one letter and one number.";
        return "";
      }
      case "department_id": {
        const n = Number(v);
        if (!Number.isInteger(n) || n < 1) return "Department ID must be an integer ≥ 1.";
        return "";
      }
      case "role": {
        if (!ROLES.includes(v)) return "Invalid role.";
        return "";
      }
      case "phone": {
        const s = v.trim();
        if (!s) return "";
        if (!phoneRe.test(s))
          return "Phone must look like 555-123-4567, (555) 123-4567, or +1 555-123-4567.";
        return "";
      }
      case "salary_cents": {
        if (v === "") return "";
        if (!/^\d+$/.test(v) || Number(v) < 0)
          return "Salary must be a non-negative integer in cents (e.g., 5500000 for $55,000).";
        if (Number(v) > MAX_SALARY_CENTS)
          return "Salary is unusually high; please check the amount in cents.";
        return "";
      }
      case "ssn": {
        if (!v) return "";
        if (!/^\d{3}-\d{2}-\d{4}$/.test(v)) return "SSN must be in the format 123-45-6789.";
        return "";
      }
      case "job_title": {
        if (v && v.length > 80) return "Job title must be ≤ 80 chars.";
        return "";
      }
      case "description": {
        if (v && v.length > 250) return "Description must be ≤ 250 chars.";
        return "";
      }
      default:
        return "";
    }
  }

  function validateAll(f) {
    const fields = ["first_name","last_name","email","password","department_id","role","phone","salary_cents","ssn","job_title","description"];
    const next = {};
    fields.forEach(k => {
      const msg = validateField(k, f[k]);
      if (msg) next[k] = msg;
    });
    return next;
  }

  useEffect(() => {
    setFe(validateAll(form));
  }, [form]);

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true); setErr("");
    try {
      const res = await fetchAuth(`${api}/api/employees`, { headers: { Authorization: `Bearer ${token}` } }, logout);
      const { ok, data, detail } = await parseJsonWithDetail(res);
      if (!ok) throw new Error(detail || "Failed to load employees");
      setList(data || []);
    } catch (e) {
      const msg = e.message || "Failed to load employees";
      setErr(msg);
      showToast("error", msg);
    } finally { setLoading(false); }
  }

  async function createEmployee(e) {
    e.preventDefault();
    setErr("");
    if (!isAdmin) return setErr("Only admins can create employees.");

    const all = validateAll(form);
    setFe(all);
    if (Object.keys(all).length > 0) {
      showToast("error", "Please fix the highlighted issues.");
      return;
    }

    try {
      const res = await fetchAuth(`${api}/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(cleanEmployeePayload(form)),
      }, logout);

      const { ok, data, detail, status } = await parseJsonWithDetail(res);
      if (!ok) {
        const msg = detail || (status === 409 ? "Email or SSN already exists." : "Create failed");
        throw new Error(msg);
      }

      showToast("success", `Employee created (id ${data.employee_id})`);
      setForm({ department_id: 1, first_name: "", last_name: "", email: "", role: "keeper", job_title: "", password: "", phone: "", ssn: "", description: "", salary_cents: "" });
      setFe({});
      await load();
      setShowCreate(false);
    } catch (e) {
      setErr(e.message);
      showToast("error", e.message);
    }
  }

  async function remove(id) {
    if (!isAdmin) return setErr("Only admins can delete employees.");
    if (user?.employee_id && Number(user.employee_id) === Number(id)) {
      showToast("error", "You cannot delete your own account.");
      return;
    }
    if (!confirm("Delete this employee?")) return;
    try {
      const res = await fetchAuth(`${api}/api/employees/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }, logout);
      const { ok, detail } = await parseJsonWithDetail(res);
      if (!ok) throw new Error(detail || "Delete failed");
      showToast("success", "Employee deleted");
      await load();
    } catch (e) { setErr(e.message); showToast("error", e.message); }
  }

  const filtered = useMemo(() => {
  const s = q.trim().toLowerCase();
  if (!s) return list;

  return list.filter((r) => {
    const fullName = `${r.first_name} ${r.last_name}`.toLowerCase();
    const email = String(r.email).toLowerCase();
    const department = String(r.department_id ?? "").toLowerCase();
    const phone = String(r.phone ?? "").toLowerCase();
    const role = String(r.role).toLowerCase();

    return (
      fullName.includes(s) ||
      email.includes(s) ||
      phone.includes(s) ||
      department == s ||
      role === s // exact match for role
    );
  });
}, [q, list]);


  const bind = (name) => ({
    value: form[name],
    onChange: (e) => {
      const v = e.target.value;
      setForm((f) => ({ ...f, [name]: v }));
      const msg = validateField(name, v);
      setFe((prev) => {
        const next = { ...prev };
        if (msg) next[name] = msg;
        else delete next[name];
        return next;
      });
    },
    onBlur: () => {
      const msg = validateField(name, form[name]);
      setFe((prev) => {
        const next = { ...prev };
        if (msg) next[name] = msg;
        else delete next[name];
        return next;
      });
    },
  });

  return (
    <div className="page">
      <div className="row-between" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>Employees</h2>
        {isAdmin && (
          <button type="button" className="btn btn-sm" onClick={() => setShowCreate(v => !v)} aria-expanded={showCreate} aria-controls="create-employee-form">
            {showCreate ? "Hide Form" : "Add Employee"}
          </button>
        )}
      </div>

      {err && <div className="error" style={{ marginBottom: 10 }}>{err}</div>}

      {isAdmin && showCreate && (
        <form id="create-employee-form" onSubmit={createEmployee} className="card card--wide" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12 }}>Add Employee</h3>
          <div className="two-col">
            <div>
              <label>Department ID</label>
              <input type="number" min="1" {...bind("department_id")} />
              <Help>Must be an existing department (integer ≥ 1).</Help>
              <FieldError msg={fe.department_id} />
            </div>
            <div>
              <label>Role</label>
              <select {...bind("role")}>{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select>
              <Help>Choose one of the predefined roles.</Help>
              <FieldError msg={fe.role} />
            </div>
            <div><label>First name</label><input required maxLength={50} {...bind("first_name")} /><FieldError msg={fe.first_name} /></div>
            <div><label>Last name</label><input required maxLength={50} {...bind("last_name")} /><FieldError msg={fe.last_name} /></div>
            <div>
              <label>Email</label>
              <input type="email" required maxLength={100} {...bind("email")} />
              <Help>Example: <code>alex.jones@zooapp.com</code></Help>
              <FieldError msg={fe.email} />
            </div>
            <div>
              <label>Phone (optional)</label>
              <input placeholder="555-123-4567" {...bind("phone")} />
              <Help>Examples: <code>555-123-4567</code>, <code>(555) 123-4567</code>, <code>+1 555-123-4567</code></Help>
              <FieldError msg={fe.phone} />
            </div>
            <div>
              <label>SSN (optional)</label>
              <input placeholder="123-45-6789" maxLength={11} {...bind("ssn")} />
              <Help>Format: <code>123-45-6789</code> (must be unique if set)</Help>
              <FieldError msg={fe.ssn} />
            </div>
            <div>
              <label>Salary (cents, optional)</label>
              <input type="number" min="0" step="1" placeholder="5500000" {...bind("salary_cents")} />
              <Help>Enter cents only. Example: <code>5500000</code> = $55,000.00</Help>
              <FieldError msg={fe.salary_cents} />
            </div>
            <div className="span-2">
              <label>Job title (optional)</label>
              <input maxLength={80} {...bind("job_title")} />
              <FieldError msg={fe.job_title} />
            </div>
            <div className="span-2">
              <label>Description (optional)</label>
              <input maxLength={250} placeholder="Notes about the employee" {...bind("description")} />
              <FieldError msg={fe.description} />
            </div>
            <div className="span-2">
              <label>Temp password</label>
              <input type="password" required {...bind("password")} />
              <Help>At least 8 characters, include a letter and a number.</Help>
              <FieldError msg={fe.password} />
            </div>
          </div>

          {Object.keys(fe).length > 0 && (
            <div className="error" style={{ marginTop: 12 }}>
              <strong>Can’t create yet:</strong>
              <ul style={{ margin: "8px 0 0 18px" }}>
                {Object.values(fe).map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button className="btn" type="submit" disabled={Object.keys(fe).length > 0}>Create</button>
            <button type="button" className="btn btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </form>
      )}

      <hr style={{ margin: "20px 0", borderColor: "var(--border)" }} />
      <h3 style={{ margin: "0 0 8px 0" }}>Search</h3>
      <div className="row" style={{ marginBottom: 14 }}>
        <input className="input" placeholder="Search name, email, role..." value={q} onChange={(e)=>setQ(e.target.value)} />
        <button className="btn" onClick={load}>Refresh</button>
      </div>

      <div className="panel">
        {loading ? <div>Loading…</div> : (
          <table className="table" style={{ width: "100%" }}>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Active</th><th style={{ width: 260 }}>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.employee_id}>
                  <td>{row.first_name} {row.last_name}</td>
                  <td>{row.email}</td>
                  <td>{row.role}</td>
                  {/* <td>{row.department_id}</td> */}
                  <td>{Number(row.is_active) ? "1" : "0"}</td>
                  <td>
                    <Link className="btn btn-sm" to={`/employees/${row.employee_id}`}>Info</Link>{" "}
                    <Link className="btn btn-sm" to={`/employees/${row.employee_id}/edit`}>Edit</Link>{" "}
                    <button
                      className="btn btn-sm"
                      onClick={() => remove(row.employee_id)}
                      disabled={user?.employee_id && Number(user.employee_id) === Number(row.employee_id)}
                      title={user?.employee_id && Number(user.employee_id) === Number(row.employee_id) ? "You cannot delete your own account" : "Delete employee"}
                      style={{ background: "#e57373", borderColor: "#cc5555" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {toast.open && <Toast {...toast} onClose={() => setToast({ ...toast, open: false })} />}
    </div>
  );
}
