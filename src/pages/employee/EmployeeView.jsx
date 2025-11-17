// src/pages/employee/EmployeeView.jsx
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";

export default function EmployeeView() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [emp, setEmp] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const url = `${api}/api/employees/${id}`;
        console.log("[EmployeeView] GET", url);
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

        const text = await res.text();               // read raw
        if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${text}`);

        const data = text ? JSON.parse(text) : {};
        if (alive) setEmp(data);
      } catch (e) {
        if (alive) setErr(e.message || "Failed to load employee");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, token]);

  if (loading) return <div className="page">Loading…</div>;
  if (err) return <div className="page"><div className="error">{err}</div></div>;
  if (!emp) return <div className="page"><div className="error">No data</div></div>;

  const safe = (v, dash = "—") => (v === null || v === undefined || v === "" ? dash : v);
  const hireDate = emp.hire_date ? String(emp.hire_date).slice(0, 10) : "—";

  return (
    <div className="page">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Employee Info</h2>
        <div>
          {isAdmin && <Link className="btn btn-sm" to={`/employees/${id}/edit`}>Edit</Link>}{" "}
          <Link className="btn btn-sm" to="/employees">Back</Link>
        </div>
      </div>

      <div className="card card--wide">
        <div className="two-col">
          <div><label>First name</label><div>{safe(emp.first_name)}</div></div>
          <div><label>Last name</label><div>{safe(emp.last_name)}</div></div>
          <div><label>Email</label><div>{safe(emp.email)}</div></div>
          <div><label>Phone</label><div>{safe(emp.phone)}</div></div>
          <div><label>Role</label><div>{safe(emp.role)}</div></div>
          {/* <div><label>Department</label><div>{safe(emp.department_id)}</div></div> */}
          <div><label>Job title</label><div>{safe(emp.job_title)}</div></div>
          <div><label>Active</label><div>{Number(emp.is_active) ? "1" : "0"}</div></div>
          <div className="span-2"><label>Description</label><div>{safe(emp.description)}</div></div>
          <div><label>Hire date</label><div>{hireDate}</div></div>
          <div><label>Salary (¢)</label><div>{safe(emp.salary_cents)}</div></div>
          {/* You probably should NOT show SSN/password_hash in UI */}
        </div>
      </div>
    </div>
  );
}
