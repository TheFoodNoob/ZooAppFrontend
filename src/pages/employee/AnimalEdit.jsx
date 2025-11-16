// src/pages/employee/AnimalEdit.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import { fetchAuth, parseJsonWithDetail } from "../../utils/fetchAuth";
import Toast from "../../components/Toast";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function fmtDateIn(val) {
  if (!val) return "";
  if (DATE_RE.test(val)) return val;
  try {
    return new Date(val).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function toFloat(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export default function AnimalEdit() {
  const { id } = useParams();
  const isNew = !id;
  const nav = useNavigate();
  const { logout, token } = useAuth();

  const [form, setForm] = useState({
    species_id: "",
    exhibit_id: "",
    animal_name: "",
    sex: "M",
    birth_date: "",
    entry_date: "",
    animal_status: "Active",
    weight_kg: "",
    origin_type: "Other",
    origin_location: "",
  });

  const [fe, setFe] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState({ open: false, type: "info", text: "" });
  const showToast = (type, text) => setToast({ open: true, type, text });

  useEffect(() => {
    if (!toast.open) return;
    const t = setTimeout(
      () => setToast((s) => ({ ...s, open: false })),
      2500
    );
    return () => clearTimeout(t);
  }, [toast.open]);

  // Load animal in edit mode
  useEffect(() => {
    if (isNew) return;
    (async () => {
      setErr("");
      try {
        const res = await fetchAuth(
          `${api}/api/animals/${id}`,
          { headers: { Authorization: `Bearer ${token}` } },
          logout
        );
        const { ok, data, detail } = await parseJsonWithDetail(res);
        if (!ok) throw new Error(detail || "Failed to load animal");
        setForm({
          species_id: data.species_id ?? "",
          exhibit_id: data.exhibit_id ?? "",
          animal_name: data.animal_name || "",
          sex: data.sex || "M",
          birth_date: fmtDateIn(data.birth_date),
          entry_date: fmtDateIn(data.entry_date),
          animal_status: data.animal_status || "Active",
          weight_kg: data.weight_kg ?? "",
          origin_type: data.origin_type || "Other",
          origin_location: data.origin_location || "",
        });
        setFe({});
      } catch (e) {
        setErr(e.message);
        showToast("error", e.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const checks = useMemo(
    () => ({
      species_id: (v) => (!v ? "Species ID required" : ""),
      exhibit_id: (v) => (!v ? "Exhibit ID required" : ""),
      animal_name: (v) =>
        !v ? "Animal name required" : v.trim().length < 2 ? "Too short" : "",
      sex: (v) => (v !== "M" && v !== "F" ? "Must be M or F" : ""),
      birth_date: (v) =>
        v && !DATE_RE.test(v) ? "Use YYYY-MM-DD" : "",
      entry_date: (v) =>
        !v ? "Entry date required" : DATE_RE.test(v) ? "" : "Use YYYY-MM-DD",
      animal_status: (v) => (!v ? "Status required" : ""),
      weight_kg: (v) =>
        v && isNaN(toFloat(v)) ? "Must be a number" : "",
      origin_type: (v) =>
        ![
          "Captive-Born",
          "Rescued",
          "Transferred",
          "Wild-Caught",
          "Other",
        ].includes(v)
          ? "Invalid type"
          : "",
    }),
    []
  );

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
      species_id: toInt(form.species_id),
      exhibit_id: toInt(form.exhibit_id),
      animal_name: form.animal_name.trim(),
      sex: form.sex,
      birth_date: form.birth_date || null,
      entry_date: form.entry_date,
      animal_status: form.animal_status,
      weight_kg: form.weight_kg ? toFloat(form.weight_kg) : null,
      origin_type: form.origin_type,
      origin_location: form.origin_location || null,
    };

    setSaving(true);
    setErr("");
    try {
      if (isNew) {
        const res = await fetchAuth(
          `${api}/api/animals`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          },
          logout
        );
        const info = await parseJsonWithDetail(res);
        if (!info.ok) throw new Error(info.detail || "Create failed");
        showToast("success", "Animal created");
        nav(`/staff/animals/${info.data?.animal_id ?? info.data?.id}`, {
          replace: true,
        });
      } else {
        const res = await fetchAuth(
          `${api}/api/animals/${id}`,
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
        const info = await parseJsonWithDetail(res);
        if (!info.ok) throw new Error(info.detail || "Update failed");
        showToast("success", "Animal updated");
        setTimeout(() => nav(`/staff/animals/${id}`), 300);
      }
    } catch (e2) {
      setErr(e2.message);
      showToast("error", e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container container-wide">
      <div className="header-row">
        <h1>{isNew ? "New Animal" : "Edit Animal"}</h1>
        <div className="row-gap">
          <button className="btn" onClick={() => nav(-1)}>
            Back
          </button>
          {!isNew && (
            <button
              className="btn"
              onClick={() => nav(`/staff/animals/${id}`)}
            >
              View
            </button>
          )}
        </div>
      </div>

      <form className="card card--wide" onSubmit={onSubmit} noValidate>
        {err && (
          <div className="error" style={{ marginBottom: 12 }}>
            {err}
          </div>
        )}

        <div className="two-col">
          <div className="field">
            <label>Species ID</label>
            <input
              className="input"
              required
              type="number"
              value={form.species_id}
              onChange={(e) => setField("species_id", e.target.value)}
              onBlur={() => validate()}
            />
            {fe.species_id && (
              <div className="help error">{fe.species_id}</div>
            )}
          </div>

          <div className="field">
            <label>Exhibit ID</label>
            <input
              className="input"
              required
              type="number"
              value={form.exhibit_id}
              onChange={(e) => setField("exhibit_id", e.target.value)}
              onBlur={() => validate()}
            />
            {fe.exhibit_id && (
              <div className="help error">{fe.exhibit_id}</div>
            )}
          </div>

          <div className="field">
            <label>Animal Name</label>
            <input
              className="input"
              required
              value={form.animal_name}
              onChange={(e) => setField("animal_name", e.target.value)}
              onBlur={() => validate()}
            />
            {fe.animal_name && (
              <div className="help error">{fe.animal_name}</div>
            )}
          </div>

          <div className="field">
            <label>Sex</label>
            <select
              className="input"
              value={form.sex}
              onChange={(e) => setField("sex", e.target.value)}
              onBlur={() => validate()}
            >
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
            {fe.sex && <div className="help error">{fe.sex}</div>}
          </div>

          <div className="field">
            <label>Birth Date</label>
            <input
              className="input"
              type="date"
              value={form.birth_date}
              onChange={(e) => setField("birth_date", e.target.value)}
              onBlur={() => validate()}
            />
            {fe.birth_date && (
              <div className="help error">{fe.birth_date}</div>
            )}
          </div>

          <div className="field">
            <label>Entry Date</label>
            <input
              className="input"
              type="date"
              required
              value={form.entry_date}
              onChange={(e) => setField("entry_date", e.target.value)}
              onBlur={() => validate()}
            />
            {fe.entry_date && (
              <div className="help error">{fe.entry_date}</div>
            )}
          </div>

          <div className="field">
            <label>Status</label>
            <select
              className="input"
              value={form.animal_status}
              onChange={(e) => setField("animal_status", e.target.value)}
              onBlur={() => validate()}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            {fe.animal_status && (
              <div className="help error">{fe.animal_status}</div>
            )}
          </div>

          <div className="field">
            <label>Weight (kg)</label>
            <input
              className="input"
              type="number"
              step="0.001"
              value={form.weight_kg}
              onChange={(e) => setField("weight_kg", e.target.value)}
              onBlur={() => validate()}
            />
            {fe.weight_kg && (
              <div className="help error">{fe.weight_kg}</div>
            )}
          </div>

          <div className="field">
            <label>Origin Type</label>
            <select
              className="input"
              value={form.origin_type}
              onChange={(e) => setField("origin_type", e.target.value)}
              onBlur={() => validate()}
            >
              <option value="Captive-Born">Captive-Born</option>
              <option value="Rescued">Rescued</option>
              <option value="Transferred">Transferred</option>
              <option value="Wild-Caught">Wild-Caught</option>
              <option value="Other">Other</option>
            </select>
            {fe.origin_type && (
              <div className="help error">{fe.origin_type}</div>
            )}
          </div>

          <div className="field span-2">
            <label>Origin Location (optional)</label>
            <input
              className="input"
              value={form.origin_location}
              onChange={(e) =>
                setField("origin_location", e.target.value)
              }
            />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <button
            className="btn"
            type="submit"
            disabled={saving || !isFormValid}
          >
            {saving
              ? isNew
                ? "Creating…"
                : "Saving…"
              : isNew
              ? "Create"
              : "Save"}
          </button>
        </div>
      </form>

      {toast.open && (
        <Toast
          {...toast}
          onClose={() => setToast({ ...toast, open: false })}
        />
      )}
    </div>
  );
}
