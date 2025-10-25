import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api"; // <-- named export

export default function EmployeeView() {
  const { id } = useParams();
  const { token } = useAuth();
  const [emp, setEmp] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const url = `${api}/api/employees/${id}`;
        console.log("[EmployeeView] GET", url);
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const text = await res.text(); // read first so we can show exact error body
        if (!res.ok) {
          // server didn't like it — show exactly what it said
          throw new Error(`${res.status} ${res.statusText} — ${text}`);
        }

        const data = text ? JSON.parse(text) : {};
        if (alive) setEmp(data);
      } catch (e) {
        if (alive) setErr(e.message || "Failed to load employee");
      }
    })();
    return () => { alive = false; };
  }, [id, token]);

  if (err) return <div className="page"><div className="error">{err}</div></div>;
  if (!emp) return <div className="page">Loading…</div>;

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
          <div><label>First name</label><div>{emp.first_name}</div></div>
          <div><label>Last name</label><div>{emp.last_name}</div></div>
          <div><label>Email</label><div>{emp.email}</div></div>
          <div><label>Phone</label><div>{emp.phone || "—"}</div></div>
          <div><label>Role</label><div>{emp.role}</div></div>
          <div><label>Department</label><div>{emp.department_id}</div></div>
          <div><label>Job title</label><div>{emp.job_title || "—"}</div></div>
          <div><label>Active</label><div>{Number(emp.is_active) ? "1" : "0"}</div></div>
          <div className="span-2"><label>Description</label><div>{emp.description || "—"}</div></div>
          <div><label>Hire date</label><div>{emp.hire_date?.slice(0,10) || "—"}</div></div>
          <div><label>Salary (¢)</label><div>{emp.salary_cents ?? "—"}</div></div>
          <div><label>SSN</label><div>{emp.ssn || "—"}</div></div>
        </div>
      </div>
    </div>
  );
}
