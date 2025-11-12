import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";

export default function Coordinator() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${api}/api/public/events?limit=3&order=ASC`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load events:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="page" style={{ padding: "24px 16px" }}>
      <div className="container" style={{ maxWidth: 1120, margin: "0 auto" }}>
        <h2 style={{ margin: "0 0 12px 0" }}>Coordinator Dashboard</h2>

        <div
          className="card"
          style={{
            padding: 20,
            background: "#fff8e1",
            borderRadius: 12,
            boxShadow: "0 2px 6px rgba(0,0,0,0.08), 0 12px 28px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "grid", gap: 12 }}>
            {/* Scheduling Section */}
            <section>
              <h3 style={{ margin: "0 0 8px" }}>Scheduling</h3>

              {loading ? (
                <p className="note">Loading schedules...</p>
              ) : events.length === 0 ? (
                <p className="note">No schedules yet.</p>
              ) : (
                <>
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {events.map((event) => (
                      <li
                        key={event.event_id}
                        style={{
                          background: "#fff",
                          border: "1px solid #ddd",
                          borderRadius: 8,
                          padding: "10px 14px",
                          marginBottom: 8,
                        }}
                      >
                        <strong>{event.name}</strong>
                        <br />
                        {new Date(event.start_time).toLocaleString()} —{" "}
                        {new Date(event.end_time).toLocaleString()}
                        <br />
                        <span style={{ color: "#666" }}>{event.location}</span>
                      </li>
                    ))}
                  </ul>

                  {/* ✅ "See More" link */}
                  <div style={{ textAlign: "right", marginTop: 8 }}>
                    <Link to="/events" style={{ color: "#1976d2", fontWeight: 500 }}>
                      See more →
                    </Link>
                  </div>
                </>
              )}
            </section>

            {/* Assignments Section */}
            <section>
              <h3 style={{ margin: "0 0 8px" }}>Assignments</h3>
              <p className="note">No assignments to show.</p>
            </section>

            {/* Requests Section */}
            <section>
              <h3 style={{ margin: "0 0 8px" }}>Open Requests</h3>
              <p className="note">No requests pending.</p>
            </section>
          </div>
        </div>
      </div>

      {/* Existing Manage Events button */}
      <Link to="/events">
        <button className="btn">Manage events</button>
      </Link>
    </div>
  );
}
