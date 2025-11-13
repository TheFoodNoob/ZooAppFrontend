// src/pages/ZooHomePage.jsx
import React from "react";
import { api } from "../api"; // base API url
import { Link } from "react-router-dom";

// Small date formatting helpers
const fmtDate = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
};
const fmtTime = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
};

export default function ZooHomePage() {
  // ✅ Using images from /public/img (already in your repo)
  const heroSources = ["/img/bigSeal.jpg", "/img/harborSeal.webp", "/img/lion.webp", "/img/seal.webp", "/img/tiger.jpg"];

  const [heroIdx, setHeroIdx] = React.useState(0);
  const [upcoming, setUpcoming] = React.useState([]);
  const [loadingEvt, setLoadingEvt] = React.useState(true);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setHeroIdx((i) => (i + 1) % heroSources.length), 6000);
    return () => clearInterval(id);
  }, [paused]);

  React.useEffect(() => {
    // Fetch events, keep only future, take next 3 by start_time
    async function load() {
      try {
        setLoadingEvt(true);
        const res = await fetch(`${api}/api/public/events?limit=12&order=ASC`);
        const data = await res.json();
        const now = new Date();
        const next3 = (Array.isArray(data) ? data : [])
          .filter((e) => new Date(e.start_time) >= now)
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
          .slice(0, 3);
        setUpcoming(next3);
      } catch {
        setUpcoming([]);
      } finally {
        setLoadingEvt(false);
      }
    }
    load();
  }, []);

  return (
    <div className="page">
      <div className="container home-hero">
        {/* Hero Section */}
        <section className="section">
          <div className="hero-split">
            {/* Left Side Text */}
            <div className="hero-left">
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  color: "#d1fae5",
                  fontWeight: 800,
                  marginBottom: 6,
                }}
              >
                Welcome to H-Town Zoo
              </div>
              <h1>Wildlife, Conservation, and Family Fun&mdash;right here in Houston.</h1>
              <p style={{ marginTop: 8, color: "#eef2f7" }}>
                Meet lions, sea lions, kangaroos and more across immersive exhibits. Every visit supports animal care and
                conservation.
              </p>

              <div className="row" style={{ marginTop: 14 }}>
                <a className="btn btn-primary" href="/tickets">
                  Buy Tickets
                </a>
                <a className="btn" href="/visit">
                  Plan Your Visit
                </a>
              </div>
              

            </div>
            {/* Right: image carousel (new) */}
            <div
              className="hero-right"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onFocusCapture={() => setPaused(true)}
              onBlurCapture={() => setPaused(false)}
            >
              {heroSources.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="Zoo highlight"
                  className={"hero-slide" + (i === heroIdx ? " is-active" : "")}
                />
              ))}
              {/* Carousel controls */}
              <button
                className="hero-btn left"
                aria-label="Previous slide"
                onClick={() => setHeroIdx((i) => (i - 1 + heroSources.length) % heroSources.length)}
              />
              <button
                className="hero-btn right"
                aria-label="Next slide"
                onClick={() => setHeroIdx((i) => (i + 1) % heroSources.length)}
              />
              {/* Dots */}
              <div className="hero-dots">
                {heroSources.map((_, i) => (
                  <button
                    key={i}
                    className="hero-dot-btn"
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === heroIdx ? "true" : undefined}
                    onClick={() => setHeroIdx(i)}
                  />
                ))}
              </div>
            </div>
          
            </div>
        </section>

        {/* Quick Links + Promos */}
        <section className="section">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            <div className="card">
              <h3>Exhibits</h3>
              <p className="note" style={{ background: "transparent", border: 0, padding: 0 }}>
                Explore habitats from the African savanna to the Australian outback.
              </p>
              <a className="btn btn-sm" href="/Exhibits">
                View Exhibits
              </a>
            </div>

            {/* Events card now shows the next 3 events */}
            <div className="card">
              <h3>Events</h3>

              {loadingEvt ? (
                <div className="note" style={{ background: "transparent", border: 0, padding: 0 }}>
                  Loading upcoming events&hellip;
                </div>
              ) : upcoming.length === 0 ? (
                <div className="note" style={{ background: "transparent", border: 0, padding: 0 }}>
                  No upcoming events yet. Check back soon!
                </div>
              ) : (
                <ul className="mini-events">
                  {upcoming.map((e) => (
                    <li className="mini-event" key={e.event_id || e.evt_id}>
                      <div className="pill-date">{fmtDate(e.start_time)}</div>
                      <div className="mini-event-main">
                        <div className="mini-event-title">{e.name || e.event_name}</div>
                        <div className="mini-event-time">
                          {fmtTime(e.start_time)}&mdash;{fmtTime(e.end_time)}
                          {e.location ? ` \u2022 ${e.location}` : ""}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <a className="btn btn-sm" href="/visit" style={{ marginTop: 8 }}>
                Upcoming Events
              </a>
            </div>

            <div className="card">
              <h3>Memberships</h3>
              <p className="note" style={{ background: "transparent", border: 0, padding: 0 }}>
                Unlimited visits, member nights, and discounts all year long.
              </p>
              <Link to="/memberships" className="btn btn-primary">
                Become a Member
              </Link>
            </div>
          </div>
        </section>

        {/* Plan & Support Row */}
        <section className="section">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            <div className="panel">
              <h3>Plan your day</h3>
              <p style={{ color: "var(--ink-2)" }}>
                Check hours, parking, accessibility, and dining so your visit is a breeze.
              </p>
              <a className="btn btn-sm" href="/visit">
                Plan Your Visit
              </a>
            </div>
            
            <div className="panel">
              <h3>Support the Zoo</h3>
              <p style={{ color: "var(--ink-2)" }}>
                Donations help fund veterinary care, enrichment, and conservation work.
              </p>
              <a className="btn btn-sm" href="/donate">
                Donate
              </a>
            </div>
          </div>
        </section>

        {/* Footer Section */}
        <section className="section" style={{ marginTop: 8 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 16,
              color: "var(--ink-2)",
              fontSize: 13,
            }}
          >
            <div>
              <strong>H-Town Zoo</strong>
              <div>123 Safari Way, Houston, TX &mdash; Open daily 9am&ndash;5pm</div>
            </div>
            <div>
              <strong>Visit</strong>
              <div>
                <a href="/tickets">Tickets</a>
              </div>
              <div>
                <a href="/visit">Plan Your Visit</a>
              </div>
              <div>
                <a href="/orders">Find my order / Refunds</a>
              </div>
              <div>
                <a href="/Exhibits">Exhibits</a>
              </div>
            </div>
            <div>
              <strong>About</strong>
              <div>
                <a href="/about/mission">Our Mission</a>
              </div>
              <div>
                <a href="/about/conservation">Conservation</a>
              </div>
              <div>
                <a href="/about/contact">Contact</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}












