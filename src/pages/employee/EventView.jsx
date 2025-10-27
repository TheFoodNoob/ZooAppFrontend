import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import { fetchAuth, parseJsonWithDetail } from "../../utils/fetchAuth";
import Toast from "../../components/Toast";

function fmtDate(d) {
  if (!d) return "-";
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  try { return new Date(d).toISOString().slice(0, 10); } catch { return String(d); }
}
function fmtTime(s, e) {
  const a = s || "";
  const b = e || "";
  if (!a && !b) return "-";
  return `${a}${a && b ? " – " : ""}${b}`;
}
function fmtPriceCents(p) {
  if (p == null || isNaN(p)) return "-";
  return `$${(Number(p) / 100).toFixed(2)}`;
}
const Badge = ({ on }) => (
  <span className={`badge ${on ? "green" : ""}`}>{on ? "Active" : "Inactive"}</span>
);

export default function EventView() {
  const { id } = useParams();
  const nav = useNavigate();
  const { logout, token, user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "ops_manager";

  const [ev, setEv] = useState(null);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState({ open: false, type: "info", text: "" });
  const showToast = (type, text) => setToast({ open: true, type, text });
  const [updatedAt, setUpdatedAt] = useState("");

  async function load() {
    setErr("");
    setUpdatedAt("");
    try {
      const res = await fetchAuth(
        `${api}/api/events/${id}`,
        { headers: { Authorization: `Bearer ${token}` } },
        logout
      );
      const { ok, data, detail } = await parseJsonWithDetail(res);
      if (!ok) throw new Error(detail || "Failed to load event");
      setEv(data);
      setUpdatedAt(new Date().toLocaleString());
    } catch (e) {
      setErr(e.message);
      showToast("error", e.message);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const fields = useMemo(() => {
    if (!ev) return [];
    return [
      ["Date", fmtDate(ev.date)],
      ["Time", fmtTime(ev.start_time, ev.end_time)],
      ["Location", ev.location || "-"],
      ["Capacity", ev.capacity ?? "-"],
      ["Price", fmtPriceCents(ev.price_cents)],
      ["Active", <Badge key="b" on={Number(ev.is_active) === 1} />],
      ["Description", ev.description || "-"],
      ["Event ID", <code key="id" style={{ userSelect: "all" }}>{ev.event_id}</code>],
    ];
  }, [ev]);

  return (
    <div className="container">
      <div className="header-row">
        <h1>Event Details</h1>
        <div className="row-gap">
          <button className="btn" onClick={load}>Refresh</button>
          {canEdit && <Link className="btn primary" to={`/events/${id}/edit`}>Edit</Link>}
          <Link className="btn" to="/events">Back to list</Link>
        </div>
      </div>

      <div className="card">
        {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}
        {!ev ? (
          <div>Loading…</div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "200px 1fr", rowGap: 8 }}>
            <div style={{ gridColumn: "1 / -1", marginBottom: 8, color: "#666" }}>
              Last updated: {updatedAt || "—"}
            </div>
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
          </div>
        )}
      </div>

      {toast.open && (
        <Toast {...toast} onClose={() => setToast({ ...toast, open: false })} />
      )}
    </div>
  );
}
