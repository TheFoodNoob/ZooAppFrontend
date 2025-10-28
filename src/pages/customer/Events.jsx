// src/pages/customer/Events.jsx
import React from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";
import { Link } from "react-router-dom";

export default function CEvents() {
  const { token, user } = useAuth();
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    (async () => {
      setLoading(true); setErr("");
      try {
        const url = `${api}/api/events?is_active=1&limit=100&order=ASC`;
        const res = await fetch(`${api}/api/public/exhibits`);
        if (!res.ok) throw new Error(`Failed to load events (${res.status})`);
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const fmtDate = (s) => {
    try { return new Date(s).toLocaleString(); } catch { return s; }
  };

  return (
    <div className="page">
      <h1>Upcoming Events</h1>
      <div className="panel">
        {loading && <div>Loading…</div>}
        {err && <div className="error">{err}</div>}
        {!loading && !err && events.length === 0 && (
          <div>No upcoming events.</div>
        )}

        <div className="grid">
          {events.map((ev) => (
            <div key={ev.event_id} className="card">
              <h3>{ev.title || "Untitled Event"}</h3>
              {ev.start_time && (
                <div style={{ opacity: 0.85, fontSize: 14 }}>
                  Starts: {fmtDate(ev.start_time)}
                </div>
              )}
              {ev.end_time && (
                <div style={{ opacity: 0.85, fontSize: 14 }}>
                  Ends: {fmtDate(ev.end_time)}
                </div>
              )}
              {ev.location && (
                <div style={{ marginTop: 6 }}>Location: {ev.location}</div>
              )}
              {ev.description && (
                <p style={{ marginTop: 8 }}>{ev.description}</p>
              )}
              {user && (user.role === "admin" || user.role === "ops_manager") && (
                <Link className="btn" to={`/events/${ev.event_id}`}>Manage</Link>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <Link to="/scheduleEvents" className="btn">Zoo Schedule</Link>
        </div>
      </div>
    </div>
  );
}
