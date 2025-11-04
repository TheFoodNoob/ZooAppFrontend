// src/pages/customer/EventDetails.jsx
import React from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";

/* ---------- Image helper ---------- */
function getEventImg(evt) {
  // If DB provides a non-empty custom URL
  if (evt?.image_url && evt.image_url.trim()) return evt.image_url;

  const hay = `${evt?.title || evt?.name || ""} ${evt?.event_title || ""} ${evt?.location || ""}`.toLowerCase();

  if (hay.includes("penguin")) return "/img/penguinparade.jpg";
  if (hay.includes("reptile") || hay.includes("snake") || hay.includes("lizard")) return "/img/reptile.jpg";
  if (hay.includes("lion") || hay.includes("big cat")) return "/img/lion.webp";
  if (hay.includes("bird")) return "/img/birds.webp";
  if (hay.includes("safari") || hay.includes("story")) return "/img/safaristorytime.jpg";
  if (hay.includes("seal") || hay.includes("sea lion")) return "/img/harborSeal.webp";
  return "/img/bigSeal.jpg";
}


/* ---------- Date/Time helpers (fix for fmtDate/fmtTime) ---------- */
function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso || "";
  }
}
function fmtTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function EventDetails() {
  const { id } = useParams();
  const { state } = useLocation(); // may contain { event, isPublic }
  const { token } = useAuth();

  const [event, setEvent] = React.useState(state?.event || null);
  const [isPublic, setIsPublic] = React.useState(Boolean(state?.isPublic));
  const [loading, setLoading] = React.useState(!state?.event);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    if (state?.event) return; // already hydrated

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
            <div className="note">Loading&hellip;</div>
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
      <div className="event-details">
        {/* Hero image with overlay title */}
        <div className="event-hero">
          <img src={getEventImg(event)} alt={title} />
          <div className="event-hero__overlay">
            <h1>{title}</h1>
            {event.location && <div className="event-hero__loc">{event.location}</div>}
          </div>
        </div>

        {/* Content */}
        <div className="event-details__content card">
          <div className="event-details__row">
            {event.start_time && (
              <div>
                <strong>Starts:</strong> {fmtDate(event.start_time)} {fmtTime(event.start_time)}
              </div>
            )}
            {event.end_time && (
              <div>
                <strong>Ends:</strong> {fmtDate(event.end_time)} {fmtTime(event.end_time)}
              </div>
            )}
            {event.description && <p style={{ marginTop: 10 }}>{event.description}</p>}
          </div>

          <div className="event-details__actions">
            <Link className="btn btn-primary" to="/tickets">Get Tickets</Link>
            <Link className="btn btn-ghost" to="/visit">Back to events</Link>
          </div>

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

          {isPublic && (
            <div className="note" style={{ marginTop: 10 }}>
              Public mode: showing limited details. Log in for full info.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
