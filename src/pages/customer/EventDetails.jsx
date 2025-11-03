// src/pages/customer/EventDetails.jsx
import React from "react";
import { useParams, useLocation } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";

export default function EventDetails() {
  const { id } = useParams();
  const { state } = useLocation(); // may contain { event, isPublic }
  const { token } = useAuth();

  const [event, setEvent] = React.useState(state?.event || null);
  const [isPublic, setIsPublic] = React.useState(Boolean(state?.isPublic));
  const [loading, setLoading] = React.useState(!state?.event);
  const [err, setErr] = React.useState("");

  const fmtDateTime = (s) => {
    try {
      return new Date(s).toLocaleString(undefined, {
        dateStyle: "full",
        timeStyle: "short",
      });
    } catch {
      return s || "";
    }
  };

  React.useEffect(() => {
    if (state?.event) return; // hydrate-only; already have data

    (async () => {
      setLoading(true);
      setErr("");
      try {
        let data;

        if (!token) {
          const res = await fetch(`${api}/api/public/events/${id}`);
          if (!res.ok) throw new Error(`Failed to load event (${res.status})`);
          data = await res.json();
          setIsPublic(true);
        } else {
          let res = await fetch(`${api}/api/events/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.status === 401 || res.status === 403) {
            res = await fetch(`${api}/api/public/events/${id}`);
            if (!res.ok) throw new Error(`Failed to load event (${res.status})`);
            data = await res.json();
            setIsPublic(true);
          } else {
            if (!res.ok) throw new Error(`Failed to load event (${res.status})`);
            data = await res.json();
            setIsPublic(false);
          }
        }

        setEvent(data || null);
      } catch (e) {
        setErr(e.message || "Failed to load event");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token, state]);

  if (loading) {
    return (
      <div className="page">
        <h1>Event Details</h1>
        <div className="panel">
          <div className="card" style={{ padding: 16 }}>
            <div className="note">Loading…</div>
          </div>
        </div>
      </div>
    );
  }

  if (err || !event) {
    return (
      <div className="page">
        <h1>Event Details</h1>
        <div className="panel">
          <div className="error">{err || "Event not found."}</div>
        </div>
      </div>
    );
  }

  const title = event.title || event.name || event.event_title || "Untitled Event";

  return (
    <div className="page">
      <h1>{title}</h1>
      <div className="panel">
        <div className="card" style={{ padding: 16 }}>
          {event.start_time && (
            <div style={{ marginBottom: 6 }}>
              <strong>Starts:</strong> {fmtDateTime(event.start_time)}
            </div>
          )}
          {event.end_time && (
            <div style={{ marginBottom: 6 }}>
              <strong>Ends:</strong> {fmtDateTime(event.end_time)}
            </div>
          )}
          {event.location && (
            <div style={{ marginBottom: 6 }}>
              <strong>Location:</strong> {event.location}
            </div>
          )}
          {event.description && (
            <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
              {event.description}
            </div>
          )}

          {!isPublic && (
            <>
              {typeof event.price !== "undefined" && (
                <div style={{ marginTop: 10 }}>
                  <strong>Price:</strong> {String(event.price)}
                </div>
              )}
              {typeof event.capacity !== "undefined" && (
                <div>
                  <strong>Capacity:</strong> {String(event.capacity)}
                </div>
              )}
            </>
          )}
        </div>

        {isPublic && (
          <div className="note" style={{ marginTop: 10 }}>
            Public mode: showing limited details. Log in for full info.
          </div>
        )}
      </div>
    </div>
  );
}
