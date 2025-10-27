import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import fetchAuth, { parseJsonWithDetail } from "../../utils/fetchAuth";
import Toast from "../../components/Toast";

export default function EventView() {
  const { id } = useParams();
  const { token, logout } = useAuth();

  const [event, setEvent] = useState(null);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState({ open: false, type: "info", text: "" });
  const showToast = (type, text) => setToast({ open: true, type, text });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAuth(
          `${api}/api/events/${id}`,
          { headers: { Authorization: `Bearer ${token}` } },
          logout
        );
        const { ok, data, detail } = await parseJsonWithDetail(res);
        if (!ok) throw new Error(detail || "Failed to load event");
        setEvent(data);
      } catch (e) {
        setErr(e.message);
        showToast("error", e.message);
      }
    })();
  }, [id, token, logout]);

  if (err) return <div className="page"><div className="error">{err}</div></div>;
  if (!event) return <div className="page">Loading…</div>;

  const price = event.price_cents == null ? "-" : `$${(Number(event.price_cents)/100).toLocaleString()}`;
  const time = (event.start_time || event.end_time)
    ? `${event.start_time || ""}${event.end_time ? ` - ${event.end_time}` : ""}`
    : "-";

  return (
    <div className="page">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>{event.name}</h2>
        <div>
          <Link className="btn btn-sm" to={`/events/${id}/edit`} style={{ marginRight: 8 }}>Edit</Link>
          <Link className="btn btn-sm" to="/events">Back</Link>
        </div>
      </div>

      <div className="panel">
        <p><strong>Date:</strong> {event.date || "-"}</p>
        <p><strong>Time:</strong> {time}</p>
        <p><strong>Location:</strong> {event.location || "-"}</p>
        <p><strong>Capacity:</strong> {event.capacity ?? "-"}</p>
        <p><strong>Price:</strong> {price}</p>
        <p><strong>Active:</strong> {Number(event.is_active) ? "1" : "0"}</p>
        <p><strong>Description:</strong> {event.description || "-"}</p>
      </div>

      {toast.open && (
        <Toast {...toast} onClose={() => setToast({ ...toast, open: false })} />
      )}
    </div>
  );
}
