// src/pages/customer/Exhibit.jsx
import React from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";
import { Link } from "react-router-dom";   // ⬅️ NEW

// Metadata for each exhibit: copy matches what you put in the DB
const EXHIBIT_META = {
  "Reptiles and Amphibians": {
    habitat: "Reptile House & Wetlands",
    description:
      "This exhibit combines aquatic, forest-floor, and rocky habitats to show the diversity of cold-blooded species. Visitors can see reptiles basking for heat and amphibians in moist environments.",
    photo: "reptiles-amphibians.webp",
  },
  Birds: {
    habitat: "Aviary Loop",
    description:
      "The bird exhibit showcases species with vibrant coloration and distinctive calls, with perches, shallow water, and open viewing areas to watch flight and social behavior.",
    photo: "birds.jpg",
  },
  "Carnivorous Mammals": {
    habitat: "Predator Ridge",
    description:
      "Predators and small carnivores live in spacious enclosures with hiding areas, climbing structures, and large viewing windows that highlight hunting instincts and social communication.",
    photo: "carnivorous-mammals.jpg",
  },
  Primates: {
    habitat: "Forest Canopy Walk",
    description:
      "The primate exhibit features ropes, climbing structures, and enrichment areas where guests can observe tool use, grooming, and complex social interactions.",
    photo: "primates.jpg",
  },
  Herbivores: {
    habitat: "Savanna Plains",
    description:
      "Gentle plant-eating giants roam savanna-style habitats with tall trees and broad open spaces that encourage grazing and herd behavior.",
    photo: "herbivores.webp",
  },
};

export default function Exhibits() {
  const { token } = useAuth();
  const [isPublic, setIsPublic] = React.useState(false);
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        let data;

        if (!token) {
          const res = await fetch(`${api}/api/public/animals-per-exhibit`);
          if (!res.ok) throw new Error(`Failed to load exhibits (${res.status})`);
          data = await res.json();
          setIsPublic(true);
        } else {
          let res = await fetch(`${api}/api/reports/animals-per-exhibit`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.status === 401 || res.status === 403) {
            res = await fetch(`${api}/api/public/animals-per-exhibit`);
            if (!res.ok) throw new Error(`Failed to load exhibits (${res.status})`);
            data = await res.json();
            setIsPublic(true);
          } else {
            if (!res.ok) throw new Error(`Failed to load exhibits (${res.status})`);
            data = await res.json();
            setIsPublic(false);
          }
        }

        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message || "Failed to load exhibits");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const sorted = [...rows].sort((a, b) =>
    String(a.exhibit || "").localeCompare(String(b.exhibit || ""))
  );

  return (
    <div className="page">
      <div className="container">
        <h1>Zoo Exhibits</h1>
        <p className="page-intro">
          Explore the major habitats around H-Town Zoo. Each exhibit groups
          animals by where they live in the wild so guests can experience the
          environment as well as the animals.
        </p>

        <div
          className="card"
          style={{
            marginTop: 16,
            padding: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid #f0ead8",
              fontSize: 14,
              color: "var(--muted)",
            }}
          >
            {isPublic
              ? "Public view: showing exhibit names and animal counts."
              : "Staff view: data comes directly from the animals-per-exhibit report."}
          </div>

          {loading && (
            <div style={{ padding: 16 }}>
              <div>Loading…</div>
            </div>
          )}

          {!loading && err && (
            <div style={{ padding: 16 }}>
              <div className="error">{err}</div>
            </div>
          )}

          {!loading && !err && sorted.length === 0 && (
            <div style={{ padding: 16 }}>
              <div>No exhibits found.</div>
            </div>
          )}

          {!loading && !err && sorted.length > 0 && (
            <div
              className="exhibits-grid"
              style={{
                padding: 16,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              {sorted.map((r, i) => {
                const name = r.exhibit || "Exhibit";
                const meta = EXHIBIT_META[name] || {};
                const count = Number(r.animal_count ?? 0);
                const label = count === 1 ? "animal" : "animals";
                const photoSrc = meta.photo
                  ? `/img/exhibits/${meta.photo}`
                  : null;

                return (
                  <article
                    key={`${name}-${i}`}
                    className="card"
                    style={{
                      margin: 0,
                      borderRadius: 14,
                      border: "1px solid #f3e8c8",
                      background: "#fffdf5",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {photoSrc && (
                      <div
                        style={{
                          height: 140,
                          background: "#e9e2cf",
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={photoSrc}
                          alt={name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </div>
                    )}

                    <div
                      style={{
                        padding: "10px 12px 12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            fontSize: 16,
                            fontWeight: 600,
                          }}
                        >
                          {name}
                        </h3>

                        <span
                          style={{
                            fontSize: 12,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "#f7e9c7",
                            color: "#5b4633",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {count} {label}
                        </span>
                      </div>

                      {meta.habitat && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6b5b3a",
                          }}
                        >
                          Habitat: <strong>{meta.habitat}</strong>
                        </div>
                      )}

                      <p
                        style={{
                          margin: 0,
                          marginTop: 4,
                          fontSize: 14,
                          color: "#5b4633",
                        }}
                      >
                        {meta.description ||
                          "This exhibit groups animals that share a similar habitat and care needs."}
                      </p>

                      {/* View animals link */}
                      <div style={{ marginTop: 10 }}>
                      <Link to="/animals" className="btn btn-primary btn-sm">
                        View animals
                      </Link>
                    </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {isPublic && (
            <div
              className="note"
              style={{
                borderTop: "1px solid #f0ead8",
                padding: "10px 16px",
                fontSize: 13,
                color: "var(--muted)",
              }}
            >
              Public mode: animal details are hidden in this view. Staff can log
              in to see full records in the employee tools.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
