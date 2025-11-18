import React, { useEffect, useState } from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import Toast from "../../components/Toast";
import { useNavigate } from "react-router-dom";

export default function Feedings() {
  const { token, user } = useAuth();
  const nav = useNavigate();

  const [feedings, setFeedings] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [foods, setFoods] = useState([]);

  const [form, setForm] = useState({
    animal_id: "",
    animal_name: "",
    food_id: "",
    feed_amount_kg: "",
    feeding_time: "",
  });

  const [toast, setToast] = useState({ open: false, type: "info", text: "" });
  const showToast = (type, text) => setToast({ open: true, type, text });

  useEffect(() => {
    if (!toast.open) return;
    const t = setTimeout(() => setToast((s) => ({ ...s, open: false })), 2500);
    return () => clearTimeout(t);
  }, [toast.open]);

  const canEdit = ["admin", "keeper"].includes(user?.role);

  useEffect(() => {
    loadFeedings();
    loadAnimals();
  }, []);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const loadFeedings = async () => {
    try {
      const res = await fetch(`${api}/api/feedings`, { headers: authHeaders });
      if (!res.ok) throw new Error("Failed to load feedings");
      const data = await res.json();
      setFeedings(data);
    } catch (err) {
      showToast("error", err.message || "Error loading feedings");
    }
  };

  const loadAnimals = async () => {
    try {
      const res = await fetch(`${api}/api/animals/feedings`, { headers: authHeaders });
      if (!res.ok) throw new Error("Failed to load animals");
      const data = await res.json();
      setAnimals(data);
    } catch (err) {
      showToast("error", err.message || "Error loading animals");
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.animal_id || !form.food_id || !form.feed_amount_kg || !form.feeding_time) {
      showToast("error", "Select animal, food, amount, and feeding time");
      return;
    }

    if (!user?.employee_id) {
      showToast("error", "Missing employee id on user – cannot log feeding");
      return;
    }

    try {
      const payload = {
        animal_id: Number(form.animal_id),
        feed_recorded_by: Number(user.employee_id),
        food_id: Number(form.food_id),
        feeding_time: form.feeding_time,
        feed_amount_kg: Number(form.feed_amount_kg),
      };

      const res = await fetch(`${api}/api/feedings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });

      const errBody = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(errBody.error || "Failed to log feeding");

      showToast("success", "Feeding logged!");
      setForm({ animal_id: "", animal_name: "", food_id: "", feed_amount_kg: "", feeding_time: "" });
      await loadFeedings();
    } catch (err) {
      showToast("error", err.message || "Failed to log feeding");
    }
  };

  const deleteFeeding = async (id) => {
    if (user.role === "vet") {
      alert("Vets are not allowed to delete feeding records.");
      return;
    }
    if (!window.confirm("Delete this feeding record? This cannot be undone.")) return;

    try {
      const res = await fetch(`${api}/api/feedings/${id}`, { method: "DELETE", headers: authHeaders });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Delete failed");
      showToast("success", "Feeding record deleted");
      await loadFeedings();
    } catch (err) {
      showToast("error", err.message || "Failed to delete feeding");
    }
  };
  const handleAnimalChange = (e) => {
    const animalId = e.target.value;

    // Find the selected animal
    const selectedAnimal = animals.find(a => a.animal_id.toString() === animalId);
    if (selectedAnimal === undefined) {
      alert("Selected animal not found");
      return;
    }
    console.log(selectedAnimal);
    // Update the form

    setForm((f) => ({
      ...f,
      animal_id: animalId,
      food_id: selectedAnimal?.food_id || "",
      feed_amount_kg: selectedAnimal?.min_amount || "",
    }));
};
  return (
    <div className="container container-wide">
      <div className="header-row">
        <h1>Animal Feedings</h1>
      </div>

      {/* LOG FORM */}
      <div className="card" style={{ marginBottom: 20 }}>
        <form
          onSubmit={submit}
          style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}
        >
          {/* Animal input with datalist */}
           {/* <input
            list="animal-list"
            className="input"
            placeholder="Select or type animal"
            value={form.animal_name || ""} // store the typed name for display
            onChange={(e) => {
              const inputValue = e.target.value;

              // Find by ID, name, or species
              const selectedAnimal = animals.find(
                a =>
                  a.animal_id.toString() === inputValue ||
                  a.animal_name.toLowerCase() === inputValue.toLowerCase() ||
                  a.species.toLowerCase() === inputValue.toLowerCase()
              );

              // Update form state
              setForm(f => ({
                ...f,
                animal_id: selectedAnimal?.animal_id || "",
                animal_name: inputValue, // show typed value
                food_id: selectedAnimal?.food_id || "",
                feed_amount_kg: selectedAnimal?.kg_per_day || ""
              }));
            }}
          />

          <datalist id="animal-list">
            {animals.map(a => (
              <option
                key={a.animal_id}
                value={a.animal_name} // display name for typing
              >
                {`${a.animal_name} (${a.species})`}
              </option>
            ))}
          </datalist> */}
          <select
            className="input"
            value={form.animal_id}
            onChange={handleAnimalChange}
          >
            <option value="">Select Animal</option>
            {animals.map((a) => (
              <option key={a.animal_id} value={a.animal_id}>
                {`${a.animal_name} (${a.species})`}
              </option>
            ))}
          </select>

          {/* Food select */}
          <select
            className="input"
            value={form.food_id}
            onChange={(e) => setForm((f) => ({ ...f, food_id: e.target.value }))}
          >
            <option value="">Select Food</option>
            {animals.map((a) => (
              <option key={a.animal_id} value={a.food_id}>
                {a.food_name}
              </option>
            ))}
          </select>

          {/* Feed amount */}
          <input
            className="input"
            type="number"
            step="0.001"
            placeholder="Amount (kg)"
            value={form.feed_amount_kg}
            onChange={(e) => setForm((f) => ({ ...f, feed_amount_kg: e.target.value }))}
          />

          {/* Feeding time */}
          <input
            className="input"
            type="datetime-local"
            value={form.feeding_time}
            onChange={(e) => setForm((f) => ({ ...f, feeding_time: e.target.value }))}
          />

          <button className="btn">Log Feeding</button>
        </form>
      </div>

      {/* TABLE */}
      <div className="card">
        <h3>Past Feedings</h3>
        <table className="table wide">
          <thead>
            <tr>
              <th>Animal</th>
              <th>Animal ID</th>
              <th>Food</th>
              <th>Feeding Time</th>
              <th>Logged By</th>
              <th>Employee ID</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {feedings.map((f) => (
              <tr key={f.feeding_id}>
                <td>{f.animal_name}</td>
                <td>{f.animal_id}</td>
                <td>{f.food_name}</td>
                <td>{new Date(f.feeding_time).toLocaleString()}</td>
                <td>{`${f.employee_first_name} ${f.employee_last_name}`}</td>
                <td>{f.feed_recorded_by}</td>
                {canEdit && (
                  <td>
                    <button className="btn btn-sm" onClick={() => nav(`/feedings/${f.feeding_id}`)}>
                      View
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() => nav(`/feedings/${f.feeding_id}/edit`)}
                      style={{ margin: "0 5px" }}
                    >
                      Edit
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteFeeding(f.feeding_id)}>
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {feedings.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 7 : 6}>No feedings recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {toast.open && <Toast {...toast} onClose={() => setToast({ ...toast, open: false })} />}
    </div>
  );
}
