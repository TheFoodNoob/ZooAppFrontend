// src/pages/employee/Animals.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import Toast from "../../components/Toast";
import { fetchAuth, parseJsonWithDetail } from "../../utils/fetchAuth";
import { rowsToCsv, downloadCsv } from "../../utils/csv";

const PAGE_SIZE = 10;

function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirm",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.35)",
        display: "grid",
        placeItems: "center",
        zIndex: 9998,
      }}
    >
      <div className="card" style={{ width: "min(520px,90vw)" }}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p style={{ marginTop: 8 }}>{message}</p>
        <div style={{ justifyContent: "flex-end", display: "flex", gap: 8 }}>
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Animals() {
  const { token, user, logout } = useAuth();

  // Toast
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

  // Data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Search
  const [q, setQ] = useState("");

  // Sorting
  const [sortKey, setSortKey] = useState("animal_name");
  const [sortDir, setSortDir] = useState("asc");

  // Pagination
  const [page, setPage] = useState(1);

  // Delete modal
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetchAuth(
        `${api}/api/animals`,
        { headers: { Authorization: `Bearer ${token}` } },
        logout
      );
      const { ok, data, detail } = await parseJsonWithDetail(res);
      if (!ok) throw new Error(detail || "Failed to fetch animals");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message);
      showToast("error", e.message);
    } finally {
      setLoading(false);
    }
  }

  // Filtering + sorting
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let out = rows.filter((r) =>
      !term
        ? true
        : (r.animal_name || "").toLowerCase().includes(term) ||
          (r.species || "").toLowerCase().includes(term) ||
          (r.exhibit || "").toLowerCase().includes(term) ||
          (r.animal_status || "").toLowerCase().includes(term)
    );

    out.sort((a, b) => {
      let A = (a[sortKey] || "").toString().toLowerCase();
      let B = (b[sortKey] || "").toString().toLowerCase();
      if (A < B) return sortDir === "asc" ? -1 : 1;
      if (A > B) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return out;
  }, [rows, q, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const startIdx = (pageSafe - 1) * PAGE_SIZE;
    return filtered.slice(startIdx, startIdx + PAGE_SIZE);
  }, [filtered, pageSafe]);

  // Delete
  async function confirmDelete() {
    if (!toDelete) return;
    const id = toDelete.animal_id;
    try {
      const res = await fetchAuth(
        `${api}/api/animals/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
        logout
      );
      const info = await parseJsonWithDetail(res);
      if (!info.ok) throw new Error(info.detail || "Delete failed");

      setRows((prev) => prev.filter((r) => r.animal_id !== id));
      setToDelete(null);
      showToast("success", "Animal deleted");
    } catch (e) {
      showToast("error", e.message);
    }
  }

  function exportCsv() {
    const csv = rowsToCsv(filtered, [
      { header: "Name", get: (r) => r.animal_name },
      { header: "Species", get: (r) => r.species },
      { header: "Exhibit", get: (r) => r.exhibit },
      { header: "Status", get: (r) => r.animal_status },
      { header: "ID", get: (r) => r.animal_id },
    ]);
    downloadCsv("animals.csv", csv);
  }

  function onSort(k) {
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir("asc");
    }
  }

  return (
    <div className="container container-wide">
      <div className="header-row">
        <h1>Animals</h1>
        <div className="row-gap">
          <button className="btn" onClick={exportCsv}>
            Export CSV
          </button>
          {(user?.role === "admin" || user?.role === "ops_manager") && (
            <Link className="btn" to="/staff/animals/new">
              + New Animal
            </Link>
          )}
        </div>
      </div>

      <div className="page-grid">
        <aside className="card sticky">
          <div className="grid grid-1">
            <div className="field">
              <label>Search</label>
              <input
                className="input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="name, species, exhibit, status…"
              />
            </div>
            <div className="field">
              <button className="btn block" onClick={() => setQ("")}>
                Clear
              </button>
            </div>
          </div>
        </aside>

        <section className="card">
          {err && <div className="error">{err}</div>}
          {loading ? (
            <div>Loading…</div>
          ) : (
            <>
              <div className="table-wrap">
                <table className="table wide">
                  <thead>
                    <tr>
                      <th onClick={() => onSort("animal_name")}>
                        Name{" "}
                        {sortKey === "animal_name"
                          ? sortDir === "asc"
                            ? "▲"
                            : "▼"
                          : ""}
                      </th>
                      <th onClick={() => onSort("species")}>
                        Species{" "}
                        {sortKey === "species"
                          ? sortDir === "asc"
                            ? "▲"
                            : "▼"
                          : ""}
                      </th>
                      <th onClick={() => onSort("exhibit")}>
                        Exhibit{" "}
                        {sortKey === "exhibit"
                          ? sortDir === "asc"
                            ? "▲"
                            : "▼"
                          : ""}
                      </th>
                      <th onClick={() => onSort("animal_status")}>
                        Status{" "}
                        {sortKey === "animal_status"
                          ? sortDir === "asc"
                            ? "▲"
                            : "▼"
                          : ""}
                      </th>
                      <th>ID</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((a) => (
                      <tr key={a.animal_id}>
                        <td>{a.animal_name}</td>
                        <td>{a.species}</td>
                        <td>{a.exhibit}</td>
                        <td>{a.animal_status}</td>
                        <td>
                          <code>{a.animal_id}</code>
                        </td>
                        <td>
                          <Link
                          className="btn btn-sm"
                          to={`/staff/animals/${a.animal_id}`}   // was `/animals/${a.animal_id}`
                        >
                          View
                        </Link>

                        <Link
                          className="btn btn-sm"
                          to={`/staff/animals/${a.animal_id}/edit`}   // was `/animals/${a.animal_id}/edit`
                        >
                          Edit
                        </Link>
                          <button
                            className="btn btn-sm"
                            onClick={() => setToDelete(a)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="row-between pager">
                <div>
                  Page {pageSafe} of {totalPages}
                </div>
                <div className="row-gap">
                  <button
                    className="btn"
                    onClick={() => setPage(1)}
                    disabled={pageSafe <= 1}
                  >
                    « First
                  </button>
                  <button
                    className="btn"
                    onClick={() =>
                      setPage((p) => Math.max(1, p - 1))
                    }
                    disabled={pageSafe <= 1}
                  >
                    ‹ Prev
                  </button>
                  <button
                    className="btn"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={pageSafe >= totalPages}
                  >
                    Next ›
                  </button>
                  <button
                    className="btn"
                    onClick={() => setPage(totalPages)}
                    disabled={pageSafe >= totalPages}
                  >
                    Last »
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <ConfirmModal
        open={!!toDelete}
        title="Delete animal?"
        message={
          toDelete
            ? `This will permanently delete “${toDelete.animal_name}” (ID ${toDelete.animal_id}).`
            : ""
        }
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
