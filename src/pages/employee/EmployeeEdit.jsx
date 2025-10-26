// src/pages/employee/EmployeeEdit.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";

const ROLES = ["keeper","vet","gate_agent","ops_manager","retail","coordinator","security","admin"];
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Strict NANP: (555) 123-4567, 555-123-4567, 555.123.4567, 5551234567, optional +1
const phoneRe = /^(\+1\s?)?(?:\(?[2-9][0-9]{2}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})$/;
const MAX_SALARY_CENTS = 1_000_000_000; // soft guard (~$10,000,000)

export default function EmployeeEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [err, setErr] = useState("");
  const [form, setForm] = useState(null);

  // field-level errors: { fieldName: "message" }
  const [fe, setFe] = useState({});

  const Help = ({ children }) => (
    <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>{children}</div>
  );
  const FieldError = ({ msg }) =>
    msg ? (
      <div style={{ color: "#a40000", fontSize: 12, marginTop: 4 }}>{msg}</div>
    ) : null;

  // ---- load record ----
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${api}/api/employees/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
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
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [id, token]);

  // ---- validation helpers ----
  function validateField(name, value, full) {
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
    const fields = [
      "first_name",
      "last_name",
      "email",
      "department_id",
      "role",
      "phone",
      "salary_cents",
      "ssn",
      "job_title",
      "description",
    ];
    const next = {};
    fields.forEach((key) => {
      const m = validateField(key, f[key], f);
      if (m) next[key] = m;
    });
    return next;
  }

  // live validate on any change
  useEffect(() => {
    if (!form) return;
    setFe(validateAll(form));
  }, [form]);

  const isValid = Object.keys(fe).length === 0;

  // ---- save ----
  async function save(e) {
    e.preventDefault();
    setErr("");
    if (!isAdmin) return setErr("Only admins can update employees.");

    const all = validateAll(form);
    setFe(all);
    if (Object.keys(all).length > 0) return; // block submit

    try {
      const res = await fetch(`${api}/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          department_id: Number(form.department_id) || 1,
          salary_cents: form.salary_cents === "" ? null : Number(form.salary_cents),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Update failed");
      nav(`/employees/${id}`);
    } catch (e) {
      setErr(e.message);
    }
  }

  if (err && !form) return <div className="page"><div className="error">{err}</div></div>;
  if (!form) return <div className="page">Loading…</div>;

  // helper to bind inputs with per-field update + blur validation
  const bind = (name) => ({
    value: form[name],
    onChange: (e) => {
      const v = e.target.value;
      setForm((f) => ({ ...f, [name]: v }));
      // validate live as user types (optional: only on blur for heavy checks)
      const msg = validateField(name, v, { ...form, [name]: v });
      setFe((prev) => {
        const next = { ...prev };
        if (msg) next[name] = msg;
        else delete next[name];
        return next;
      });
    },
    onBlur: () => {
      const msg = validateField(name, form[name], form);
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
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
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
            <input
              placeholder="123-45-6789"
              {...bind("ssn")}
              maxLength={11}
            />
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

        {/* Summary box if any blocking errors */}
        {Object.keys(fe).length > 0 && (
          <div
            className="error"
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 8,
              background: "#ffecec",
              border: "1px solid #ffb3b3",
              color: "#a40000",
            }}
          >
            <strong>Can’t save yet:</strong>
            <ul style={{ margin: "8px 0 0 18px" }}>
              {Object.values(fe).map((m, i) => (
                <li key={i}>{m}</li>
              ))}
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
