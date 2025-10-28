import React from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Visit() {
  const { token } = useAuth();
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [isPublic, setIsPublic] = React.useState(false);



  const fmtDate = (s) => {
    if (!s) return "—";
    if (typeof s === "string" && s.includes(" ")) s = s.replace(" ", "T");
    const d = new Date(s);
    return isNaN(d) ? "—" : d.toLocaleString();
  };

  const fmtTime = (s) => {
    try { return new Date(s).toLocaleTimeString(); } catch { return s || ""; }
  };

  React.useEffect(() => {
  (async () => {
    setLoading(true); setErr("");
    try {
      let data;
      if (!token) {
        const res = await fetch(`${api}/api/public/events?limit=8&order=ASC`);
        if (!res.ok) throw new Error(`Failed to load events (${res.status})`);
        data = await res.json();
        setIsPublic(true);
      } else {
        let res = await fetch(`${api}/api/events?is_active=1&limit=8&order=ASC`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          res = await fetch(`${api}/api/public/events?limit=8&order=ASC`);
          if (!res.ok) throw new Error(`Failed to load events (${res.status})`);
          data = await res.json();
          setIsPublic(true);
        } else {
          if (!res.ok) throw new Error(`Failed to load events (${res.status})`);
          data = await res.json();
          setIsPublic(false);
        }
      }
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  })();
}, [token]);

  


  return (
    <div className="page">
      <h1>Upcoming Events</h1>
      <div className="panel">
        {loading && <div>Loading…</div>}
        {err && <div className="error">{err}</div>}

        <div className="grid">
          {events.map((ev) => (
            <div key={ev.event_id} className="card">
              <h3 style={{ marginBottom: 6 }}>{ev.title || "Untitled Event"}</h3>
              <div style={{ opacity: 0.85, fontSize: 14 }}>
                Starts: {fmtDate(ev.start_time)}
              </div>
              {ev.end_time && (
                <div style={{ opacity: 0.85, fontSize: 14 }}>
                  Ends: {fmtDate(ev.end_time)}
                </div>
              )}
              {ev.location && (
                <div style={{ marginTop: 6, fontSize: 13 }}>
                  Location: <strong>{ev.location}</strong>
                </div>
              )}
              {ev.description && (
                <div style={{ marginTop: 6, fontSize: 13 }}>
                  {ev.description}
                </div>
              )}
            </div>
          ))}
        </div>

        {isPublic && (
          <div className="note" style={{ marginTop: 10 }}>
            Public mode: showing limited data. Log in for details.
          </div>
        )}
      </div>
    </div>
  );
}
