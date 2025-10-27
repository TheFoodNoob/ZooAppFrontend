import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import fetchAuth, { parseJsonWithDetail } from "../../utils/fetchAuth";
import Toast from "../../components/Toast";

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function EventEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const { token, user, logout } = useAuth();
  const isManager = user?.role === "admin" || user?.role === "ops_manager";

  const [form, setForm] = useState(null);
  const [errs, setErrs] = useState([]);
  const [toast, setToast] = useState({ open: false, type: "info", text: "" });
  const showToast = (type, text) => setToast({ open: true, type, text });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAuth(
          `${api}/api/events/${id}`,
          { headers: { Authorization: `Bearer ${token}` } },
          logout
        );
        const { ok, data, detail } = await parseJsonWithDetail(res);
        if (!ok) throw new Error(detail || "Failed to load event");
        setForm({
          name: data.name || "",
          date: data.date || "",
          start_time: data.start_time || "",
          end_time: data.end_time || "",
          location: data.location || "",
          capacity: data.capacity ?? "",
          price_cents: data.price_cents ?? "",
          description: data.description || "",
          is_active: Number(data.is_active ?? 1),
        });
      } catch (e) {
        setErrs([e.message]);
        showToast("error", e.message);
      }
    })();
  }, [id, token, logout]);

  function collectErrors(f) {
    const out = [];
    if (!f.name.trim()) out.push("Name is required.");
    if (!f.date) out.push("Date is required (YYYY-MM-DD).");
    if (f.start_time && !timeRe.test(f.start_time)) out.push("Start time must be HH:MM (24h).");
    if (f.end_time && !timeRe.test(f.end_time)) out.push("End time must be HH:MM (24h).");
    if (f.capacity !== "" && (!/^\d+$/.test(String(f.capacity)) || Number(f.capacity) < 0))
      out.push("Capacity must be a non-negative integer.");
    if (f.price_cents !== "" && (!/^\d+$/.test(String(f.price_cents)) || Number(f.price_cents) < 0))
      out.push("Price (cents) must be a non-negative integer.");
    return out;
  }

  useEffect(() => { if (form) setErrs(collectErrors(form)); }, [form]);

  async function save(e) {
    e.preventDefault();
    if (!isManager) { showToast("error", "Only admin or ops_manager can update events."); return; }
    const problems = collectErrors(form);
    if (problems.length) { setErrs(problems); showToast("error", "Please fix the highlighted issues."); return; }

    try {
      const payload = {
        name: form.name.trim(),
        date: form.date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        location: form.location || null,
        capacity: form.capacity === "" ? null : Number(form.capacity),
        price_cents: form.price_cents === "" ? null : Number(form.price_cents),
        description: form.description || null,
        is_active: Number(form.is_active),
      };

      const res = await fetchAuth(
        `${api}/api/events/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
        logout
      );

      const { ok, detail } = await parseJsonWithDetail(res);
      if (!ok) throw new Error(detail || "Update failed");

      showToast("success", "Event updated");
      nav(`/events/${id}`);
    } catch (e) {
      showToast("error", e.message);
    }
  }

  if (!form) return <div className="page">Loading…</div>;

  return (
    <div className="page">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Edit Event</h2>
        <Link className="btn btn-sm" to={`/events/${id}`}>Cancel</Link>
      </div>

      <form onSubmit={save} className="card card--wide">
        <div className="two-col">
          <div>
            <label>Name</label>
            <input value={form.name} onChange={e=>setForm({ ...form, name: e.target.value })} />
            <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
              Example: Summer Night Safari
            </div>
          </div>
          <div>
            <label>Date</label>
            <input type="date" value={form.date} onChange={e=>setForm({ ...form, date: e.target.value })}/>
            <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>YYYY-MM-DD</div>
          </div>

          <div>
            <label>Start time (optional)</label>
            <input placeholder="HH:MM" value={form.start_time} onChange={e=>setForm({ ...form, start_time: e.target.value })}/>
            <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>24h, e.g., 18:30</div>
          </div>
          <div>
            <label>End time (optional)</label>
            <input placeholder="HH:MM" value={form.end_time} onChange={e=>setForm({ ...form, end_time: e.target.value })}/>
            <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>24h, e.g., 21:00</div>
          </div>

          <div>
            <label>Location (optional)</label>
            <input value={form.location} onChange={e=>setForm({ ...form, location: e.target.value })}/>
          </div>
          <div>
            <label>Capacity (optional)</label>
            <input type="number" min="0" step="1" value={form.capacity} onChange={e=>setForm({ ...form, capacity: e.target.value })}/>
          </div>

          <div>
            <label>Price (cents, optional)</label>
            <input type="number" min="0" step="1" value={form.price_cents} onChange={e=>setForm({ ...form, price_cents: e.target.value })}/>
            <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
              2500 = $25.00
            </div>
          </div>
          <div>
            <label>Active</label>
            <select value={form.is_active} onChange={e=>setForm({ ...form, is_active: Number(e.target.value) })}>
              <option value={1}>1</option>
              <option value={0}>0</option>
            </select>
          </div>

          <div className="span-2">
            <label>Description (optional)</label>
            <input value={form.description} onChange={e=>setForm({ ...form, description: e.target.value })}/>
          </div>
        </div>

        {errs.length > 0 && (
          <div className="error" style={{ marginTop: 12 }}>
            <strong>Can’t save yet:</strong>
            <ul style={{ margin: "8px 0 0 18px" }}>
              {errs.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
        )}

        <button className="btn" type="submit" style={{ marginTop: 14 }} disabled={errs.length>0}>
          Save
        </button>
      </form>

      {toast.open && (
        <Toast {...toast} onClose={() => setToast({ ...toast, open: false })} />
      )}
    </div>
  );
}
