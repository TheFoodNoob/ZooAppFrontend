import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api";
import fetchAuth from "../../utils/fetchAuth";
import { useAuth } from "../../context/AuthContext";

export default function VetVisitView() {
  const { id } = useParams();
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchVisit = async () => {
      try {
        const res = await fetchAuth(`${api}/api/vetvisit/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch visit");

        const data = await res.json();
        setVisit(data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch vet visit.");
      } finally {
        setLoading(false);
      }
    };

    fetchVisit();
  }, [id, token]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!visit) return <div>Vet visit not found.</div>;

  const containerStyle = {
    maxWidth: "500px",
    margin: "20px auto",
    padding: "20px",
    backgroundColor: "#fff",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    borderRadius: "8px",
    fontFamily: "Arial, sans-serif",
  };

  const labelStyle = {
    fontWeight: "bold",
    marginRight: "8px",
  };

  const rowStyle = {
    marginBottom: "12px",
  };

  const backLinkStyle = {
    color: "#1e90ff",
    textDecoration: "none",
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>Vet Visit Details</h1>

      <div style={rowStyle}>
        <span style={labelStyle}>Animal:</span> {visit.name}
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Species:</span> {visit.species_name}
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Date:</span>{" "}
        {new Date(visit.visit_date).toLocaleString()}
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Reason:</span> {visit.reason}
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Diagnosis:</span> {visit.diagnosis || "None recorded"}
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Vet User ID:</span> {visit.vet_user_id}
      </div>

      <div style={{ marginTop: "20px" }}>
        <Link to="/vetvisit" style={backLinkStyle}>
          ← Back to Vet Visits
        </Link>
      </div>
    </div>
  );
}
