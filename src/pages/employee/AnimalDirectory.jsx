import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import fetchAuth from "../../utils/fetchAuth";
import { useAuth } from "../../context/AuthContext";

export default function AnimalDirectory() {
  const { token } = useAuth();
  const navigate = useNavigate(); 

  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [exhibitFilter, setExhibitFilter] = useState("all");

  // Load all animals (same endpoint VetVisitNew uses)
  useEffect(() => {
    const loadAnimals = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchAuth(`${api}/api/animals`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch animals");
        const data = await res.json();
        setAnimals(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load animals.");
      } finally {
        setLoading(false);
      }
    };

    loadAnimals();
  }, [token]);

  // Unique species list for filter
  const speciesOptions = useMemo(() => {
    const s = new Set();
    animals.forEach((a) => {
      const name =
        a.species_name || a.common_name || a.scientific_name || "";
      if (name) s.add(name);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [animals]);

  // Unique exhibits list for filter
  const exhibitOptions = useMemo(() => {
    const s = new Set();
    animals.forEach((a) => {
      const ex = a.exhibit_name || a.exhibit || "";
      if (ex) s.add(ex);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [animals]);

  // Filter + sort animals
  const filteredAnimals = useMemo(() => {
    let list = [...animals];

    // default sort: by animal_id ascending
    list.sort((a, b) => (a.animal_id || 0) - (b.animal_id || 0));

    const term = search.trim().toLowerCase();

    if (term) {
      list = list.filter((a) => {
        const idStr = String(a.animal_id || a.id || "");
        const name = (a.animal_name || a.name || "").toLowerCase();
        const species = (
          a.species_name ||
          a.common_name ||
          a.scientific_name ||
          ""
        ).toLowerCase();
        const exhibit = (a.exhibit_name || a.exhibit || "").toLowerCase();
        return (
          idStr.includes(term) ||
          name.includes(term) ||
          species.includes(term) ||
          exhibit.includes(term)
        );
      });
    }

    if (speciesFilter !== "all") {
      list = list.filter((a) => {
        const s =
          a.species_name || a.common_name || a.scientific_name || "";
        return s === speciesFilter;
      });
    }

    if (exhibitFilter !== "all") {
      list = list.filter(
        (a) => (a.exhibit_name || a.exhibit || "") === exhibitFilter
      );
    }

    return list;
  }, [animals, search, speciesFilter, exhibitFilter]);

  return (
    <div className="container container-wide">
      <div className="header-row">
        <h1>Animal Directory</h1>
      </div>

      <p className="text-muted" style={{ marginBottom: "12px" }}>
        Browse all animals in the zoo. Use the search and filters to quickly
        find the right animal when planning treatments or creating vet visits.
      </p>

      {/* Filters row */}
      <div className="row-gap" style={{ marginBottom: "12px" }}>
        <input
          type="text"
          placeholder="Search by name, species, exhibit, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "6px", flex: "1 1 260px", minWidth: 0 }}
        />

        <select
          value={speciesFilter}
          onChange={(e) => setSpeciesFilter(e.target.value)}
          style={{ padding: "6px", minWidth: "160px" }}
        >
          <option value="all">All species</option>
          {speciesOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={exhibitFilter}
          onChange={(e) => setExhibitFilter(e.target.value)}
          style={{ padding: "6px", minWidth: "160px" }}
        >
          <option value="all">All exhibits</option>
          {exhibitOptions.map((ex) => (
            <option key={ex} value={ex}>
              {ex}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Loading animals…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <>
          {filteredAnimals.length === 0 ? (
            <p>No animals match that search/filter.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Animal ID</th>
                    <th>Animal</th>
                    <th>Species</th>
                    <th>Exhibit</th>
                    <th></th>
                    {/* Add more columns later if your API exposes them
                        (sex, age, status, etc.) */}
                  </tr>
                </thead>
                <tbody>
                  {filteredAnimals.map((a) => (
                    <tr key={a.animal_id}>
                      <td>{a.animal_id}</td>
                      <td>{a.animal_name || a.name}</td>
                      <td>
                        {a.species ||
                          a.common_name ||
                          a.scientific_name ||
                          "—"}
                      </td>
                      <td>{a.exhibit_name || a.exhibit || "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn btn-small"
                          onClick={() => navigate(`/animals/${a.animal_id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
