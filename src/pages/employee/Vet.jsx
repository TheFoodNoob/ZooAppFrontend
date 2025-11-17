// src/pages/employee/Vet.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api";
import fetchAuth from "../../utils/fetchAuth";
import { useAuth } from "../../context/AuthContext";

export default function Vet() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Simple filter for the “Upcoming” card (today | week | all)
  const [scope, setScope] = useState("week");

  // Load all vet visits (same endpoint you already use elsewhere)
  useEffect(() => {
    if (!token) return;

    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetchAuth(`${api}/api/vetvisit?order=ASC`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch vet visits");
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.results)
          ? data.results
          : [];
        setVisits(list);
      } catch (e) {
        console.error("Error fetching vet visits:", e);
        setErr("Failed to load vet schedule.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);

  const schedule = useMemo(() => {
    const upcoming = [];
    const past = [];
    const today = [];

    visits.forEach((v) => {
      const d = new Date(v.visit_date);
      const iso = d.toISOString().slice(0, 10);

      if (d >= now) {
        upcoming.push(v);
        if (iso === todayISO) today.push(v);
      } else {
        past.push(v);
      }
    });

    upcoming.sort((a, b) => new Date(a.visit_date) - new Date(b.visit_date));
    past.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));

    const nextVisit = upcoming.length ? upcoming[0] : null;

    // scope-filtered upcoming list for the main card
    let scopedUpcoming = upcoming;
    if (scope === "today") {
      scopedUpcoming = upcoming.filter(
        (v) => new Date(v.visit_date).toISOString().slice(0, 10) === todayISO
      );
    } else if (scope === "week") {
      const weekAhead = new Date(now);
      weekAhead.setDate(weekAhead.getDate() + 7);
      scopedUpcoming = upcoming.filter(
        (v) => new Date(v.visit_date) <= weekAhead
      );
    }

    return {
      upcoming,
      past,
      today,
      nextVisit,
      scopedUpcoming,
    };
  }, [visits, now, todayISO, scope]);

  const { upcoming, past, today, nextVisit, scopedUpcoming } = schedule;

  const totalVisits = visits.length;
  const totalUpcoming = upcoming.length;
  const totalToday = today.length;

  const handleOpenVisit = (id) => navigate(`/vetvisit/${id}`);
  const handleOpenAnimal = (animalId) => navigate(`/animals/${animalId}`);

  const formatDateTime = (iso) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const formatDateOnly = (iso) => {
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="page" style={{ padding: "24px 16px" }}>
      <div className="container" style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>
              Vet Dashboard
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 14,
                color: "#555",
              }}
            >
              Welcome back, {user?.first_name || "vet"} – manage exams, treatments,
              and medical records from one place.
            </p>
          </div>

          {/* Primary actions */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate("/vetvisit/new")}
            >
              + New vet visit
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => navigate("/animals/directory")}
            >
              Animal directory
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => navigate("/vetvisit")}
            >
              All appointments
            </button>
          </div>
        </div>

        {/* Error message */}
        {err && (
          <div
            style={{
              marginBottom: 12,
              padding: "10px 12px",
              borderRadius: 8,
              background: "#ffe5e5",
              color: "#8a1f1f",
              fontSize: 14,
            }}
          >
            {err}
          </div>
        )}

        {/* Main grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.2fr)",
            gap: 16,
          }}
        >
          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Next appointment card */}
            <div
              className="card"
              style={{
                padding: 18,
                borderRadius: 12,
                background: "#fff8e1",
                boxShadow:
                  "0 2px 6px rgba(0,0,0,0.06), 0 12px 24px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 16 }}>Next appointment</h3>
                {nextVisit && (
                  <span style={{ fontSize: 12, color: "#666" }}>
                    {formatDateOnly(nextVisit.visit_date)}
                  </span>
                )}
              </div>

              {loading ? (
                <p className="note">Loading schedule…</p>
              ) : !nextVisit ? (
                <p className="note">No upcoming appointments scheduled.</p>
              ) : (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "#ffffff",
                    border: "1px solid #f0e0aa",
                    cursor: "pointer",
                  }}
                  onClick={() => handleOpenVisit(nextVisit.id)}
                >
                  <div style={{ fontWeight: 600 }}>
                    {nextVisit.name || "Unknown animal"}
                  </div>
                  <div style={{ fontSize: 13, color: "#555" }}>
                    {formatDateTime(nextVisit.visit_date)}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#777",
                      marginTop: 4,
                    }}
                  >
                    Reason: {nextVisit.reason || "—"}
                  </div>
                </div>
              )}
            </div>

            {/* Upcoming schedule card with scope filter */}
            <div
              className="card"
              style={{
                padding: 18,
                borderRadius: 12,
                background: "#ffffff",
                boxShadow:
                  "0 2px 6px rgba(0,0,0,0.04), 0 10px 20px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 16 }}>Upcoming appointments</h3>

                <div
                  style={{
                    display: "inline-flex",
                    gap: 4,
                    borderRadius: 999,
                    background: "#f5f5f5",
                    padding: 3,
                  }}
                >
                  {["today", "week", "all"].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setScope(key)}
                      style={{
                        border: "none",
                        padding: "4px 10px",
                        borderRadius: 999,
                        fontSize: 11,
                        cursor: "pointer",
                        background:
                          scope === key ? "#2f7d32" : "transparent",
                        color: scope === key ? "#fff" : "#555",
                        fontWeight: scope === key ? 600 : 500,
                      }}
                    >
                      {key === "today"
                        ? "Today"
                        : key === "week"
                        ? "Next 7 days"
                        : "All"}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <p className="note">Loading appointments…</p>
              ) : scopedUpcoming.length === 0 ? (
                <p className="note">No appointments in this time window.</p>
              ) : (
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    maxHeight: 260,
                    overflowY: "auto",
                  }}
                >
                  {scopedUpcoming.slice(0, 8).map((v) => (
                    <li
                      key={v.id}
                      style={{
                        padding: "10px 0",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                          alignItems: "baseline",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenVisit(v.id)}
                          style={{
                            border: "none",
                            background: "none",
                            padding: 0,
                            margin: 0,
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 14,
                              marginBottom: 2,
                            }}
                          >
                            {v.name || "Unknown animal"}
                          </div>
                          <div
                            style={{ fontSize: 12, color: "#777" }}
                          >
                            {formatDateTime(v.visit_date)}
                          </div>
                        </button>
                        <button
                          type="button"
                          className="btn btn-small"
                          style={{ fontSize: 11 }}
                          onClick={() => handleOpenAnimal(v.animal_id)}
                        >
                          Animal record
                        </button>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#555",
                          marginTop: 2,
                        }}
                      >
                        Reason: {v.reason || "—"}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div style={{ marginTop: 8, textAlign: "right" }}>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => navigate("/vetvisit")}
                  style={{ fontSize: 12 }}
                >
                  View full schedule →
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Recent treatments */}
            <div
              className="card"
              style={{
                padding: 18,
                borderRadius: 12,
                background: "#ffffff",
                boxShadow:
                  "0 2px 6px rgba(0,0,0,0.04), 0 10px 20px rgba(0,0,0,0.03)",
              }}
            >
              <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>
                Recent treatments
              </h3>
              {loading ? (
                <p className="note">Loading…</p>
              ) : past.length === 0 ? (
                <p className="note">No past visits recorded yet.</p>
              ) : (
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    maxHeight: 220,
                    overflowY: "auto",
                  }}
                >
                  {past.slice(0, 5).map((v) => (
                    <li
                      key={v.id}
                      style={{
                        padding: "8px 0",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenVisit(v.id)}
                        style={{
                          border: "none",
                          background: "none",
                          padding: 0,
                          margin: 0,
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          {v.name || "Unknown animal"}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#777",
                          }}
                        >
                          {formatDateTime(v.visit_date)}
                        </div>
                      </button>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#555",
                          marginTop: 2,
                        }}
                      >
                        Reason: {v.reason || "—"}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#2f7d32",
                        }}
                      >
                        Diagnosis: {v.diagnosis || "—"}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Quick stats + tools */}
            <div
              className="card"
              style={{
                padding: 18,
                borderRadius: 12,
                background: "#fffdf5",
                boxShadow:
                  "0 2px 6px rgba(0,0,0,0.03), 0 8px 18px rgba(0,0,0,0.03)",
              }}
            >
              <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>
                At a glance
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 8,
                  marginBottom: 10,
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "#ffffff",
                    border: "1px solid #eee",
                  }}
                >
                  <div style={{ fontSize: 11, color: "#777" }}>Today</div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>
                    {totalToday}
                  </div>
                </div>
                <div
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "#ffffff",
                    border: "1px solid #eee",
                  }}
                >
                  <div style={{ fontSize: 11, color: "#777" }}>Upcoming</div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>
                    {totalUpcoming}
                  </div>
                </div>
                <div
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "#ffffff",
                    border: "1px solid #eee",
                  }}
                >
                  <div style={{ fontSize: 11, color: "#777" }}>All visits</div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>
                    {totalVisits}
                  </div>
                </div>
              </div>

              <h4
                style={{
                  margin: "6px 0 4px",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Quick tools
              </h4>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  fontSize: 13,
                }}
              >
                <li>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => navigate("/animals/directory")}
                  >
                    • Look up animals in directory
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => navigate("/vetvisit")}
                  >
                    • Review full vet visit log
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => navigate("/feedings")}
                  >
                    • Check feeding logs
                  </button>
                </li>
                {/* Placeholder for future medical reports */}
                <li style={{ color: "#999", marginTop: 4 }}>
                  • Medical reports (coming later)
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom link, same as before */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link
            to="/vetvisit"
            style={{ color: "#1976d2", fontWeight: 500, fontSize: 13 }}
          >
            View all appointments
          </Link>
        </div>
      </div>
    </div>
  );
}
