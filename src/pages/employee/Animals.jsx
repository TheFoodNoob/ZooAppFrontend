import React, { useEffect, useState } from "react";
import { api } from "../../api"; // Keeps using your base URL (e.g., http://localhost:4000)

export default function Animals() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    species_id: "",
    exhibit_id: "",
    animal_name: "",
    sex: "M",
  });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await fetch(`${api}/animals`);
      if (!res.ok) throw new Error("Failed to load animals");
      const data = await res.json();
      setList(data);
    } catch (err) {
      setMsg(err.message || "Error loading animals");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${api}/animals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          species_id: +form.species_id,
          exhibit_id: +form.exhibit_id,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Save failed");
      }

      setMsg("Animal saved");
      setForm({ species_id: "", exhibit_id: "", animal_name: "", sex: "M" });
      await load();
    } catch (err) {
      setMsg(err.message || "Save failed");
    }
  };

  return (
    <div className="page">
      <h2>Animals</h2>
      {msg && <p>{msg}</p>}
      <form onSubmit={submit} className="card">
        <input
          placeholder="Species ID"
          value={form.species_id}
          onChange={(e) => setForm({ ...form, species_id: e.target.value })}
        />
        <input
          placeholder="Exhibit ID"
          value={form.exhibit_id}
          onChange={(e) => setForm({ ...form, exhibit_id: e.target.value })}
        />
        <input
          placeholder="Animal name"
          value={form.animal_name}
          onChange={(e) => setForm({ ...form, animal_name: e.target.value })}
        />
        <select
          value={form.sex}
          onChange={(e) => setForm({ ...form, sex: e.target.value })}
        >
          <option>M</option>
          <option>F</option>
        </select>
        <button>Add Animal</button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Species</th>
            <th>Exhibit</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {list.map((a) => (
            <tr key={a.animal_id}>
              <td>{a.animal_name}</td>
              <td>{a.species}</td>
              <td>{a.exhibit}</td>
              <td>{a.animal_status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
