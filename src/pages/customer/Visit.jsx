// src/pages/customer/Visit.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api";

/* ---------- Helpers ---------- */
function fmtDate(s) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(s);
  }
}
function fmtTime(s) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return String(s);
  }
}

/* Prefer explicit image_url; otherwise infer from name/location keywords */
function getEventImg(evt) {
  // 1) Use explicit slug from DB → /public/img/events/<slug>
  const slug = evt?.photo_slug && evt.photo_slug.trim();
  if (slug) return `/img/events/${slug}`;

  // 2) Optional full URL field
  const url = evt?.image_url && evt.image_url.trim();
  if (url) return url;

  // 3) Heuristic fallback based on name/location
  const hay = `${evt?.name || evt?.title || ""} ${evt?.location || ""}`.toLowerCase();

  if (hay.includes("penguin")) return "/img/penguinparade.jpg";
  if (hay.includes("reptile") || hay.includes("snake") || hay.includes("lizard"))
    return "/img/reptile.jpg";
  if (hay.includes("lion") || hay.includes("big cat"))
    return "/img/lion.webp";
  if (hay.includes("giraffe"))
    return "/img/giraffe.jpg";
  if (hay.includes("bird"))
    return "/img/birds.webp";
  if (hay.includes("seal") || hay.includes("sea lion"))
    return "/img/harborSeal.webp";

  // Final fallback
  return "/img/bigSeal.jpg";
}

/* ---------- Page ---------- */
export default function Visit() {
  const navigate = useNavigate();

  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${api}/api/public/events?limit=48&order=ASC`);
        if (!res.ok) throw new Error(`Failed to load events (${res.status})`);
        const rows = await res.json();
        setEvents(Array.isArray(rows) ? rows : []);
      } catch (e) {
        setErr(e.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="page">
      <div className="container">
        {/* Single heading (removed duplicate) */}
        <h1 style={{ marginBottom: 16 }}>Upcoming Events</h1>

        {loading && <div className="note">Loading…</div>}
        {err && !loading && <div className="error">{err}</div>}

        {!loading && !err && events.length === 0 && (
          <div className="note">No upcoming events found.</div>
        )}

        {!loading && !err && events.length > 0 && (
          <div className="events-grid-wide">
            {events.map((e) => {
              const title = e.title || e.name || "Untitled Event";
              const to = `/visit/${e.event_id}`;

              return (
                <article key={e.event_id || `${title}-${e.start_time}`} className="event-card-wide">
                  {/* Image (clickable) */}
                  <a
                    href={to}
                    onClick={(ev) => {
                      ev.preventDefault();
                      navigate(to, { state: { event: e, isPublic: true } });
                    }}
                    className="event-card-wide__imgbtn"
                    title={`Open ${title}`}
                  >
                    <img src={getEventImg(e)} alt={title} className="event-card-wide__img" loading="lazy" />
                  </a>

                  {/* Body */}
                  <div className="event-card-wide__body">
                    <h3 className="event-card-wide__title">{title}</h3>

                    <div className="event-card-wide__meta">
                      {e.start_time && (
                        <div>
                          <strong>Starts:</strong> {fmtDate(e.start_time)} {fmtTime(e.start_time)}
                        </div>
                      )}
                      {e.end_time && (
                        <div>
                          <strong>Ends:</strong> {fmtDate(e.end_time)} {fmtTime(e.end_time)}
                        </div>
                      )}
                      {e.location && (
                        <div>
                          <strong>Location:</strong> {e.location}
                        </div>
                      )}
                    </div>

                    <div className="event-card-wide__actions">
                      <Link
                        className="btn btn-primary btn-sm"
                        to={to}
                        state={{ event: e, isPublic: true }}
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="note" style={{ marginTop: 12 }}>
          Public mode: showing limited data. Log in for internal tools.
        </div>
      </div>
    </div>
  );
}
