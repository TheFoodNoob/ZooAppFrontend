// src/pages/employee/EmployeeEdit.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import { fetchAuth, parseJsonWithDetail } from "../../utils/fetchAuth";

const ROLES = ["keeper","vet","gate_agent","ops_manager","retail","coordinator","security","admin"];
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRe = /^(\+1\s?)?(?:\(?[2-9][0-9]{2}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})$/;
const MAX_SALARY_CENTS = 1_000_000_000;

export default function EmployeeEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const { token, user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  const [err, setErr] = useState("");
  const [form, setForm] = useState(null);
  const [fe, setFe] = useState({}); // field-level errors

  const Help = ({ children }) => (
    <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>{children}</div>
  );
  const FieldError = ({ msg }) => (msg ? <div style={{ color: "#a40000", fontSize: 12, marginTop: 4 }}>{msg}</div> : null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAuth(`${api}/api/employees/${id}`, { headers: { Authorization: `Bearer ${token}` } }, logout);
        const { ok, data, detail } = await parseJsonWithDetail(res);
        if (!ok) throw new Error(detail || "Failed to load");
        setForm({
          department_id: data.department_id ?? 1,
          first_name: data.first_name ?? "",
          last_name: data.last_name ?? "",
          email: data.email ?? "",
          role: data.role ?? "keeper",
          job_title: data.job_title ?? "",
          phone: data.phone ?? "",
          ssn: data.ssn ?? "",
          description: data.description ?? "",
          salary_cents: data.salary_cents ?? "",
          is_active: Number(data.is_active ?? 1),
        });
      } catch (e) { setErr(e.message); }
    })();
  }, [id, token, logout]);

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
    if (!f) return {};
    const keys = ["first_name","last_name","email","department_id","role","phone","salary_cents","ssn","job_title","description"];
    const next = {};
    for (const k of keys) {
      const msg = validateField(k, f[k]);
      if (msg) next[k] = msg;
    }
    return next;
  }

  useEffect(() => {
    if (!form) return;
    setFe(validateAll(form));
  }, [form]);

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

  async function putFullOrFallback() {
    // Try full route first
    const fullRes = await fetchAuth(`${api}/api/employees/${id}/full`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        department_id: Number(form.department_id) || 1,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        role: form.role,
        job_title: form.job_title || null,
        phone: form.phone || null,
        ssn: form.ssn || null,
        description: form.description || null,
        salary_cents: form.salary_cents === "" ? null : Number(form.salary_cents),
        is_active: Number(form.is_active),
      }),
    }, logout);

    if (fullRes.status !== 404) { // backend has the route (or other status)
      return fullRes;
    }

    // Fallback to the legacy route (role/job_title/is_active only)
    return fetchAuth(`${api}/api/employees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        role: form.role,
        job_title: form.job_title || null,
        is_active: Number(form.is_active),
      }),
    }, logout);
  }

  async function save(e) {
    e.preventDefault();
    setErr("");
    if (!isAdmin) return setErr("Only admins can update employees.");

    const all = validateAll(form);
    setFe(all);
    if (Object.keys(all).length > 0) return;

    try {
      const res = await putFullOrFallback();
      const { ok, detail } = await parseJsonWithDetail(res);
      if (!ok) throw new Error(detail || "Update failed");
      nav(`/employees/${id}`);
    } catch (e) {
      setErr(e.message);
    }
  }

  if (err && !form) return <div className="page"><div className="error">{err}</div></div>;
  if (!form) return <div className="page">Loading…</div>;

  return (
    <div className="page">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Edit Employee</h2>
        <div>
          <Link className="btn btn-sm" to={`/employees/${id}`}>Cancel</Link>
        </div>
      </div>

      {err && <div className="error" style={{ marginBottom: 10 }}>{err}</div>}

      <form onSubmit={save} className="card card--wide">
        <div className="two-col">
          <div>
            <label>Department ID</label>
            <input type="number" min="1" {...bind("department_id")} />
            <Help>Must be an existing department (integer ≥ 1).</Help>
            <FieldError msg={fe.department_id} />
          </div>

          <div>
            <label>Role</label>
            <select {...bind("role")}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <Help>Choose one of the predefined roles.</Help>
            <FieldError msg={fe.role} />
          </div>

          <div>
            <label>First name</label>
            <input maxLength={50} required {...bind("first_name")} />
            <FieldError msg={fe.first_name} />
          </div>

          <div>
            <label>Last name</label>
            <input maxLength={50} required {...bind("last_name")} />
            <FieldError msg={fe.last_name} />
          </div>

          <div>
            <label>Email</label>
            <input type="email" maxLength={100} required {...bind("email")} />
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

          <div>
            <label>Active</label>
            <select {...bind("is_active")}>
              <option value={1}>1</option>
              <option value={0}>0</option>
            </select>
          </div>
        </div>

        {Object.keys(fe).length > 0 && (
          <div className="error" style={{ marginTop: 12 }}>
            <strong>Can’t save yet:</strong>
            <ul style={{ margin: "8px 0 0 18px" }}>
              {Object.values(fe).map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
        )}

        <button
          className="btn"
          type="submit"
          style={{ marginTop: 14 }}
          disabled={!isAdmin || Object.keys(fe).length > 0}
          title={!isAdmin ? "Only admins can update employees." : undefined}
        >
          Save
        </button>
      </form>
    </div>
  );
}
