// VetVisitsPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { api } from "../../api";
import fetchAuth from "../../utils/fetchAuth";
import { useAuth } from "../../context/AuthContext";
export default function VetVisitsPage() {
  const [vetVisits, setVetVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const {token} = useAuth();
  // Fetch vet visits on mount
  useEffect(() => {
    const fetchVetVisits = async () => {
      setLoading(true);
      setError("");
      try {
        
        const res = await fetchAuth(`${api}/api/vetvisit`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
  }, []);

  // Filtered results
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

  return (
   <div>
  <h1>Vet Visits</h1>

  <input
    type="text"
    placeholder="Search by reason, diagnosis, animal ID, vet ID..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  {loading && <p>Loading...</p>}
  {error && <p>{error}</p>}

  {!loading && !error && (
    <>
      {filteredVisits.length > 0 ? (
        filteredVisits.map((v) => (
          <div key={v.id} className="card card--wide">
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
