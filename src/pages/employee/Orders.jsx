import React from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";

const toUSD = (c) =>
  (Number(c || 0) / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });

export default function Orders() {
  const { token } = useAuth();
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [confirmId, setConfirmId] = React.useState(null); // <-- NEW (stores ID waiting for confirm)

  async function load() {
    if (!token) {
      setMsg("Not logged in");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const url = q
        ? `${api}/api/orders?q=${encodeURIComponent(q)}`
        : `${api}/api/orders`;

      const r = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!r.ok) throw new Error(`Failed to load orders (${r.status})`);

      setRows(await r.json());
    } catch (err) {
      setMsg(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (token) load();
  }, [token]);

  async function doRefund(id) {
    try {
      const r = await fetch(`${api}/api/orders/${id}/refund`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: "staff refund" }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Refund failed");

      setConfirmId(null);
      await load();
      setMsg(`Order #${id} refunded successfully.`);
    } catch (err) {
      setMsg(err.message || "Refund failed");
    }
  }

  return (
    <div className="page card-page">
      <div className="card-page-inner">
        <h2 className="card-page-title">Orders</h2>

        <div className="card card-page-body">
          {/* SEARCH BAR */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <input
              placeholder="Search order id or email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              style={{ flex: "1 1 260px" }}
            />
            <button className="btn" onClick={load} disabled={loading}>
              {loading ? "Loading…" : "Search"}
            </button>
          </div>

          {msg && (
            <div style={{ color: "#b33", marginBottom: 10 }}>{msg}</div>
          )}

          {/* TABLE */}
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
                {rows.map((o) => {
                  const refundAmount =
                    o.refund_cents ?? o.refunded_cents ?? null;

                  const awaitingConfirm = confirmId === o.order_id;

                  return (
                    <tr key={o.order_id}>
                      <td>#{o.order_id}</td>
                      <td>{o.buyer_name}</td>
                      <td>{o.buyer_email}</td>
                      <td>
                        {o.visit_date
                          ? new Date(o.visit_date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>{o.items}</td>
                      <td>{toUSD(o.total_cents)}</td>

                      {/* STATUS */}
                      <td>
                        {o.status}
                        {o.status === "refunded" && refundAmount
                          ? ` (${toUSD(refundAmount)})`
                          : ""}
                      </td>

                      {/* REFUND BUTTON OR CONFIRMATION */}
                      <td>
                        {o.status === "refunded" || !o.refund_eligible ? (
                          <span style={{ opacity: 0.6 }}>—</span>
                        ) : awaitingConfirm ? (
                          // INLINE CONFIRM UI
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="btn btn-sm"
                              style={{ background: "#d9534f", color: "white" }}
                              onClick={() => doRefund(o.order_id)}
                            >
                              Yes
                            </button>
                            <button
                              className="btn btn-sm"
                              onClick={() => setConfirmId(null)}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          // NORMAL REFUND BUTTON
                          <button
                            className="btn btn-sm"
                            onClick={() => setConfirmId(o.order_id)}
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {rows.length === 0 && !loading && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: 16 }}>
                      No orders.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
