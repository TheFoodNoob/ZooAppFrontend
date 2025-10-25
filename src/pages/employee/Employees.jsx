// src/pages/employee/Employees.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import Toast from "../../components/Toast";

const ROLES = ["keeper","vet","gate_agent","ops_manager","retail","coordinator","security","admin"];

export default function Employees() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // toast
  const [toast, setToast] = useState({ open: false, type: "success", text: "" });
  const showToast = (type, text) => setToast({ open: true, type, text });

  // search/filter
  const [q, setQ] = useState("");

  // toggle create
  const [showCreate, setShowCreate] = useState(false);

  // create form
  const [form, setForm] = useState({
    department_id: 1, first_name: "", last_name: "", email: "",
    role: "keeper", job_title: "", password: "",
    phone: "", ssn: "", description: "", salary_cents: "",
  });

  const nulled = (v) => (v === "" ? null : v);
  function cleanEmployeePayload(f) {
    return {
      department_id: Number(f.department_id) || 1,
      first_name: f.first_name, last_name: f.last_name, email: f.email,
      role: f.role, job_title: nulled(f.job_title), password: f.password,
      phone: nulled(f.phone), ssn: nulled(f.ssn), description: nulled(f.description),
      salary_cents: f.salary_cents === "" ? null : Number(f.salary_cents),
    };
  }

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true); setErr("");
    try {
      const res = await fetch(`${api}/api/employees`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json()).error || res.statusText);
      setList(await res.json());
    } catch (e) {
      setErr(e.message || "Failed to load employees"); showToast("error", e.message || "Failed to load employees");
    } finally { setLoading(false); }
  }

  async function createEmployee(e) {
    e.preventDefault();
    setErr("");
    if (!isAdmin) return setErr("Only admins can create employees.");
    try {
      const res = await fetch(`${api}/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(cleanEmployeePayload(form)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Create failed");

      showToast("success", `Employee created (id ${data.employee_id})`);
      setForm({ department_id: 1, first_name: "", last_name: "", email: "", role: "keeper", job_title: "", password: "", phone: "", ssn: "", description: "", salary_cents: "" });
      await load();
      setShowCreate(false); // auto-close after success
    } catch (e) { setErr(e.message); showToast("error", e.message); }
  }

  async function remove(id) {
    if (!isAdmin) return setErr("Only admins can delete employees.");
    if (!confirm("Delete this employee?")) return;
    try {
      const res = await fetch(`${api}/api/employees/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` }});
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      showToast("success", "Employee deleted");
      await load();
    } catch (e) { setErr(e.message); showToast("error", e.message); }
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter(r =>
      `${r.first_name} ${r.last_name}`.toLowerCase().includes(s) ||
      String(r.email).toLowerCase().includes(s) ||
      String(r.role).toLowerCase().includes(s) ||
      String(r.department_id ?? "").toLowerCase().includes(s) ||
      String(r.phone ?? "").toLowerCase().includes(s)
    );
  }, [q, list]);

  return (
    <div className="page">
      <div className="row-between" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>Employees</h2>
        {isAdmin && (
          <button type="button" className="btn btn-sm"
            onClick={() => setShowCreate(v => !v)}
            aria-expanded={showCreate} aria-controls="create-employee-form">
            {showCreate ? "Hide Form" : "Add Employee"}
          </button>
        )}
      </div>

      {err && <div className="error" style={{ marginBottom: 10 }}>{err}</div>}

      {/* Create (admin only, collapsible) */}
      {isAdmin && showCreate && (
        <form id="create-employee-form" onSubmit={createEmployee} className="card card--wide" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12 }}>Add Employee</h3>
          <div className="two-col">
            <div>
              <label>Department ID</label>
              <input type="number" min="1" value={form.department_id} onChange={(e)=>setForm({...form, department_id:Number(e.target.value)})}/>
            </div>
            <div>
              <label>Role</label>
              <select value={form.role} onChange={(e)=>setForm({...form, role:e.target.value})}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label>First name</label>
              <input value={form.first_name} onChange={e=>setForm({...form, first_name:e.target.value})} required />
            </div>
            <div>
              <label>Last name</label>
              <input value={form.last_name} onChange={e=>setForm({...form, last_name:e.target.value})} required />
            </div>
            <div>
              <label>Email</label>
              <input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
            </div>
            <div>
              <label>Phone (optional)</label>
              <input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="e.g., 555-123-4567"/>
            </div>
            <div>
              <label>SSN (optional)</label>
              <input value={form.ssn} onChange={e=>setForm({...form, ssn:e.target.value})} placeholder="123-45-6789" pattern="\d{3}-\d{2}-\d{4}" title="Format: 123-45-6789"/>
            </div>
            <div>
              <label>Salary (cents, optional)</label>
              <input type="number" min="0" step="1" value={form.salary_cents} onChange={e=>setForm({...form, salary_cents:e.target.value})} placeholder="e.g., 5500000 for $55,000"/>
            </div>
            <div className="span-2">
              <label>Job title (optional)</label>
              <input value={form.job_title} onChange={e=>setForm({...form, job_title:e.target.value})}/>
            </div>
            <div className="span-2">
              <label>Description (optional)</label>
              <input value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Notes about the employee"/>
            </div>
            <div className="span-2">
              <label>Temp password</label>
              <input type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
            </div>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:14 }}>
            <button className="btn" type="submit">Create</button>
            <button type="button" className="btn btn-sm" onClick={()=>setShowCreate(false)}>Cancel</button>
          </div>
        </form>
      )}

      <hr style={{ margin: "20px 0", borderColor: "var(--border)" }} />
      <h3 style={{ margin: "0 0 8px 0" }}>Search</h3>
      <div className="row" style={{ marginBottom: 14 }}>
        <input className="input" placeholder="Search name, email, role, dept..."
          value={q} onChange={(e)=>setQ(e.target.value)} />
        <button className="btn" onClick={load}>Refresh</button>
      </div>

      {/* List (lean columns) */}
      <div className="panel">
        {loading ? <div>Loading…</div> : (
          <table className="table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Dept</th>
                <th>Active</th>
                <th style={{ width: 260 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.employee_id}>
                  <td>{row.first_name} {row.last_name}</td>
                  <td>{row.email}</td>
                  <td>{row.role}</td>
                  <td>{row.department_id}</td>
                  <td>{Number(row.is_active) ? "1" : "0"}</td>
                  <td>
                    <Link className="btn btn-sm" to={`/employees/${row.employee_id}`}>Info</Link>{" "}
                    <Link className="btn btn-sm" to={`/employees/${row.employee_id}/edit`}>Edit</Link>{" "}
                    <button className="btn btn-sm" onClick={() => remove(row.employee_id)}>Delete</button>
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
