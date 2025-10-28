// src/pages/customer/Animals.jsx
import React from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";

export default function CAnimals() {
  const { token } = useAuth();
  const [isPublic, setIsPublic] = React.useState(false);
  const [animals, setAnimals] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    (async () => {
      setLoading(true); setErr("");
      try {
        let data;
       // If no token, go straight to the public endpoint (no 401 noise)
       if (!token) {
         const res = await fetch(`${api}/api/public/animals-basic`);
         if (!res.ok) throw new Error(`Failed to load animals (${res.status})`);
         data = await res.json();
         setIsPublic(true);
       } else {
         // Logged in: try protected first, then silently fall back
         let res = await fetch(`${api}/api/reports/animals-basic`, {
           headers: { Authorization: `Bearer ${token}` },
         });
         if (res.status === 401 || res.status === 403) {
           res = await fetch(`${api}/api/public/animals-basic`);
           if (!res.ok) throw new Error(`Failed to load animals (${res.status})`);
           data = await res.json();
           setIsPublic(true);
         } else {
           if (!res.ok) throw new Error(`Failed to load animals (${res.status})`);
           data = await res.json();
           setIsPublic(false);
         }
       }
        setAnimals(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message || "Failed to load animals");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <div className="page">
      <h1>Meet Our Animals</h1>
      <div className="panel">
        {loading && <div>Loading…</div>}
        {err && <div className="error">{err}</div>}
        {!loading && !err && animals.length === 0 && (
          <div>No animals found. {token ? "" : "Login to view internal data."}</div>
        )}
        <div className="grid">
          {animals.map((a) => (
            <div key={a.animal_id} className="card">
              <h3 style={{ marginBottom: 4 }}>
                {a.animal_name || a.name || "Unnamed"}
              </h3>
              <div style={{ opacity: 0.75, fontSize: 14 }}>
                {a.species || a.common_name || "Species N/A"}
              </div>
              {a.exhibit && (
                <div style={{ marginTop: 6, fontSize: 13 }}>
                  Exhibit: <strong>{a.exhibit}</strong>
                </div>
              )}
            </div>
          ))}
        </div>
        
          {isPublic && (
   <div className="note">Public mode: showing limited data. Log in for full details.</div>
 )}
          
      </div>
    </div>
  );
}
