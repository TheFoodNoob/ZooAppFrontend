import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import { fetchAuth, parseJsonWithDetail } from "../../utils/fetchAuth";
import Toast from "../../components/Toast";

const Badge = ({ on }) => (
  <span className={`badge ${on ? "green" : ""}`}>{on ? "Active" : "Inactive"}</span>
);

function fmtDate(d) {
  if (!d) return "-";
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  try { return new Date(d).toISOString().slice(0, 10); } catch { return String(d); }
}

export default function FeedingView() {
  const { id } = useParams();
  const nav = useNavigate();
  const { logout, token, user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "vet" || user?.role === "keeper";

  const [feeding, setFeeding] = useState(null);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState({ open: false, type: "info", text: "" });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const showToast = (type, text) => setToast({ open: true, type, text });
  useEffect(() => {
    if (!toast.open) return;
    const t = setTimeout(() => setToast(s => ({ ...s, open: false })), 2500);
    return () => clearTimeout(t);
  }, [toast.open]);

  async function load() {
    setErr("");
    try {
      const res = await fetchAuth(
        `${api}/api/feedings/${id}`,
        { headers: { Authorization: `Bearer ${token}` } },
        logout
      );
      const { ok, data, detail } = await parseJsonWithDetail(res);
      if (!ok) throw new Error(detail || "Failed to load feeding");
      setFeeding(data);
    } catch (e) {
      setErr(e.message);
      showToast("error", e.message);
    }
  }

  useEffect(() => { load(); }, [id]);

const fields = useMemo(() => {
  if (!feeding) return [];
  return [
    ["Animal Name", feeding.animal_name || "-"],
    ["Animal ID", feeding.animal_id || "-"],
    ["Fed By", `${feeding.employee_first_name} ${feeding.employee_last_name}` || "-"],
    ["Food", feeding.food_name || "-"],
    ["Feeding Time", fmtDate(feeding.feeding_time)],
    ["Amount (kg)", feeding.feed_amount_kg ?? "-"],
    ["Feeding ID", <code key="id" style={{ userSelect: "all" }}>{feeding.feeding_id}</code>]
  ];
}, [feeding]);

  async function deleteFeeding() {
    try {
      const res = await fetchAuth(`${api}/api/feedings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      }, logout);
      const info = await parseJsonWithDetail(res);
      if (!info.ok) throw new Error(info.detail || "Delete failed");
      showToast("success", "Feeding record deleted");
      setConfirmOpen(false);
      setTimeout(() => nav("/feedings", { replace: true }), 400);
    } catch (e) {
      showToast("error", e.message);
    }
  }

  return (
    <div className="container">
      <div className="header-row">
        <h1>Feeding Details</h1>
        <div className="row-gap">
          <button className="btn" onClick={load}>Refresh</button>
          {canEdit && <Link className="btn" to={`/feedings/${id}/edit`}>Edit</Link>}
          <Link className="btn" to="/feedings">Back to list</Link>
          {canEdit && <button className="btn" onClick={() => setConfirmOpen(true)}>Delete</button>}
        </div>
      </div>

      <div className="card">
        {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}
        {!feeding ? (
          <div>Loading…</div>
        ) : (
          <table className="table">
            <tbody>
              {fields.map(([label, value]) => (
                <tr key={label}>
                  <th style={{ width: 180 }}>{label}</th>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete feeding record?"
        message="This action cannot be undone."
        confirmText="Delete"
        onConfirm={deleteFeeding}
        onCancel={() => setConfirmOpen(false)}
      />

      {toast.open && (
        <Toast {...toast} onClose={() => setToast({ ...toast, open: false })} />
      )}
    </div>
  );
}

// Reuse the ConfirmModal component
function ConfirmModal({ open, title, message, confirmText="Confirm", onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.35)", display:"grid", placeItems:"center", zIndex:9998 }}>
      <div className="card" style={{ width:"min(520px,90vw)" }}>
        <h3 style={{ marginTop:0 }}>{title}</h3>
        <p>{message}</p>
        <div className="row-gap" style={{ display:"flex", justifyContent:"flex-end" }}>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
