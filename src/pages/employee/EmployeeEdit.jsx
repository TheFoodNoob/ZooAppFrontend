import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";

const ROLES = ["keeper","vet","gate_agent","ops_manager","retail","coordinator","security","admin"];

export default function EmployeeEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [err, setErr] = useState("");
  const [form, setForm] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${api}/api/employees/${id}`, { headers: { Authorization: `Bearer ${token}` }});
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        setForm({
          department_id: data.department_id,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          role: data.role,
          job_title: data.job_title ?? "",
          phone: data.phone ?? "",
          ssn: data.ssn ?? "",
          description: data.description ?? "",
          salary_cents: data.salary_cents ?? "",
          is_active: Number(data.is_active ?? 1),
        });
      } catch (e) { setErr(e.message); }
    })();
  }, [id, token]);

  async function save(e) {
    e.preventDefault();
    if (!isAdmin) return setErr("Only admins can update employees.");
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
      const data = await res.json().catch(()=> ({}));
      if (!res.ok) throw new Error(data.error || "Update failed");
      nav(`/employees/${id}`); // back to info page
    } catch (e) { setErr(e.message); }
  }

  if (err) return <div className="page"><div className="error">{err}</div></div>;
  if (!form) return <div className="page">Loading…</div>;

  return (
    <div className="page">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Edit Employee</h2>
        <div>
          <Link className="btn btn-sm" to={`/employees/${id}`}>Cancel</Link>
        </div>
      </div>

      <form onSubmit={save} className="card card--wide">
        <div className="two-col">
          <div>
            <label>Department ID</label>
            <input type="number" min="1" value={form.department_id} onChange={e=>setForm({...form, department_id:e.target.value})}/>
          </div>
          <div>
            <label>Role</label>
            <select value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div><label>First name</label><input value={form.first_name} onChange={e=>setForm({...form, first_name:e.target.value})}/></div>
          <div><label>Last name</label><input value={form.last_name} onChange={e=>setForm({...form, last_name:e.target.value})}/></div>
          <div><label>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/></div>
          <div><label>Phone</label><input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})}/></div>
          <div><label>SSN</label><input value={form.ssn} onChange={e=>setForm({...form, ssn:e.target.value})} placeholder="123-45-6789" pattern="\d{3}-\d{2}-\d{4}" title="Format: 123-45-6789"/></div>
          <div><label>Salary (¢)</label><input type="number" min="0" step="1" value={form.salary_cents} onChange={e=>setForm({...form, salary_cents:e.target.value})}/></div>
          <div className="span-2"><label>Job title</label><input value={form.job_title} onChange={e=>setForm({...form, job_title:e.target.value})}/></div>
          <div className="span-2"><label>Description</label><input value={form.description} onChange={e=>setForm({...form, description:e.target.value})}/></div>
          <div>
            <label>Active</label>
            <select value={form.is_active} onChange={e=>setForm({...form, is_active:Number(e.target.value)})}>
              <option value={1}>1</option>
              <option value={0}>0</option>
            </select>
          </div>
        </div>

        <button className="btn" type="submit" style={{ marginTop: 14 }}>Save</button>
      </form>
    </div>
  );
}
