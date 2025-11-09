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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Vet Visits</h1>

      <input
        type="text"
        placeholder="Search by reason, diagnosis, animal ID, vet ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border px-2 py-1 w-full mb-4"
      />

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <table className="w-full border-collapse border">
          <thead>
            <tr>
              <th className="border px-2 py-1">Visit ID</th>
              <th className="border px-2 py-1">Animal ID</th>
              <th className="border px-2 py-1">Visit Date</th>
              <th className="border px-2 py-1">Reason</th>
              <th className="border px-2 py-1">Diagnosis</th>
              <th className="border px-2 py-1">Vet User ID</th>
            </tr>
          </thead>
          <tbody>
            {filteredVisits.map((v) => (
              <tr key={v.vet_visit_id}>
                <td className="border px-2 py-1">{v.vet_visit_id}</td>
                <td className="border px-2 py-1">{v.animal_id}</td>
                <td className="border px-2 py-1">
                  {new Date(v.visit_date).toLocaleString()}
                </td>
                <td className="border px-2 py-1">{v.reason}</td>
                <td className="border px-2 py-1">{v.diagnosis}</td>
                <td className="border px-2 py-1">{v.vet_user_id}</td>
              </tr>
            ))}
            {!filteredVisits.length && (
              <tr>
                <td colSpan="6" className="text-center py-2">
                  No vet visits found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
