// src/pages/employee/EmployeesByRole.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import Toast from "../../components/Toast";
import { fetchAuth, parseJsonWithDetail } from "../../utils/fetchAuth";
import { Link } from "react-router-dom";

export function AdminButton() {
  const { user } = useAuth();

  if (user?.role !== "admin") return null; 

  return (
    <button
      className="btn">
        Edit Employees
    </button>
  );
}

export default function EmployeesByRole({ showRoleFilter = false }) {
  const { token, user, logout } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState({ open: false, type: "success", text: "" });
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState(""); // only used by admins

  const showToast = (type, text) => setToast({ open: true, type, text });

  useEffect(() => {
    loadEmployees();
  }, [roleFilter]);

  async function loadEmployees() {
    setLoading(true);
    setErr("");
    try {
      // Only admins can filter by role
      const url =
        user?.role === "admin" && roleFilter
          ? `${api}/api/employees?role=${roleFilter}`
          : `${api}/api/employees`;

      const res = await fetchAuth(url, { headers: { Authorization: `Bearer ${token}` } }, logout);
      const { ok, data, detail } = await parseJsonWithDetail(res);
      if (!ok) throw new Error(detail || "Failed to load employees");
      setList(data || []);
    } catch (e) {
      const msg = e.message || "Failed to load employees";
      setErr(msg);
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
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
 
  return (
    <div className="page">
      <h2>Employees</h2>

      {err && <div className="error" style={{ marginBottom: 10 }}>{err}</div>}

      {user?.role === "admin" && showRoleFilter && (
        <div style={{ marginBottom: 14 }}>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="keeper">Keeper</option>
            <option value="vet">Vet</option>
            <option value="security">Security</option>
            <option value="ops_manager">Ops Manager</option>
            <option value="retail">Retail</option>
            <option value="coordinator">Coordinator</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn" onClick={loadEmployees}>Refresh</button>
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <input
          className="input"
          placeholder="Search name or email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Link to ="/employees"><AdminButton/></Link>
        <button className="btn" onClick={loadEmployees}>Refresh</button>
      </div>

      <div className="panel">
        {loading ? (
          <div>Loading…</div>
        ) : (
          <table className="table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.employee_id}>
                  <td>{row.first_name} {row.last_name}</td>
                  <td>{row.email}</td>
                  <td>{row.role}</td>
                  <td>{row.department_id}</td>
                  <td>{Number(row.is_active) ? "Yes" : "No"}</td>
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
