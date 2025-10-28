import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import Toast from "../../components/Toast";
import { fetchAuth, parseJsonWithDetail } from "../../utils/fetchAuth";
import { rowsToCsv, downloadCsv } from "../../utils/csv";

const PAGE_SIZE = 10;

function fmtDate(d) {
  if (!d) return "";
  try { if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d; return new Date(d).toISOString().slice(0, 10); }
  catch { return String(d); }
}
function fmtTime(s, e) {
  const a = s || ""; const b = e || "";
  if (!a && !b) return "";
  return `${a}${a && b ? " – " : ""}${b}`;
}
function fmtPriceCents(p) {
  if (p == null || isNaN(p)) return "";
  return `$${(Number(p) / 100).toFixed(2)}`;
}

/** Simple inline confirm modal */
function ConfirmModal({ open, title, message, confirmText = "Confirm", onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.35)",
      display: "grid", placeItems: "center", zIndex: 9998
    }}>
      <div className="card" style={{ width: "min(520px,90vw)" }}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p style={{ marginTop: 8 }}>{message}</p>
        <div className="row-gap" style={{ justifyContent: "flex-end", display: "flex" }}>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

export default function Events() {
  const { token, user, logout } = useAuth();

  // toast (auto-dismiss)
  const [toast, setToast] = useState({ open: false, type: "info", text: "" });
  const showToast = (type, text) => setToast({ open: true, type, text });
  useEffect(() => {
    if (!toast.open) return;
    const t = setTimeout(() => setToast(s => ({ ...s, open: false })), 2500);
    return () => clearTimeout(t);
  }, [toast.open]);

  // data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // search & filters
  const [q, setQ] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  // sort
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("asc");

  // pagination
  const [page, setPage] = useState(1);

  // delete modal state
  const [toDelete, setToDelete] = useState(null); // the row being deleted

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetchAuth(
        `${api}/api/events`,
        { headers: { Authorization: `Bearer ${token}` } },
        logout
      );
      const { ok, data, detail } = await parseJsonWithDetail(res);
      if (!ok) throw new Error(detail || "Failed to fetch events");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message);
      showToast("error", e.message);
    } finally {
      setLoading(false);
    }
  }

  // FILTER + SORT
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const s = start || "";
    const e = end || "";

    let out = rows.filter((r) => {
      const hitQ =
        !term ||
        (r.name || "").toLowerCase().includes(term) ||
        (r.location || "").toLowerCase().includes(term) ||
        (r.description || "").toLowerCase().includes(term);

      const hitStart = !s || String(r.date) >= s;
      const hitEnd = !e || String(r.date) <= e;

      return hitQ && hitStart && hitEnd;
    });

    out.sort((a, b) => {
      let A, B;
      if (sortKey === "name") { A = (a.name || "").toLowerCase(); B = (b.name || "").toLowerCase(); }
      else if (sortKey === "active") { A = Number(a.is_active); B = Number(b.is_active); }
      else { A = a.date || ""; B = b.date || ""; }
      if (A < B) return sortDir === "asc" ? -1 : 1;
      if (A > B) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return out;
  }, [rows, q, start, end, sortKey, sortDir]);

  // PAGINATION
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const startIdx = (pageSafe - 1) * PAGE_SIZE;
    return filtered.slice(startIdx, startIdx + PAGE_SIZE);
  }, [filtered, pageSafe]);

  // CSV export (filtered rows)
  function exportCsv() {
    const csv = rowsToCsv(filtered, [
      { header: "Date",     get: r => fmtDate(r.date) },
      { header: "Name",     get: r => r.name ?? "" },
      { header: "Time",     get: r => fmtTime(r.start_time, r.end_time) },
      { header: "Location", get: r => r.location ?? "" },
      { header: "Capacity", get: r => r.capacity ?? "" },
      { header: "Price",    get: r => fmtPriceCents(r.price_cents) },
      { header: "Active",   get: r => Number(r.is_active) ? "1" : "0" },
      { header: "Description", get: r => r.description ?? "" },
      { header: "ID",       get: r => r.event_id },
    ]);
    downloadCsv("events.csv", csv);
  }

  function onSort(k) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  }

  // ----- Toggle Active (quick on/off) -----
  async function toggleActive(row) {
    const updated = { ...row, is_active: Number(row.is_active) ? 0 : 1 };

    // Build full payload to satisfy "non-null" backend
    const payload = {
      date: row.date,
      name: row.name,
      start_time: row.start_time || null,
      end_time: row.end_time || null,
      location: row.location || null,
      capacity: row.capacity ?? null,
      price_cents: row.price_cents ?? null,
      description: row.description || "",
      is_active: updated.is_active
    };

    try {
      const res = await fetchAuth(`${api}/api/events/${row.event_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      }, logout);
      const info = await parseJsonWithDetail(res);
      if (!info.ok) throw new Error(info.detail || "Failed to update");

      // update UI
      setRows(prev => prev.map(r => r.event_id === row.event_id ? { ...r, is_active: updated.is_active } : r));
      showToast("success", `Event ${updated.is_active ? "activated" : "deactivated"}`);
    } catch (e) {
      showToast("error", e.message);
    }
  }

  // ----- Delete Event -----
  async function confirmDelete() {
    if (!toDelete) return;
    const id = toDelete.event_id;
    try {
      const res = await fetchAuth(`${api}/api/events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      }, logout);
      const info = await parseJsonWithDetail(res);
      if (!info.ok) throw new Error(info.detail || "Delete failed");

      setRows(prev => prev.filter(r => r.event_id !== id));
      setToDelete(null);
      showToast("success", "Event deleted");
    } catch (e) {
      showToast("error", e.message);
    }
  }

  return (
    <div className="container container-wide">
      <div className="header-row">
        <h1>Events</h1>
        <div className="row-gap">
          <button className="btn" onClick={exportCsv}>Export CSV</button>
          {(user?.role === "admin" || user?.role === "ops_manager") && (
            <Link className="btn" to="/events/new">+ New Event</Link>
          )}
        </div>
      </div>

      <div className="page-grid">
        {/* Filters */}
        <aside className="card sticky">
          <div className="grid grid-1">
            <div className="field">
              <label>Search</label>
              <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="name, location, description…" />
            </div>
            <div className="field">
              <label>Start date</label>
              <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="field">
              <label>End date</label>
              <input className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className="field">
              <button className="btn block" onClick={() => { setQ(""); setStart(""); setEnd(""); }}>Clear</button>
            </div>
          </div>
        </aside>

        {/* Table */}
        <section className="card">
          {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}
          {loading ? (
            <div>Loading…</div>
          ) : (
            <>
              <div className="table-wrap">
                <table className="table wide">
                  <thead>
                    <tr>
                        <th className="sortable nowrap" onClick={() => onSort("date")}>Date {sortKey === "date" ? (sortDir === "asc" ? "▲" : "▼") : ""}</th>
                        <th className="sortable">Name {sortKey === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}</th>
                        <th className="nowrap">Time</th>
                        <th>Location</th>
                        <th className="nowrap">Capacity</th>
                        <th className="nowrap">Price</th>
                        <th className="sortable nowrap" onClick={() => onSort("active")}>Active {sortKey === "active" ? (sortDir === "asc" ? "▲" : "▼") : ""}</th>
                        <th className="nowrap">ID</th>
                        <th className="nowrap" />
                    </tr>
                    </thead>
                    <tbody>
                    {paged.map((r) => (
                        <tr key={r.event_id}>
                        <td className="nowrap">{fmtDate(r.date)}</td>
                        <td>{r.name}</td>
                        <td className="nowrap">{fmtTime(r.start_time, r.end_time)}</td>
                        <td>{r.location}</td>
                        <td className="nowrap">{r.capacity}</td>
                        <td className="nowrap">{fmtPriceCents(r.price_cents)}</td>
                        <td className="nowrap">
                            <button className="btn btn-sm" onClick={() => toggleActive(r)} title="Toggle active">
                            {Number(r.is_active) ? "On" : "Off"}
                            </button>
                        </td>
                        <td className="nowrap"><code>{r.event_id}</code></td>
                        <td className="nowrap" style={{ whiteSpace: "nowrap" }}>
                            <Link className="btn btn-sm" to={`/events/${r.event_id}`}>View</Link>
                            <Link className="btn btn-sm" to={`/events/${r.event_id}/edit`}>Edit</Link>
                            <button className="btn btn-sm" onClick={() => setToDelete(r)}>Delete</button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
              </div>

              <div className="row-between pager">
                <div>Page {pageSafe} of {totalPages}</div>
                <div className="row-gap">
                  <button className="btn" onClick={() => setPage(1)} disabled={pageSafe <= 1}>« First</button>
                  <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe <= 1}>‹ Prev</button>
                  <button className="btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageSafe >= totalPages}>Next ›</button>
                  <button className="btn" onClick={() => setPage(totalPages)} disabled={pageSafe >= totalPages}>Last »</button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <ConfirmModal
        open={!!toDelete}
        title="Delete event?"
        message={toDelete ? `This will permanently delete “${toDelete.name}” (ID ${toDelete.event_id}).` : ""}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />

      {toast.open && (
        <Toast
          {...toast}
          onClose={() => setToast({ ...toast, open: false })}
        />
      )}
    </div>
  );
}
