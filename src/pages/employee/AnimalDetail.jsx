// src/pages/employee/AnimalDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../../api";
import fetchAuth from "../../utils/fetchAuth";
import { useAuth } from "../../context/AuthContext";

export default function AnimalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [recentVisits, setRecentVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(true);
  const [visitsError, setVisitsError] = useState("");

  // --- load animal details ---
  useEffect(() => {
    const loadAnimal = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchAuth(`${api}/api/animals/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch animal");
        const data = await res.json();
        // if your API returns an array, pick first row
        setAnimal(Array.isArray(data) ? data[0] : data);
      } catch (err) {
        console.error(err);
        setError("Failed to load animal details.");
      } finally {
        setLoading(false);
      }
    };

    if (token) loadAnimal();
  }, [id, token]);

  // --- load recent vet visits for this animal ---
  useEffect(() => {
    const loadVisits = async () => {
      if (!token) return;
      setVisitsLoading(true);
      setVisitsError("");
      try {
        const res = await fetchAuth(`${api}/api/vetvisit`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch vet visits");
        const raw = await res.json();

        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw.results)
          ? raw.results
          : [];

        // filter for this animal + sort newest first
        const filtered = list
          .filter((v) => String(v.animal_id) === String(id))
          .sort(
            (a, b) =>
              new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
          )
          .slice(0, 5);

        setRecentVisits(filtered);
      } catch (err) {
        console.error(err);
        setVisitsError("Failed to load recent vet visits.");
      } finally {
        setVisitsLoading(false);
      }
    };

    loadVisits();
  }, [id, token]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!animal) return <div>Animal not found.</div>;

  const containerStyle = {
    maxWidth: "720px",
    margin: "24px auto",
    padding: "24px 20px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const labelStyle = {
    fontWeight: 600,
    marginRight: 8,
    minWidth: 140,
    display: "inline-block",
  };

  const rowStyle = {
    marginBottom: 10,
    fontSize: "0.95rem",
  };

  const visitsBoxStyle = {
    marginTop: 24,
    paddingTop: 16,
    borderTop: "1px solid #eee",
  };

  return (
    <div style={containerStyle}>
      {/* Header + primary actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.6rem", marginBottom: 4 }}>
            {animal.animal_name || animal.name || "Animal"}{" "}
            <span style={{ color: "#777", fontSize: "0.9rem" }}>
              (ID {animal.animal_id})
            </span>
          </h1>
          <div style={{ color: "#666", fontSize: "0.9rem" }}>
            {animal.exhibit_name || animal.exhibit
              ? `Exhibit: ${animal.exhibit_name || animal.exhibit}`
              : ""}
          </div>
        </div>

        {/* Create new vet visit for this animal */}
        <button
          type="button"
          className="btn btn-small btn-primary"
          onClick={() => navigate(`/vetvisit/new?animal_id=${animal.animal_id}`)}
        >
          + New Vet Visit
        </button>
      </div>

      {/* Core fields */}
      <div style={rowStyle}>
        <span style={labelStyle}>Species:</span>
        <span>
          {animal.species_name ||
            animal.common_name ||
            animal.scientific_name ||
            "—"}
        </span>
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Exhibit:</span>
        <span>{animal.exhibit_name || animal.exhibit || "—"}</span>
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Sex:</span>
        <span>{animal.sex || "—"}</span>
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Date of Birth:</span>
        <span>{animal.date_of_birth || "—"}</span>
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Status:</span>
        <span>{animal.status || animal.health_status || "—"}</span>
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Notes:</span>
        <span>{animal.notes || animal.description || "—"}</span>
      </div>

      {/* Recent vet visits */}
      <div style={visitsBoxStyle}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: 8 }}>
          Recent Vet Visits
        </h2>

        {visitsLoading && <div>Loading recent visits…</div>}
        {visitsError && (
          <div style={{ color: "red", fontSize: "0.9rem" }}>{visitsError}</div>
        )}

        {!visitsLoading && !visitsError && (
          <>
            {recentVisits.length === 0 ? (
              <div style={{ fontSize: "0.9rem", color: "#666" }}>
                No vet visits recorded for this animal yet.
              </div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {recentVisits.map((v) => (
                  <li
                    key={v.id}
                    style={{
                      padding: "8px 0",
                      borderBottom: "1px solid #f0f0f0",
                      fontSize: "0.9rem",
                    }}
                  >
                    <div>
                      <strong>
                        {new Date(v.visit_date).toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      Reason: <span>{v.reason || "—"}</span>
                    </div>
                    <div>
                      Diagnosis:{" "}
                      <span>{v.diagnosis || "None recorded"}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <Link to="/animals/directory" style={{ color: "#1976d2" }}>
          ← Back to Animal Directory
        </Link>
      </div>
    </div>
  );
}
