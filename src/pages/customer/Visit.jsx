// src/pages/customer/Visit.jsx
import React from "react";
import { api } from "../../api";

// helpers
const fmtDateTime = (s) => {
  if (!s) return "";
  try {
    return new Date(s).toLocaleString();
  } catch {
    return String(s);
  }
};
const fmtTime = (s) => {
  if (!s) return "";
  try {
    return new Date(s).toLocaleTimeString();
  } catch {
    return String(s);
  }
};

export default function Visit() {
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  // modal state
  const [open, setOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState(null);
  const [details, setDetails] = React.useState(null);
  const [dLoading, setDLoading] = React.useState(false);
  const [dErr, setDErr] = React.useState("");

  // Load public list (no auth)
  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${api}/api/public/events?limit=8&order=ASC`);
        if (!res.ok) throw new Error(`Failed to load events (${res.status})`);
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Open details (public, no auth)
  async function openDetails(id) {
    setSelectedId(id);
    setOpen(true);
    setDetails(null);
    setDErr("");
    setDLoading(true);
    try {
      const res = await fetch(`${api}/api/public/events/${id}`);
      if (!res.ok) throw new Error(`Failed to load event (${res.status})`);
      const data = await res.json();
      setDetails(data || {});
    } catch (e) {
      setDErr(e.message || "Failed to load event");
    } finally {
      setDLoading(false);
    }
  }

  function closeModal() {
    setOpen(false);
    setSelectedId(null);
    setDetails(null);
    setDErr("");
  }

  return (
    <div className="page">
      <h1>Upcoming Events</h1>

      <div className="panel">
        {loading && <div>Loading…</div>}
        {err && <div className="error">{err}</div>}

        {!loading && !err && (
          <div className="grid">
            {events.map((ev) => (
              <div key={ev.event_id} className="card">
                <h3 style={{ marginBottom: 6 }}>
                  {ev.title || ev.name || "Untitled Event"}
                </h3>
                <div style={{ opacity: 0.85, fontSize: 14 }}>
                  Starts: {fmtDateTime(ev.start_time) || "TBA"}
                </div>
                {ev.end_time && (
                  <div style={{ opacity: 0.85, fontSize: 14 }}>
                    Ends: {fmtDateTime(ev.end_time)}
                  </div>
                )}
                {ev.location && (
                  <div style={{ marginTop: 6, fontSize: 13 }}>
                    Location: <strong>{ev.location}</strong>
                  </div>
                )}

                <div style={{ marginTop: 10 }}>
                  <button
                    className="btn btn-sm"
                    type="button"
                    onClick={() => openDetails(ev.event_id)}
                  >
                    View details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="note" style={{ marginTop: 10 }}>
          Public mode: showing limited data. Log in for internal tools.
        </div>
      </div>

      {/* Simple modal */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(720px, 95vw)",
              background: "#fff8e1",
              borderRadius: 14,
              boxShadow:
                "0 2px 6px rgba(0,0,0,0.08), 0 18px 40px rgba(0,0,0,0.18)",
              padding: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <h3 style={{ margin: 0, flex: 1 }}>
                {details?.title || details?.name || "Event details"}
              </h3>
              <button className="btn btn-sm" onClick={closeModal}>
                Close
              </button>
            </div>

            {dLoading && <div>Loading details…</div>}
            {dErr && <div className="error">{dErr}</div>}

            {!dLoading && !dErr && details && (
              <div style={{ display: "grid", gap: 8 }}>
                {/* Description if available */}
                {details.description && (
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    {details.description}
                  </div>
                )}
                {!details.description && (
                  <div style={{ opacity: 0.85 }}>
                    Check back soon for more info about this event.
                  </div>
                )}

                {/* When */}
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 13, opacity: 0.9 }}>When</div>
                  <div style={{ fontWeight: 600 }}>
                    {fmtDateTime(details.start_time) || "TBA"}
                  </div>
                  {details.end_time && (
                    <div style={{ opacity: 0.9 }}>
                      Ends: {fmtTime(details.end_time)}
                    </div>
                  )}
                </div>

                {/* Where */}
                {(details.location || details.location_text) && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: 13, opacity: 0.9 }}>Where</div>
                    <div style={{ fontWeight: 600 }}>
                      {details.location || details.location_text}
                    </div>
                  </div>
                )}

                {/* Extras if present */}
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {"price" in details && details.price != null && (
                    <div>
                      <div style={{ fontSize: 13, opacity: 0.9 }}>Price</div>
                      <div style={{ fontWeight: 600 }}>${details.price}</div>
                    </div>
                  )}
                  {"capacity" in details && details.capacity != null && (
                    <div>
                      <div style={{ fontSize: 13, opacity: 0.9 }}>Capacity</div>
                      <div style={{ fontWeight: 600 }}>{details.capacity}</div>
                    </div>
                  )}
                  {"event_type" in details && details.event_type && (
                    <div>
                      <div style={{ fontSize: 13, opacity: 0.9 }}>Type</div>
                      <div style={{ fontWeight: 600 }}>{details.event_type}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
