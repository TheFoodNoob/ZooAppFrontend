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
        String(v.vet_user_id).includes(s)
    );
  }, [vetVisits, search]);

  // Handle Edit button click
  const handleEditClick = (id) => {
    if (user.role === "keeper") {
      alert("Keepers are not allowed to edit vet visits.");
      setTimeout(() => setRoleError(""), 4000);
      return;
    }
    navigate(`/vetvisit/${id}/edit`);
  };

  // Handle Delete
  const handleDelete = async (id) => {
     if (user.role === "keeper") {
      alert("Keepers are not allowed to delete vet visits.");
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
    <div>
      <h1>Vet Visits</h1>

      {roleError && (
        <div style={{ color: "red", marginBottom: "12px" }}>{roleError}</div>
      )}

      <input
        type="text"
        placeholder="Search by reason, diagnosis, animal ID, vet ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "12px", padding: "6px", width: "100%" }}
      />

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <>
          {filteredVisits.length > 0 ? (
            filteredVisits.map((v) => (
              <div key={v.id} className="card card--wide" style={{ marginBottom: "16px" }}>
                <div className="two-col">
                  <div>
                    <label>Visit ID</label>
                    <div>{v.id}</div>
                  </div>
                  <div>
                    <label>Animal ID</label>
                    <div>{v.animal_id}</div>
                  </div>
                  <div>
                    <label>Animal Name</label>
                    <div>{v.name}</div>
                  </div>
                  <div>
                    <label>Species</label>
                    <div>{v.species_name}</div>
                  </div>
                  <div>
                    <label>Scientific Name</label>
                    <div><i>{v.sf_name}</i></div>
                  </div>
                  <div>
                    <label>Visit Date</label>
                    <div>{new Date(v.visit_date).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <label>Reason</label>
                    <div>{v.reason}</div>
                  </div>
                  <div>
                    <label>Diagnosis</label>
                    <div>{v.diagnosis}</div>
                  </div>
                  <div>
                    <label>Vet User ID</label>
                    <div>{v.vet_user_id}</div>
                  </div>
                </div>

                <div style={{ marginTop: "12px" }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate(`/vetvisit/${v.id}`)}
                    style={{ marginRight: "8px" }}
                  >
                    View
                  </button>

                  <button
                    className="btn"
                    onClick={() => handleEditClick(v.id)}
                    style={{ marginRight: "8px" }}
                  >
                    Edit
                  </button>

                   <button
                      className="btn btn-primary"
                      onClick={() => handleDelete(v.id)}
                      style={{ background: "#ac2525ff", borderColor: "#cc5555" }}
                    >
                      Delete
                    </button>
                </div>
              </div>
            ))
          ) : (
            <p>No vet visits found.</p>
          )}
        </>
      )}
    </div>
  );
}
