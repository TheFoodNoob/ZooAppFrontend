import React, { useEffect, useState } from "react";
import { api } from "../../api"; // your base URL
import { useAuth } from "../../context/AuthContext";

export default function Feedings() {
  const { token } = useAuth();
  const [feedings, setFeedings] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [form, setForm] = useState({ animal_id: "", feeding_time: "" });
  const [msg, setMsg] = useState("");

  // Load feedings and animals on mount
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
      setMsg(err.message || "Error loading feedings");
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
      setMsg(err.message || "Error loading animals");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.animal_id || !form.feeding_time) {
      setMsg("Select an animal and feeding time");
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

      setMsg("Feeding logged!");
      setForm({ animal_id: "", feeding_time: "" });
      await loadFeedings();
    } catch (err) {
      setMsg(err.message || "Failed to log feeding");
    }
  };

  return (
    <div>
      <h2>Animal Feedings</h2>
      {msg && <p>{msg}</p>}
      <div className="panel">
      <form onSubmit={submit}>
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
      <table>
        <thead>
          <tr>
            <th>Animal</th>
            <th>Feeding Time</th>
            <th>Logged By</th>
          </tr>
        </thead>
        <tbody>
          {feedings.map((f) => (
            <tr key={f.feeding_id}>
              <td>{f.animal_name}</td>
              <td>{new Date(f.feeding_time).toLocaleString()}</td>
              <td>{f.feed_recorded_by}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
