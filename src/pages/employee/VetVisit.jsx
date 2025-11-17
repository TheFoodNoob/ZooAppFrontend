// src/pages/employee/VetVisitsPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import fetchAuth from "../../utils/fetchAuth";
import { useAuth } from "../../context/AuthContext";

export default function VetVisitsPage() {
  const [vetVisits, setVetVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleError, setRoleError] = useState("");
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // Fetch vet visits
  useEffect(() => {
    const fetchVetVisits = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchAuth(`${api}/api/vetvisit`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch vet visits");
        const data = await res.json();
        setVetVisits(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load vet visits");
      } finally {
        setLoading(false);
      }
    };

    fetchVetVisits();
  }, [token]);

  // Filtered visits based on search
  const filteredVisits = useMemo(() => {
    if (!search.trim()) return vetVisits;
    const s = search.toLowerCase();
    return vetVisits.filter(
      (v) =>
        v.reason?.toLowerCase().includes(s) ||
        v.diagnosis?.toLowerCase().includes(s) ||
        String(v.animal_id).includes(s) ||
        String(v.vet_user_id).includes(s) ||
        v.name?.toLowerCase().includes(s) ||
        v.species_name?.toLowerCase().includes(s)
    );
  }, [vetVisits, search]);

  // Handle Edit button click
  const handleEditClick = (id) => {
    if (user.role === "keeper") {
      alert("Keepers are not allowed to edit vet visits.");
      setRoleError("Keepers cannot edit vet visits.");
      setTimeout(() => setRoleError(""), 4000);
      return;
    }
    navigate(`/vetvisit/${id}/edit`);
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (user.role === "keeper") {
      alert("Keepers are not allowed to delete vet visits.");
      setRoleError("Keepers cannot delete vet visits.");
      setTimeout(() => setRoleError(""), 4000);
      return;
    }
    if (!window.confirm("Delete this vet visit?")) return;
    try {
      const res = await fetchAuth(`${api}/api/vetvisit/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setVetVisits((prev) => prev.filter((v) => v.id !== id));
      } else {
        alert("Failed to delete visit.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete visit.");
    }
  };

  return (
    <div className="container container-wide">
      <div className="header-row">
        <h1>Vet Visits</h1>
        <div className="row-gap">
          {(user.role === "admin" || user.role === "vet") && (
            <button
              className="btn"
              type="button"
              onClick={() => navigate("/vetvisit/new")}
            >
              + New Visit
            </button>
          )}
        </div>
      </div>

      {roleError && (
        <div style={{ color: "red", marginBottom: "12px" }}>{roleError}</div>
      )}

      <input
        type="text"
        placeholder="Search by animal, species, reason, diagnosis, animal ID, vet ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          marginBottom: "12px",
          padding: "8px 10px",
          width: "100%",
          maxWidth: "500px",
        }}
      />

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <>
          {filteredVisits.length > 0 ? (
            <div
              className="card card--wide"
              style={{ padding: "12px 16px", overflowX: "auto" }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.9rem",
                }}
              >
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "6px 4px" }}>
                      Visit ID
                    </th>
                    <th style={{ textAlign: "left", padding: "6px 4px" }}>
                      Animal
                    </th>
                    <th style={{ textAlign: "left", padding: "6px 4px" }}>
                      Species
                    </th>
                    <th style={{ textAlign: "left", padding: "6px 4px" }}>
                      Visit Date
                    </th>
                    <th style={{ textAlign: "left", padding: "6px 4px" }}>
                      Reason
                    </th>
                    <th style={{ textAlign: "left", padding: "6px 4px" }}>
                      Diagnosis
                    </th>
                    <th style={{ textAlign: "left", padding: "6px 4px" }}>
                      Vet ID
                    </th>
                    <th style={{ textAlign: "center", padding: "6px 4px" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.map((v) => (
                    <tr
                      key={v.id}
                      style={{ borderTop: "1px solid #eee", height: "38px" }}
                    >
                      <td style={{ padding: "4px" }}>{v.id}</td>
                      <td style={{ padding: "4px" }}>
                        {v.name}{" "}
                        <span style={{ color: "#777", fontSize: "0.8rem" }}>
                          (ID {v.animal_id})
                        </span>
                      </td>
                      <td style={{ padding: "4px" }}>{v.species_name}</td>
                      <td style={{ padding: "4px" }}>
                        {new Date(v.visit_date).toLocaleString()}
                      </td>
                      <td style={{ padding: "4px", maxWidth: "160px" }}>
                        {v.reason}
                      </td>
                      <td style={{ padding: "4px", maxWidth: "180px" }}>
                        {v.diagnosis}
                      </td>
                      <td style={{ padding: "4px" }}>{v.vet_user_id}</td>
                      <td
                        style={{
                          padding: "4px",
                          textAlign: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <button
                          className="btn btn-small"
                          style={{ marginRight: "4px" }}
                          onClick={() => navigate(`/vetvisit/${v.id}`)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-small"
                          style={{ marginRight: "4px" }}
                          onClick={() => handleEditClick(v.id)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-small btn-primary"
                          style={{
                            background: "#ac2525ff",
                            borderColor: "#cc5555",
                          }}
                          onClick={() => handleDelete(v.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No vet visits found.</p>
          )}
        </>
      )}
    </div>
  );
}
