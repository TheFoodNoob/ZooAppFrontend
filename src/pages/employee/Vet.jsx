import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";

export default function Vet() {
  const { token } = useAuth();
  const [upcomingVisits, setUpcomingVisits] = useState([]);
  const [pastVisits, setPastVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    fetch(`${api}/api/vetvisit?order=ASC`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch visits");
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.results)
          ? data.results
          : [];

        const now = new Date();

        // Separate upcoming and past visits
        const upcoming = list
          .filter((v) => new Date(v.visit_date) >= now)
          .sort((a, b) => new Date(a.visit_date) - new Date(b.visit_date));

        const past = list
          .filter((v) => new Date(v.visit_date) < now)
          .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date)); // newest first

        setUpcomingVisits(upcoming.slice(0, 3)); // show 3 upcoming
        setPastVisits(past.slice(0, 3)); // show 3 recent treatments
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching vet visits:", err);
        setLoading(false);
      });
  }, [token]);

  const renderVisits = (visits) =>
    visits.length === 0 ? (
      <p className="note">Nothing to show.</p>
    ) : (
      <ul style={{ listStyle: "none", padding: 0 }}>
        {visits.map((v) => (
          <li
            key={v.id}
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 8,
            }}
          >
            <strong>{v.name || "Unknown Animal"}</strong>
            <br />
            {new Date(v.visit_date).toLocaleString()}
            <br />
            <span style={{ color: "#666" }}>{v.reason || "No reason listed"}</span>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="page" style={{ padding: "24px 16px" }}>
      <div className="container" style={{ maxWidth: 1120, margin: "0 auto" }}>
        <h2 style={{ margin: "0 0 12px 0" }}>Vet Dashboard</h2>

        <div
          className="card"
          style={{
            padding: 20,
            background: "#fff8e1",
            borderRadius: 12,
            boxShadow:
              "0 2px 6px rgba(0,0,0,0.08), 0 12px 28px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "grid", gap: 12 }}>
            {/* Upcoming Appointments */}
            <section>
              <h3 style={{ margin: "0 0 8px" }}>Upcoming Appointments</h3>
              {loading ? <p className="note">Loading appointments...</p> : renderVisits(upcomingVisits)}
            </section>

            {/* Medical Alerts */}
            <section>
              <h3 style={{ margin: "0 0 8px" }}>Medical Alerts</h3>
              <p className="note">No alerts.</p>
            </section>

            {/* Recent Treatments */}
            <section>
              <h3 style={{ margin: "0 0 8px" }}>Recent Treatments</h3>
              {loading ? <p className="note">Loading...</p> : renderVisits(pastVisits)}
            </section>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <Link to="/vetvisit" style={{ color: "#1976d2", fontWeight: 500 }}>
            View all appointments
          </Link>
        </div>
      </div>

    </div>
  );
}
