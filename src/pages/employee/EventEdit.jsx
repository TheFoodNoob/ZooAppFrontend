import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import { fetchAuth, parseJsonWithDetail } from "../../utils/fetchAuth";
import Toast from "../../components/Toast";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:MM 24h
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function fmtDateIn(val) {
  if (!val) return "";
  if (DATE_RE.test(val)) return val;
  try { return new Date(val).toISOString().slice(0, 10); } catch { return ""; }
}
function toInt(v) { const n = Number(v); return Number.isFinite(n) ? n : NaN; }
function compareTimes(a, b) { const [ah, am] = a.split(":").map(Number); const [bh, bm] = b.split(":").map(Number); return (bh-ah)*60 + (bm-am); }

export default function EventEdit() {
  const { id } = useParams();
  const isNew = !id;
  const nav = useNavigate();
  const { logout, token } = useAuth();

  const [form, setForm] = useState({
    date: "",
    name: "",
    start_time: "09:30",
    end_time: "15:00",
    location: "",
    capacity: "",
    price_cents: "2500",
    description: "",
    is_active: 1,
  });
  const [fe, setFe] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState({ open: false, type: "info", text: "" });
  const showToast = (type, text) => setToast({ open: true, type, text });
  useEffect(() => { if (!toast.open) return; const t=setTimeout(()=>setToast(s=>({...s,open:false})),2500); return ()=>clearTimeout(t); }, [toast.open]);

  // load in edit mode
  useEffect(() => {
    if (isNew) return;
    (async () => {
      setErr("");
      try {
        const res = await fetchAuth(`${api}/api/events/${id}`, { headers: { Authorization: `Bearer ${token}` } }, logout);
        const { ok, data, detail } = await parseJsonWithDetail(res);
        if (!ok) throw new Error(detail || "Failed to load event");
        setForm({
          date: fmtDateIn(data.date),
          name: data.name || "",
          start_time: data.start_time || "",
          end_time: data.end_time || "",
          location: data.location || "",
          capacity: data.capacity ?? "",
          price_cents: data.price_cents ?? "",
          description: data.description || "",
          is_active: Number(data.is_active) ?? 1,
        });
        setFe({});
      } catch (e) { setErr(e.message); showToast("error", e.message); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }

  const checks = useMemo(() => ({
    date: v => !v ? "Date is required" : DATE_RE.test(v) ? "" : "Use YYYY-MM-DD",
    name: v => !v ? "Name is required" : v.trim().length < 2 ? "Name is too short" : "",
    start_time: v => !v ? "Start time is required" : TIME_RE.test(v) ? "" : "HH:MM (24h)",
    end_time: v => !v ? "End time is required" : TIME_RE.test(v) ? "" : "HH:MM (24h)",
    location: v => !v ? "Location is required" : "",
    capacity: v => {
      if (v === "" || v === null) return "Capacity is required";
      const n = toInt(v); if (!Number.isFinite(n)) return "Capacity must be an integer";
      if (n <= 0) return "Capacity must be > 0"; return "";
    },
    price_cents: v => {
      if (v === "" || v === null) return "Price (cents) is required";
      const n = toInt(v); if (!Number.isFinite(n)) return "Price must be an integer (cents)";
      if (n < 0) return "Price can't be negative"; return "";
    },
    is_active: v => (v === "" || v === null ? "Active is required" : ""),
  }), []);

  // end time must be after start time
  let timeOrderError = "";
  if (TIME_RE.test(form.start_time) && TIME_RE.test(form.end_time)) {
    if (compareTimes(form.end_time, form.start_time) <= 0) {
      // ok
    } else {
      timeOrderError = "End time must be after start time";
    }
  }

  function validate(show = true) {
    const errs = {};
    for (const [k, fn] of Object.entries(checks)) {
      const msg = fn(form[k]);
      if (msg) errs[k] = msg;
    }
    if (!errs.start_time && !errs.end_time && timeOrderError) errs.end_time = timeOrderError;
    if (show) setFe(errs);
    return Object.keys(errs).length === 0;
  }
  const isFormValid = validate(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate(true)) return;

    const payload = {
      date: form.date,
      name: form.name.trim(),
      start_time: form.start_time,
      end_time: form.end_time,
      location: form.location.trim(),
      capacity: toInt(form.capacity),
      price_cents: toInt(form.price_cents),
      description: form.description || "",
      is_active: Number(form.is_active) === 1 ? 1 : 0,
    };

    setSaving(true); setErr("");
    try {
      if (isNew) {
        const res = await fetchAuth(`${api}/api/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        }, logout);
        const info = await parseJsonWithDetail(res);
        if (!info.ok) throw new Error(info.detail || "Create failed");
        const newId = info.data?.event_id ?? info.data?.id;
        showToast("success", "Event created");
        nav(newId ? `/events/${newId}` : "/events", { replace: true });
      } else {
        const res = await fetchAuth(`${api}/api/events/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        }, logout);
        const info = await parseJsonWithDetail(res);
        if (!info.ok) throw new Error(info.detail || "Update failed");
        showToast("success", "Event updated");
        setTimeout(() => nav(`/events/${id}`), 300);
      }
    } catch (e2) {
      setErr(e2.message); showToast("error", e2.message);
    } finally { setSaving(false); }
  }

  return (
    <div className="container container-wide">
      <div className="header-row">
        <h1>{isNew ? "New Event" : "Edit Event"}</h1>
        <div className="row-gap">
          <button className="btn" onClick={() => nav(-1)}>Back</button>
          {!isNew && <button className="btn" onClick={() => nav(`/events/${id}`)}>View</button>}
        </div>
      </div>

      <form className="card card--wide" onSubmit={onSubmit} noValidate>
        {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}

        <div className="two-col">
          <div className="field">
            <label>Date</label>
            <input className="input" type="date" required
              value={form.date} onChange={(e)=>setField("date", e.target.value)} onBlur={()=>validate()} />
            {fe.date && <div className="help error">{fe.date}</div>}
          </div>

          <div className="field">
            <label>Name</label>
            <input className="input" required placeholder="Event name"
              value={form.name} onChange={(e)=>setField("name", e.target.value)} onBlur={()=>validate()} />
            {fe.name && <div className="help error">{fe.name}</div>}
          </div>

          <div className="field">
            <label>Start time</label>
            <input className="input" type="time" step="60" required
              value={form.start_time} onChange={(e)=>setField("start_time", e.target.value)} onBlur={()=>validate()} />
            {fe.start_time && <div className="help error">{fe.start_time}</div>}
          </div>

          <div className="field">
            <label>End time</label>
            <input className="input" type="time" step="60" required
              value={form.end_time} onChange={(e)=>setField("end_time", e.target.value)} onBlur={()=>validate()} />
            {fe.end_time && <div className="help error">{fe.end_time}</div>}
          </div>

          <div className="field">
            <label>Location</label>
            <input className="input" required placeholder="Location"
              value={form.location} onChange={(e)=>setField("location", e.target.value)} onBlur={()=>validate()} />
            {fe.location && <div className="help error">{fe.location}</div>}
          </div>

          <div className="field">
            <label>Capacity</label>
            <input className="input" required placeholder="e.g., 50"
              value={form.capacity} onChange={(e)=>setField("capacity", e.target.value)} onBlur={()=>validate()} />
            {fe.capacity && <div className="help error">{fe.capacity}</div>}
          </div>

          <div className="field">
            <label>Price (cents)</label>
            <input className="input" required placeholder="2500"
              value={form.price_cents} onChange={(e)=>setField("price_cents", e.target.value)} onBlur={()=>validate()} />
            <div className="help">2500 = $25.00</div>
            {fe.price_cents && <div className="help error">{fe.price_cents}</div>}
          </div>

          <div className="field">
            <label>Active</label>
            <select className="input" required
              value={form.is_active} onChange={(e)=>setField("is_active", e.target.value)} onBlur={()=>validate()}>
              <option value={1}>1</option>
              <option value={0}>0</option>
            </select>
            {fe.is_active && <div className="help error">{fe.is_active}</div>}
          </div>

          <div className="field span-2">
            <label>Description (optional)</label>
            <input className="input" placeholder="Short description"
              value={form.description} onChange={(e)=>setField("description", e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <button className="btn" type="submit" disabled={saving || !isFormValid}>
            {saving ? (isNew ? "Creating…" : "Saving…") : (isNew ? "Create" : "Save")}
          </button>
        </div>
      </form>

      {toast.open && (<Toast {...toast} onClose={() => setToast({ ...toast, open: false })} />)}
    </div>
  );
}
