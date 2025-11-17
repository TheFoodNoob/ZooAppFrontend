// src/pages/employee/VetVisitNew.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import fetchAuth from "../../utils/fetchAuth";
import { useAuth } from "../../context/AuthContext";

export default function VetVisitNew() {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  // ---- animals for dropdown + table ----
  const [animals, setAnimals] = useState([]);
  const [animalsLoading, setAnimalsLoading] = useState(true);
  const [animalsError, setAnimalsError] = useState("");
  const [animalSearch, setAnimalSearch] = useState("");

  // ---- form state ----
  const [form, setForm] = useState({
    animal_id: "",
    vet_user_id: user?.id || "",            // or user?.employee_id if that's what you store
    visit_date: new Date().toISOString().slice(0, 16),
    reason: "",
    diagnosis: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load animals once (reuse the same /api/animals endpoint you use on the Animals page)
  useEffect(() => {
    const loadAnimals = async () => {
      setAnimalsLoading(true);
      setAnimalsError("");
      try {
        const res = await fetchAuth(`${api}/api/animals`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch animals");
        const data = await res.json();
        setAnimals(data);
      } catch (err) {
        console.error(err);
        setAnimalsError("Failed to load animals.");
      } finally {
        setAnimalsLoading(false);
      }
    };

    loadAnimals();
  }, [token]);

  // Filter animals according to search
  const filteredAnimals = useMemo(() => {
    const s = animalSearch.trim().toLowerCase();
    if (!s) return animals;

    return animals.filter((a) => {
      const idStr = String(a.animal_id || a.id || "");
      const name = (a.animal_name || a.name || "").toLowerCase();
      const species =
        (a.species_name || a.common_name || a.scientific_name || "").toLowerCase();
      return (
        idStr.includes(s) ||
        name.includes(s) ||
        species.includes(s)
      );
    });
  }, [animals, animalSearch]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSelectAnimal = (animalId) => {
    setForm((f) => ({ ...f, animal_id: String(animalId) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.animal_id) {
      setError("Please choose an animal for the visit.");
      return;
    }
    if (!form.reason.trim()) {
      setError("Reason is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        animal_id: Number(form.animal_id),
        vet_user_id: Number(form.vet_user_id),
        visit_date: form.visit_date,
        reason: form.reason.trim(),
        diagnosis: form.diagnosis.trim() || null,
      };

      const res = await fetchAuth(`${api}/api/vetvisit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Create failed");
      const data = await res.json();
      navigate(`/vetvisit/${data.vet_visit_id}`);
    } catch (err) {
      console.error(err);
      setError("Failed to create vet visit.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">New Vet Visit</h1>

      {/* MAIN FORM */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Animal ID is controlled by picker */}
          <div>
            <label className="block font-semibold mb-1">Selected Animal ID</label>
            <input
              type="number"
              name="animal_id"
              value={form.animal_id}
              onChange={handleChange}
              className="border p-2 w-full"
              placeholder="Pick from the picker below"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Vet User ID</label>
            <input
              type="number"
              name="vet_user_id"
              value={form.vet_user_id}
              onChange={handleChange}
              className="border p-2 w-full"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Visit Date</label>
            <input
              type="datetime-local"
              name="visit_date"
              value={form.visit_date}
              onChange={handleChange}
              className="border p-2 w-full"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Reason</label>
            <input
              type="text"
              name="reason"
              value={form.reason}
              onChange={handleChange}
              className="border p-2 w-full"
              placeholder="Lethargy, annual checkup, injury..."
              required
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">Diagnosis</label>
          <input
            type="text"
            name="diagnosis"
            value={form.diagnosis}
            onChange={handleChange}
            className="border p-2 w-full"
            placeholder="Optional – can be updated later"
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button
          type="submit"
          className="btn btn-primary mt-2"
          disabled={saving}
        >
          {saving ? "Saving..." : "Create Visit"}
        </button>
      </form>

      {/* ANIMAL PICKER SECTION */}
      <div className="card card--wide">
        <h2 className="text-xl font-semibold mb-3">Find Animal for Visit</h2>

        {/* Search + dropdown */}
        <div className="mb-3 grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">
              Search animals
            </label>
            <input
              type="text"
              value={animalSearch}
              onChange={(e) => setAnimalSearch(e.target.value)}
              className="border p-2 w-full"
              placeholder="Search by name, species, or ID..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Quick select (dropdown)
            </label>
            <select
              className="border p-2 w-full"
              value={form.animal_id}
              onChange={(e) => handleSelectAnimal(e.target.value)}
            >
              <option value="">— Select animal —</option>
              {filteredAnimals.slice(0, 25).map((a) => (
                <option key={a.animal_id} value={a.animal_id}>
                  {(a.animal_name || a.name) ?? "Unknown"} (ID {a.animal_id}) –{" "}
                  {a.species_name || a.common_name || a.scientific_name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Showing first 25 matches. Use the table below for more details.
            </p>
          </div>
        </div>

        {/* Table */}
        {animalsLoading && <p>Loading animals…</p>}
        {animalsError && <p className="text-red-600">{animalsError}</p>}

        {!animalsLoading && !animalsError && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Animal ID</th>
                  <th>Animal</th>
                  <th>Species</th>
                  <th>Exhibit</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredAnimals.slice(0, 50).map((a) => {
                  const isSelected =
                    String(form.animal_id) === String(a.animal_id);
                  return (
                    <tr
                      key={a.animal_id}
                      className={isSelected ? "row-selected" : ""}
                    >
                      <td>{a.animal_id}</td>
                      <td>{a.animal_name || a.name}</td>
                      <td>{a.species_name || a.common_name}</td>
                      <td>{a.exhibit_name || a.exhibit || "-"}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-small"
                          onClick={() => handleSelectAnimal(a.animal_id)}
                        >
                          Use
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredAnimals.length === 0 && (
                  <tr>
                    <td colSpan={5}>No animals match that search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
