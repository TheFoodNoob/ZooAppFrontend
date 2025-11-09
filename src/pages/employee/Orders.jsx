import React from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";

const toUSD = (c) =>
  (Number(c || 0) / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function Orders() {
  const { token } = useAuth();
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const url = q ? `${api}/api/orders?q=${encodeURIComponent(q)}` : `${api}/api/orders`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error(`Failed (${r.status})`);
      setRows(await r.json());
    } catch (e) {
      setMsg(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); /* initial */ }, []);

  async function refund(id) {
    if (!window.confirm(`Refund order #${id}?`)) return;
    try {
      const r = await fetch(`${api}/api/orders/${id}/refund`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: "staff refund" }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Refund failed");
      await load();
      alert("Refunded.");
    } catch (e) {
      alert(e.message || "Refund failed");
    }
  }

  return (
    <div className="page card-page">
      <div className="card-page-inner">
        <h2 className="card-page-title">Orders</h2>
        <div className="card card-page-body">
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <input
              placeholder="Search order id or email…"
              value={q} onChange={(e) => setQ(e.target.value)}
              style={{ flex: "1 1 260px" }}
            />
            <button className="btn" onClick={load} disabled={loading}>
              {loading ? "Loading…" : "Search"}
            </button>
          </div>

          {msg && <div className="error" style={{ marginBottom: 10 }}>{msg}</div>}

          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%", background: "#fff" }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Buyer</th>
                  <th>Email</th>
                  <th>Visit date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Refund</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.order_id}>
                    <td>#{o.order_id}</td>
                    <td>{o.buyer_name}</td>
                    <td>{o.buyer_email}</td>
                    <td>{new Date(o.visit_date).toLocaleDateString()}</td>
                    <td>{o.items}</td>
                    <td>{toUSD(o.total_cents)}</td>
                    <td>
                      {o.status}
                      {o.status === "refunded" && o.refund_cents
                        ? ` (${toUSD(o.refund_cents)})`
                        : null}
                    </td>
                    <td>
                      {o.refund_eligible && o.status !== "refunded" ? (
                        <button className="btn btn-sm" onClick={() => refund(o.order_id)}>
                          Refund
                        </button>
                      ) : (
                        <span style={{ opacity: 0.6 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && !loading && (
                  <tr><td colSpan="8" style={{ textAlign: "center", padding: 16 }}>No orders.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
