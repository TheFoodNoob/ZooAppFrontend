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

  // which visit (if any) is in "are you sure?" delete mode
  const [deleteId, setDeleteId] = useState(null);

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
        (v.name || "").toLowerCase().includes(s) ||
        (v.species_name || "").toLowerCase().includes(s)
    );
  }, [vetVisits, search]);

  const handleEditClick = (id) => {
    if (user.role === "keeper") {
      setRoleError("Keepers are not allowed to edit vet visits.");
      setTimeout(() => setRoleError(""), 4000);
      return;
    }
    navigate(`/vetvisit/${id}/edit`);
  };

  // Step 1: user clicks Delete → put that row into confirm mode
  const handleAskDelete = (id) => {
    if (user.role === "keeper") {
      setRoleError("Keepers are not allowed to delete vet visits.");
      setTimeout(() => setRoleError(""), 4000);
      return;
    }
    setDeleteId(id);
  };

  // Step 2: user clicks Confirm in the row
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;

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
    } finally {
      setDeleteId(null);
    }
  };

  // Step 3: user clicks Cancel
  const handleCancelDelete = () => {
    setDeleteId(null);
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
        style={{ marginBottom: "12px", padding: "6px", width: "100%" }}
      />

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <>
          {filteredVisits.length > 0 ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Visit ID</th>
                    <th>Animal</th>
                    <th>Species</th>
                    <th>Visit Date</th>
                    <th>Reason</th>
                    <th>Diagnosis</th>
                    <th>Vet ID</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.map((v) => {
                    const isConfirming = deleteId === v.id;
                    return (
                      <tr key={v.id}>
                        <td>{v.id}</td>
                        <td>
                          {v.name}{" "}
                          <span className="text-muted">
                            (ID {v.animal_id})
                          </span>
                        </td>
                        <td>{v.species_name}</td>
                        <td>{new Date(v.visit_date).toLocaleString()}</td>
                        <td>{v.reason}</td>
                        <td>{v.diagnosis}</td>
                        <td>{v.vet_user_id}</td>
                        <td
                          style={{
                            textAlign: "right",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {!isConfirming ? (
                            <>
                              <button
                                className="btn btn-small"
                                onClick={() => navigate(`/vetvisit/${v.id}`)}
                                style={{ marginRight: "6px" }}
                              >
                                View
                              </button>
                              <button
                                className="btn btn-small"
                                onClick={() => handleEditClick(v.id)}
                                style={{ marginRight: "6px" }}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-small"
                                style={{
                                  backgroundColor: "#ac2525ff",
                                  borderColor: "#cc5555",
                                  color: "white",
                                }}
                                onClick={() => handleAskDelete(v.id)}
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <>
                              <span
                                style={{
                                  fontSize: "0.85rem",
                                  marginRight: "8px",
                                  color: "#374151",
                                }}
                              >
                                Delete this visit?
                              </span>
                              <button
                                className="btn btn-small"
                                onClick={handleConfirmDelete}
                                style={{
                                  backgroundColor: "#b91c1c", // red
                                  borderColor: "#7f1d1d",
                                  color: "white",
                                  marginRight: "4px",
                                }}
                              >
                                Confirm
                              </button>
                              <button
                                className="btn btn-small"
                                onClick={handleCancelDelete}
                                style={{
                                  backgroundColor: "#e5e7eb", // light gray
                                  borderColor: "#d1d5db",
                                  color: "#374151",
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
