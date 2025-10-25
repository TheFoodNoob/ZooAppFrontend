import React, { useEffect, useState } from "react";
import {api} from "../../api";

export default function Animals() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ species_id:"", exhibit_id:"", animal_name:"", sex:"M" });
  const [msg, setMsg] = useState("");

  useEffect(() => { load(); }, []);
  const load = async () => {
    const r = await api.get("/animals");
    setList(r.data);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/animals", {...form, species_id: +form.species_id, exhibit_id: +form.exhibit_id});
      setMsg("Animal saved");
      await load();
    } catch (err) {
      setMsg(err.response?.data?.error || "Save failed");
    }
  };

  return (
    <div className="page">
      <h2>Animals</h2>
      {msg && <p>{msg}</p>}
      <form onSubmit={submit} className="card">
        <input placeholder="Species ID" value={form.species_id} onChange={e=>setForm({...form, species_id:e.target.value})}/>
        <input placeholder="Exhibit ID" value={form.exhibit_id} onChange={e=>setForm({...form, exhibit_id:e.target.value})}/>
        <input placeholder="Animal name" value={form.animal_name} onChange={e=>setForm({...form, animal_name:e.target.value})}/>
        <select value={form.sex} onChange={e=>setForm({...form, sex:e.target.value})}><option>M</option><option>F</option></select>
        <button>Add Animal</button>
      </form>

      <table className="table">
        <thead><tr><th>Name</th><th>Species</th><th>Exhibit</th><th>Status</th></tr></thead>
        <tbody>
        {list.map(a=>(
          <tr key={a.animal_id}>
            <td>{a.animal_name}</td><td>{a.species}</td><td>{a.exhibit}</td><td>{a.animal_status}</td>
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  );
}
