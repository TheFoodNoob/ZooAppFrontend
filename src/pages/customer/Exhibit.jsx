// src/pages/customer/Exhibit.jsx
import React from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";

// Metadata for each exhibit: copy matches what you put in the DB
const EXHIBIT_META = {
  "Reptiles and Amphibians": {
    habitat: "Reptile House & Wetlands",
    description:
      "This exhibit combines aquatic, forest-floor, and rocky habitats to show the diversity of cold-blooded species. Visitors can see reptiles basking for heat and amphibians in moist environments.",
    photo: "reptiles-amphibians.webp", // /public/img/exhibits/reptiles-amphibians.webp
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
          // Logged-out: go straight to public endpoint
          const res = await fetch(`${api}/api/public/animals-per-exhibit`);
          if (!res.ok) {
            throw new Error(`Failed to load exhibits (${res.status})`);
          }
          data = await res.json();
          setIsPublic(true);
        } else {
          // Logged-in with staff token: try protected first, then fall back
          let res = await fetch(`${api}/api/reports/animals-per-exhibit`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.status === 401 || res.status === 403) {
            // Not authorized for staff report – fall back to public view
            res = await fetch(`${api}/api/public/animals-per-exhibit`);
            if (!res.ok) {
              throw new Error(`Failed to load exhibits (${res.status})`);
            }
            data = await res.json();
            setIsPublic(true);
          } else {
            if (!res.ok) {
              throw new Error(`Failed to load exhibits (${res.status})`);
            }
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

  // Sort by exhibit name for a stable, nice-looking list
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

          <div
            className="exhibits-list"
            style={{
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {loading && <div>Loading…</div>}
            {err && <div className="error">{err}</div>}
            {!loading && !err && sorted.length === 0 && (
              <div>No exhibits found.</div>
            )}

            {!loading &&
            !err &&
            sorted.map((r, i) => {
              const name = r.exhibit || "Exhibit";
              const meta = EXHIBIT_META[name] || {};
              const count = Number(r.animal_count ?? 0);
              const label = count === 1 ? "animal" : "animals";
              const photoSrc = meta.photo
                ? `/img/exhibits/${meta.photo}`
                : null;

              return (
                <section
                  key={`${name}-${i}`}
                  className="card"
                  style={{
                    margin: 0,
                    borderRadius: 14,
                    border: "1px solid #f3e8c8",
                    background: "#fffdf5",
                    padding: "10px 14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                    }}
                  >
                    {photoSrc && (
                      <div
                        style={{
                          flex: "0 0 88px",
                          height: 70,
                          borderRadius: 10,
                          overflow: "hidden",
                          background: "#e9e2cf",
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

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "space-between",
                          gap: 10,
                          marginBottom: 4,
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

                        <div
                          style={{
                            fontSize: 13,
                            whiteSpace: "nowrap",
                            opacity: 0.85,
                          }}
                        >
                          <strong>{count}</strong> {label}
                        </div>
                      </div>

                      {meta.habitat && (
                        <div
                          style={{
                            fontSize: 12,
                            marginBottom: 4,
                            color: "#6b5b3a",
                          }}
                        >
                          Habitat: <strong>{meta.habitat}</strong>
                        </div>
                      )}

                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          color: "#5b4633",
                        }}
                      >
                        {meta.description ||
                          "This exhibit groups animals that share a similar habitat and care needs."}
                      </p>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

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
