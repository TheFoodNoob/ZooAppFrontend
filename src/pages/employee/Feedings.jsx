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
  const [form, setForm] = useState({ animal_id: "", feeding_time: "" });
  const [toast, setToast] = useState({ open: false, type: "info", text: "" });

  const showToast = (type, text) => setToast({ open: true, type, text });
  useEffect(() => {
    if (!toast.open) return;
    const t = setTimeout(() => setToast(s => ({ ...s, open: false })), 2500);
    return () => clearTimeout(t);
  }, [toast.open]);

  const canEdit = ["admin", "vet", "keeper"].includes(user?.role);

  useEffect(() => {
    loadFeedings();
    loadAnimals();
  }, []);

  const loadFeedings = async () => {
    try {
      const res = await fetch(`${api}/api/feedings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load feedings");
      const data = await res.json();
      setFeedings(data);
    } catch (err) {
      showToast("error", err.message || "Error loading feedings");
    }
  };

  const loadAnimals = async () => {
    try {
      const res = await fetch(`${api}/api/animals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load animals");
      const data = await res.json();
      setAnimals(data);
    } catch (err) {
      showToast("error", err.message || "Error loading animals");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.animal_id || !form.feeding_time) {
      showToast("error", "Select an animal and feeding time");
      return;
    }

    try {
      const res = await fetch(`${api}/api/feedings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          animal_id: +form.animal_id,
          feeding_time: form.feeding_time,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to log feeding");
      }
      showToast("success", "Feeding logged!");
      setForm({ animal_id: "", feeding_time: "" });
      await loadFeedings();
    } catch (err) {
      showToast("error", err.message || "Failed to log feeding");
    }
  };

  const deleteFeeding = async (id) => {
    if (!window.confirm("Delete this feeding record? This cannot be undone.")) return;
    try {
      const res = await fetch(`${api}/api/feedings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Delete failed");
      showToast("success", "Feeding record deleted");
      await loadFeedings();
    } catch (err) {
      showToast("error", err.message || "Failed to delete feeding");
    }
  };

  return (
    <div>
      <h2>Animal Feedings</h2>

      <div className="panel" style={{ marginBottom: 20 }}>
        <form onSubmit={submit} style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            value={form.animal_id}
            onChange={(e) => setForm({ ...form, animal_id: e.target.value })}
          >
            <option value="">Select Animal</option>
            {animals.map((a) => (
              <option key={a.animal_id} value={a.animal_id}>
                {a.animal_name}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={form.feeding_time}
            onChange={(e) => setForm({ ...form, feeding_time: e.target.value })}
          />

          <button className="btn btn-primary">Log Feeding</button>
        </form>
      </div>

      <h3>Past Feedings</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid #ccc" }}>Animal</th>
            <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid #ccc" }}>Animal ID</th>
            <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid #ccc" }}>Food</th>
            <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid #ccc" }}>Feeding Time</th>
            <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid #ccc" }}>Logged By</th>
            <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid #ccc" }}>Employee ID</th>
            {canEdit && <th style={{ padding: 8, textAlign: "center", borderBottom: "1px solid #ccc" }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {feedings.map((f) => (
            <tr key={f.feeding_id} style={{ verticalAlign: "middle" }}>
              <td style={{ padding: 8 }}>{f.animal_name}</td>
              <td style={{ padding: 8 }}>{f.animal_id}</td>
              <td style={{ padding: 8 }}>{f.food_name}</td>
              <td style={{ padding: 8 }}>{new Date(f.feeding_time).toLocaleString()}</td>
              <td style={{ padding: 8 }}>{`${f.employee_first_name} ${f.employee_last_name}`}</td>
              <td style={{ padding: 8 }}>{f.feed_recorded_by}</td>
              {canEdit && (
                <td style={{ padding: 8, textAlign: "center" }}>
                  <button className="btn btn-sm" onClick={() => nav(`/feedings/${f.feeding_id}`)}>View</button>
                  <button className="btn btn-sm" onClick={() => nav(`/feedings/${f.feeding_id}/edit`)} style={{ margin: "0 5px" }}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteFeeding(f.feeding_id)}>Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {toast.open && <Toast {...toast} onClose={() => setToast({ ...toast, open: false })} />}
    </div>
  );
}
