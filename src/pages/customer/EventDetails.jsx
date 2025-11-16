// src/pages/customer/EventDetails.jsx
import React from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";

/* ---------- Image helper ---------- */
function getEventImg(evt) {
  // Prefer DB slug
  const slug = evt?.photo_slug && evt.photo_slug.trim();
  if (slug) return `/img/events/${slug}`;

  // Optional direct URL
  const url = evt?.image_url && evt.image_url.trim();
  if (url) return url;

  const hay = `${evt?.title || evt?.name || ""} ${evt?.event_title || ""} ${
    evt?.location || ""
  }`.toLowerCase();

  if (hay.includes("penguin")) return "/img/penguinparade.jpg";
  if (hay.includes("reptile") || hay.includes("snake") || hay.includes("lizard"))
    return "/img/reptile.jpg";
  if (hay.includes("lion") || hay.includes("big cat"))
    return "/img/lion.webp";
  if (hay.includes("giraffe")) return "/img/giraffe.jpg";
  if (hay.includes("bird")) return "/img/birds.webp";
  if (hay.includes("seal") || hay.includes("sea lion"))
    return "/img/harborSeal.webp";
  return "/img/bigSeal.jpg";
}

/* ---------- Date/Time helpers ---------- */
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

/* ---------- Price helper (from cents) ---------- */
function fmtPriceCents(cents) {
  if (cents == null) return "";
  const n = Number(cents);
  if (!Number.isFinite(n)) return "";
  return (n / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

export default function EventDetails() {
  const { id } = useParams();
  const { state } = useLocation(); // maybe { event, isPublic }
  const { token } = useAuth();

  // Start with partial data from state (for instant display),
  // but we ALWAYS hydrate from the API.
  const [event, setEvent] = React.useState(state?.event || null);
  const [isPublic, setIsPublic] = React.useState(Boolean(state?.isPublic));
  const [loading, setLoading] = React.useState(!state?.event);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    (async () => {
      setErr("");
      try {
        if (!event) setLoading(true);

        let data;
        if (!token) {
          // Public path
          const res = await fetch(`${api}/api/public/events/${id}`);
          if (!res.ok) throw new Error(`Failed to load event (${res.status})`);
          data = await res.json();
          setIsPublic(true);
        } else {
          // Staff path (fallback to public if forbidden)
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

        console.log("EventDetails fetched:", data);
        setEvent(data || null);
      } catch (e) {
        console.error("EventDetails error:", e);
        setErr(e.message || "Failed to load event");
      } finally {
        setLoading(false);
      }
    })();
    // don't depend on `state` or `event` to avoid loops
  }, [id, token]);

  if (loading && !event) {
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

  const title =
    event.title || event.name || event.event_title || "Untitled Event";

  const priceCents = event.price_cents ?? event.priceCents ?? null;
  const priceStr = fmtPriceCents(priceCents);
  const hasPrice = Boolean(priceStr);

  // generous about field names, just in case
  const description =
    event.description || event.details || event.event_description || "";

  return (
    <div className="page">
      <div className="event-details">
        {/* Hero image with overlay title */}
        <div className="event-hero">
          <img src={getEventImg(event)} alt={title} />

          <div className="event-hero__overlay">
            <h1>{title}</h1>
            {event.location && (
              <div className="event-hero__loc">
                At{" "}
                <Link to="/Exhibits" className="event-hero__loc-link">
                  {event.location}
                </Link>
              </div>
            )}
          </div>
        </div>


        {/* Content card */}
        <div className="event-details__content card">
          {/* Meta row */}
          <div className="event-details__meta">
            {event.start_time && (
              <div className="event-details__meta-item">
                <span className="event-details__meta-label">Starts</span>
                <span className="event-details__meta-value">
                  {fmtDate(event.start_time)} {fmtTime(event.start_time)}
                </span>
              </div>
            )}

            {event.end_time && (
              <div className="event-details__meta-item">
                <span className="event-details__meta-label">Ends</span>
                <span className="event-details__meta-value">
                  {fmtDate(event.end_time)} {fmtTime(event.end_time)}
                </span>
              </div>
            )}

            {event.event_type && (
              <div className="event-details__meta-item">
                <span className="event-details__meta-label">Event type</span>
                <span className="event-details__meta-value">
                  {event.event_type}
                </span>
              </div>
            )}

            {hasPrice && (
              <div className="event-details__meta-item">
                <span className="event-details__meta-label">Price</span>
                <span className="event-details__meta-value">{priceStr}</span>
              </div>
            )}

            {typeof event.capacity !== "undefined" &&
              event.capacity !== null && (
                <div className="event-details__meta-item">
                  <span className="event-details__meta-label">Capacity</span>
                  <span className="event-details__meta-value">
                    {String(event.capacity)}
                  </span>
                </div>
              )}
          </div>

          {/* About / description */}
          {description && (
            <div className="event-details__about">
              <h2>About this event</h2>
              <p>{description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="event-details__actions">
            <Link className="btn btn-primary" to="/tickets">
              Get Tickets
            </Link>
            <Link className="btn btn-ghost" to="/visit">
              Back to events
            </Link>
          </div>

          {!isPublic && (
            <div className="note" style={{ marginTop: 10 }}>
              Staff view: you&apos;re seeing internal event details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
