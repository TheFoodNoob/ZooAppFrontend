// src/pages/employee/Events.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import Toast from "../../components/Toast";
import { fetchAuth, parseJsonWithDetail } from "../../utils/fetchAuth";

const dateRe = /^\d{4}-\d{2}-\d{2}$/;
const timeRe = /^([01]\d|2[0-3]):([0-5]\d)$/;

export default function Events() {
  const { token, user, logout } = useAuth();
  const isManager = user?.role === "admin" || user?.role === "ops_manager";

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState({ open: false, type: "success", text: "" });
  const showToast = (type, text) => setToast({ open: true, type, text });

  const [q, setQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "", date: "", start_time: "", end_time: "",
    location: "", capacity: "", price_cents: "", description: "", is_active: 1,
  });
  const [fe, setFe] = useState({});

  const Help = ({ children }) => <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>{children}</div>;
  const FieldError = ({ msg }) => (msg ? <div style={{ color: "#a40000", fontSize: 12, marginTop: 4 }}>{msg}</div> : null);

 
  function toIsoDate(d) {
    if (!d) return "";
    // If it's already YYYY-MM-DD, keep it
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;

    // Try MM/DD/YYYY or M/D/YYYY
    const mdy = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mdy) {
        const mm = String(mdy[1]).padStart(2, "0");
        const dd = String(mdy[2]).padStart(2, "0");
        return `${mdy[3]}-${mm}-${dd}`;
    }
    // As a safe default, return original; validation will catch if still bad
    return d;
    }

  function validateField(name, v) {
    const s = (v ?? "").toString().trim();
    switch (name) {
      case "name":
        if (!s) return "Name is required.";
        if (s.length > 120) return "Name must be ≤ 120 chars.";
        return "";
      case "date":
        if (!dateRe.test(s)) return "Date must be YYYY-MM-DD.";
        return "";
      case "start_time":
      case "end_time":
        if (!s) return "";
        if (!timeRe.test(s)) return "Time must be HH:MM.";
        return "";
      case "location":
        if (s && s.length > 120) return "Location must be ≤ 120 chars.";
        return "";
      case "capacity":
        if (!s) return "";
        if (!/^\d+$/.test(s)) return "Capacity must be a non-negative integer.";
        return "";
      case "price_cents":
        if (!s) return "";
        if (!/^\d+$/.test(s)) return "Price must be a non-negative integer (in cents).";
        return "";
      case "description":
        if (s && s.length > 500) return "Description must be ≤ 500 chars.";
        return "";
      default:
        return "";
    }
  }
  function validateAll(form) {
    const errors = {};
    if (!form.name?.trim()) errors.name = "Event name is required";
    if (!form.date?.trim()) errors.date = "Date is required";
    if (!form.start_time?.trim()) errors.start_time = "Start time is required"; // ✅ new
    // (optional) validate format like 09:30 if you want
    return errors;
    }


  useEffect(() => { setFe(validateAll(form)); }, [form]);

  async function load() {
    setLoading(true); setErr("");
    try {
      const res = await fetchAuth(`${api}/api/events`, { headers: { Authorization: `Bearer ${token}` } }, logout);
      const { ok, data, detail } = await parseJsonWithDetail(res);
      if (!ok) throw new Error(detail || "Failed to load events");
      setList(data || []);
    } catch (e) {
      setErr(e.message); showToast("error", e.message);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []); // initial

  const bind = (name) => ({
    value: form[name],
    onChange: (e) => {
      const v = e.target.value;
      setForm((f) => ({ ...f, [name]: v }));
      const msg = validateField(name, v);
      setFe((p) => { const n = { ...p }; if (msg) n[name] = msg; else delete n[name]; return n; });
    },
    onBlur: () => {
      const msg = validateField(name, form[name]);
      setFe((p) => { const n = { ...p }; if (msg) n[name] = msg; else delete n[name]; return n; });
    }
  });

  
 async function createEvent(e) {
    e.preventDefault();
    if (!isManager) return setErr("Only admin or ops_manager can create events.");

    const all = validateAll(form);
    setFe(all);
    if (Object.keys(all).length) {
        showToast("error", "Please fix the highlighted issues.");
        return;
    }

    try {
        const payload = {
        ...form,
        // normalize date to ISO for backend validator
        date: toIsoDate(form.date),

        // normalize optional fields
        capacity: form.capacity === "" ? null : Number(form.capacity),
        price_cents: form.price_cents === "" ? null : Number(form.price_cents),
        location: form.location || null,
        description: form.description || null,
        start_time: form.start_time || null, // "HH:MM" is fine for MySQL TIME
        end_time: form.end_time || null,
        is_active: Number(form.is_active),
        };

        const res = await fetchAuth(`${api}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
        }, logout);

        const { ok, data, detail } = await parseJsonWithDetail(res);
        if (!ok) throw new Error(detail || "Create failed");

        showToast("success", `Event created (id ${data.event_id})`);
        setForm({ name:"", date:"", start_time:"", end_time:"", location:"", capacity:"", price_cents:"", description:"", is_active:1 });
        setFe({});
        await load();
        setShowCreate(false);
    } catch (e) {
        setErr(e.message);
        showToast("error", e.message);
    }
}


  async function remove(id) {
    if (!isManager) return setErr("Only admin or ops_manager can delete events.");
    if (!confirm("Delete this event?")) return;
    try {
      const res = await fetchAuth(`${api}/api/events/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }, logout);
      const { ok, detail } = await parseJsonWithDetail(res);
      if (!ok) throw new Error(detail || "Delete failed");
      showToast("success","Event deleted"); await load();
    } catch (e) { setErr(e.message); showToast("error", e.message); }
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter(ev =>
      ev.name.toLowerCase().includes(s) ||
      String(ev.location ?? "").toLowerCase().includes(s) ||
      String(ev.date).includes(s)
    );
  }, [q, list]);

  return (
    <div className="page">
      <div className="row-between" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>Events</h2>
        {isManager && (
          <button type="button" className="btn btn-sm" onClick={() => setShowCreate(v => !v)}>
            {showCreate ? "Hide Form" : "Add Event"}
          </button>
        )}
      </div>

      {err && <div className="error" style={{ marginBottom: 10 }}>{err}</div>}

      {isManager && showCreate && (
        <form onSubmit={createEvent} className="card card--wide" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12 }}>Add Event</h3>
          <div className="two-col">
            <div>
              <label>Name</label>
              <input required maxLength={120} {...bind("name")} />
              <FieldError msg={fe.name} />
            </div>
            <div>
              <label>Date</label>
              <input type="date" required {...bind("date")} />
              <Help>YYYY-MM-DD</Help>
              <FieldError msg={fe.date} />
            </div>
            <div>
              <label>Start time (optional)</label>
              <input placeholder="09:30" {...bind("start_time")} />
              <Help>HH:MM (24h)</Help>
              <FieldError msg={fe.start_time} />
            </div>
            <div>
              <label>End time (optional)</label>
              <input placeholder="17:00" {...bind("end_time")} />
              <Help>HH:MM (24h)</Help>
              <FieldError msg={fe.end_time} />
            </div>
            <div>
              <label>Location (optional)</label>
              <input maxLength={120} {...bind("location")} />
              <FieldError msg={fe.location} />
            </div>
            <div>
              <label>Capacity (optional)</label>
              <input type="number" min="0" step="1" {...bind("capacity")} />
              <FieldError msg={fe.capacity} />
            </div>
            <div>
              <label>Price (cents, optional)</label>
              <input type="number" min="0" step="1" placeholder="1500" {...bind("price_cents")} />
              <Help>Enter cents only. Example: 1500 = $15.00</Help>
              <FieldError msg={fe.price_cents} />
            </div>
            <div className="span-2">
              <label>Description (optional)</label>
              <input maxLength={500} {...bind("description")} />
              <FieldError msg={fe.description} />
            </div>
            <div>
              <label>Active</label>
              <select value={form.is_active} onChange={(e)=>setForm(f=>({ ...f, is_active: Number(e.target.value) }))}>
                <option value={1}>1</option>
                <option value={0}>0</option>
              </select>
            </div>
          </div>

          {Object.keys(fe).length > 0 && (
            <div className="error" style={{ marginTop: 12 }}>
              <strong>Can’t create yet:</strong>
              <ul style={{ margin: "8px 0 0 18px" }}>
                {Object.values(fe).map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button className="btn" type="submit" disabled={Object.keys(fe).length > 0}>Create</button>
            <button type="button" className="btn btn-sm" onClick={()=>setShowCreate(false)}>Cancel</button>
          </div>
        </form>
      )}

      <h3 style={{ margin: "0 0 8px 0" }}>Search</h3>
      <div className="row" style={{ marginBottom: 14 }}>
        <input className="input" placeholder="Search name, location, date…" value={q} onChange={(e)=>setQ(e.target.value)} />
        <button className="btn" onClick={load}>Refresh</button>
      </div>

      <div className="panel">
        {loading ? <div>Loading…</div> : (
          <table className="table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Time</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Price</th>
                <th>Active</th>
                <th style={{ width: 240 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ev) => (
                <tr key={ev.event_id}>
                  <td>{ev.date}</td>
                  <td>{ev.name}</td>
                  <td>{[ev.start_time, ev.end_time].filter(Boolean).join(" - ")}</td>
                  <td>{ev.location || "-"}</td>
                  <td>{ev.capacity ?? "-"}</td>
                  <td>{ev.price_cents != null ? `$${(ev.price_cents/100).toFixed(2)}` : "-"}</td>
                  <td>{Number(ev.is_active) ? "1" : "0"}</td>
                  <td>
                    <Link className="btn btn-sm" to={`/events/${ev.event_id}`}>View</Link>{" "}
                    <Link className="btn btn-sm" to={`/events/${ev.event_id}/edit`}>Edit</Link>{" "}
                    <button className="btn btn-sm" onClick={()=>remove(ev.event_id)} style={{ background: "#e57373", borderColor: "#cc5555" }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {toast.open && <Toast {...toast} onClose={() => setToast({ ...toast, open: false })} />}
    </div>
  );
}
