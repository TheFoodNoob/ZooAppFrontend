import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import { fetchAuth, parseJsonWithDetail } from "../../utils/fetchAuth";
import Toast from "../../components/Toast";

function fmtDateTime(val) {
  if (!val) return "";
  try {
    const dt = new Date(val);
    const iso = dt.toISOString();
    return iso.slice(0, 16); // YYYY-MM-DDTHH:MM for datetime-local input
  } catch { return ""; }
}

export default function FeedingsEdit() {
  const { id } = useParams();
  const isNew = !id;
  const nav = useNavigate();
  const { logout, token } = useAuth();

  const [form, setForm] = useState({
    animal_id: "",
    food_id: "",
    feeding_time: "",
    feed_amount_kg: "",
  });
  const [fe, setFe] = useState({});
  const [saving, setSaving] = useState(false);
  const [animals, setAnimals] = useState([]);
  const [foods, setFoods] = useState([]);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState({ open: false, type: "info", text: "" });

  const showToast = (type, text) => setToast({ open: true, type, text });
  useEffect(() => { if (!toast.open) return; const t = setTimeout(() => setToast(s => ({ ...s, open: false })), 2500); return () => clearTimeout(t); }, [toast.open]);

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }

  // load animals and foods for selects
  useEffect(() => {
    fetchAuth(`${api}/api/animals`, { headers: { Authorization: `Bearer ${token}` } }, logout)
      .then(res => res.json()).then(setAnimals).catch(err => showToast("error", "Failed to load animals"));
    fetchAuth(`${api}/api/food`, { headers: { Authorization: `Bearer ${token}` } }, logout)
      .then(res => res.json()).then(setFoods).catch(err => showToast("error", "Failed to load foods"));
  }, [token, logout]);

  // load existing feeding
  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        const res = await fetchAuth(`${api}/api/feedings/${id}`, { headers: { Authorization: `Bearer ${token}` } }, logout);
        const { ok, data, detail } = await parseJsonWithDetail(res);
        if (!ok) throw new Error(detail || "Failed to load feeding");
        setForm({
          animal_id: data.animal_id,
          food_id: data.food_id,
          feeding_time: fmtDateTime(data.feeding_time),
          feed_amount_kg: data.feed_amount_kg ?? "",
        });
      } catch (e) {
        setErr(e.message);
        showToast("error", e.message);
      }
    })();
  }, [id, isNew, token, logout]);

  const checks = useMemo(() => ({
    animal_id: v => !v ? "Animal is required" : "",
    food_id: v => !v ? "Food is required" : "",
    feeding_time: v => !v ? "Feeding time is required" : "",
    feed_amount_kg: v => v === "" ? "Amount is required" : isNaN(Number(v)) ? "Must be a number" : "",
  }), []);

  function validate(show = true) {
    const errs = {};
    for (const [k, fn] of Object.entries(checks)) {
      const msg = fn(form[k]);
      if (msg) errs[k] = msg;
    }
    if (show) setFe(errs);
    return Object.keys(errs).length === 0;
  }
  const isFormValid = validate(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate(true)) return;
    const payload = {
      animal_id: +form.animal_id,
      food_id: +form.food_id,
      feeding_time: form.feeding_time,
      feed_amount_kg: parseFloat(form.feed_amount_kg),
    };

    setSaving(true);
    setErr("");
    try {
      if (isNew) {
        const res = await fetchAuth(`${api}/api/feedings`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        }, logout);
        const info = await parseJsonWithDetail(res);
        if (!info.ok) throw new Error(info.detail || "Create failed");
        showToast("success", "Feeding created");
        nav(`/feedings/${info.data?.feeding_id ?? ""}`, { replace: true });
      } else {
        const res = await fetchAuth(`${api}/api/feedings/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        }, logout);
        const info = await parseJsonWithDetail(res);
        if (!info.ok) throw new Error(info.detail || "Update failed");
        showToast("success", "Feeding updated");
        setTimeout(() => nav(`/feedings/${id}`), 300);
      }
    } catch (e2) {
      setErr(e2.message);
      showToast("error", e2.message);
    } finally { setSaving(false); }
  }

  return (
    <div className="container container-wide">
      <div className="header-row">
        <h1>{isNew ? "New Feeding" : "Edit Feeding"}</h1>
        <div className="row-gap">
          <button className="btn" onClick={() => nav(-1)}>Back</button>
          {!isNew && <button className="btn" onClick={() => nav(`/feedings/${id}`)}>View</button>}
        </div>
      </div>

      <form className="card card--wide" onSubmit={onSubmit} noValidate>
        {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}

        <div className="two-col">
          <div className="field">
            <label>Animal</label>
            <select className="input" value={form.animal_id} onChange={e => setField("animal_id", e.target.value)} onBlur={() => validate()}>
              <option value="">Select Animal</option>
              {animals.map(a => <option key={a.animal_id} value={a.animal_id}>{a.animal_name}</option>)}
            </select>
            {fe.animal_id && <div className="help error">{fe.animal_id}</div>}
          </div>

          <div className="field">
            <label>Food</label>
            <select className="input" value={form.food_id} onChange={e => setField("food_id", e.target.value)} onBlur={() => validate()}>
              <option value="">Select Food</option>
              {foods.map(f => <option key={f.food_id} value={f.food_id}>{f.food_name}</option>)}
            </select>
            {fe.food_id && <div className="help error">{fe.food_id}</div>}
          </div>

          <div className="field">
            <label>Feeding Time</label>
            <input className="input" type="datetime-local" value={form.feeding_time} onChange={e => setField("feeding_time", e.target.value)} onBlur={() => validate()} />
            {fe.feeding_time && <div className="help error">{fe.feeding_time}</div>}
          </div>

          <div className="field">
            <label>Amount (kg)</label>
            <input className="input" type="number" step="0.001" value={form.feed_amount_kg} onChange={e => setField("feed_amount_kg", e.target.value)} onBlur={() => validate()} />
            {fe.feed_amount_kg && <div className="help error">{fe.feed_amount_kg}</div>}
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
