// src/pages/customer/OrderLookup.jsx
import React from "react";
import { api } from "../../api";

const toUSD = (cents) =>
  (Number(cents || 0) / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

function isRefundEligible(visitDate) {
  try {
    const v = new Date(visitDate);
    // Refunds allowed through 11:59:59 PM the day BEFORE the visit
    const cutoff = new Date(v.getFullYear(), v.getMonth(), v.getDate() - 1, 23, 59, 59, 999);
    return new Date() <= cutoff;
  } catch {
    return false;
  }
}

export default function OrderLookup() {
  const [orderId, setOrderId] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [note, setNote] = React.useState("");
  const [order, setOrder] = React.useState(null); // populated after lookup
  const [working, setWorking] = React.useState(false);

  async function doLookup(e) {
    e?.preventDefault?.();
    setErr("");
    setNote("");
    setOrder(null);
    if (!orderId || !email) return setErr("Please enter your order # and email.");

    setLoading(true);
    try {
      const r = await fetch(`${api}/api/public/orders/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: Number(orderId), email }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Lookup failed");
      setOrder(j.order);
    } catch (e) {
      setErr(e.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  async function requestRefund() {
    if (!order) return;
    if (!isRefundEligible(order.visit_date)) {
      return setNote("The return window has closed (refunds allowed until the day before your visit).");
    }
    if (!window.confirm(`Request a refund for order #${order.order_id}?`)) return;

    setWorking(true);
    setErr("");
    setNote("");
    try {
      const r = await fetch(`${api}/api/public/orders/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.order_id,
          email: order.buyer_email,
          reason: "customer request via Order Lookup",
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Refund failed");
      // Show updated state + a receipt note
      const updated = j.order || { ...order, status: "refunded", refund_cents: j.refund_cents };
      setOrder(updated);
      setNote(
        `Refund processed for ${toUSD(updated.refund_cents ?? updated.total_cents)}. A confirmation email has been sent.`
      );
    } catch (e) {
      setErr(e.message || "Refund failed");
    } finally {
      setWorking(false);
    }
  }

  const refunded = String(order?.status || "").toLowerCase() === "refunded";
  const eligible = order ? isRefundEligible(order.visit_date) : false;

  return (
    <div className="page">
      <h1>Find my order</h1>

      {/* Lookup form */}
      <div className="panel" style={{ maxWidth: 720, marginBottom: 16 }}>
        <form className="two-col" style={{ gap: 10 }} onSubmit={doLookup}>
          {err && <div className="error span-2">{err}</div>}
          {note && <div className="note span-2">{note}</div>}

          <div>
            <label>Order #</label>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="e.g., 1234"
              required
            />
          </div>
          <div>
            <label>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="span-2">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Looking up…" : "Find order"}
            </button>
          </div>
        </form>
      </div>

      {/* Order details & refund action */}
      {order && (
        <div className="panel" style={{ background: "#fffef5" }}>
          <div style={{ display: "grid", gap: 8 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                Order #{order.order_id} — {order.status}
              </div>
              <div style={{ opacity: 0.85 }}>
                Visit date: <strong>{order.visit_date}</strong>
              </div>
              <div style={{ opacity: 0.85 }}>
                Buyer: <strong>{order.buyer_name}</strong> &middot; {order.buyer_email}
              </div>
            </div>

            <div className="two-col" style={{ gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Items</div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {order.items.map((it, i) => (
                    <li
                      key={i}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        padding: "6px 0",
                        borderBottom: "1px dashed #eadfae",
                      }}
                    >
                      <span>
                        {it.name} × {it.quantity}
                      </span>
                      <span>{toUSD(it.line_total_cents)}</span>
                    </li>
                  ))}
                </ul>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    fontWeight: 900,
                    marginTop: 6,
                  }}
                >
                  <span>Total</span>
                  <span>{toUSD(order.total_cents)}</span>
                </div>
                {refunded && (
                  <div style={{ marginTop: 6 }}>
                    <span style={{ fontWeight: 700 }}>Refunded:</span>{" "}
                    {toUSD(order.refund_cents ?? order.total_cents)}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Actions</div>
                {refunded ? (
                  <div className="note">This order has already been refunded.</div>
                ) : eligible ? (
                  <button className="btn" type="button" onClick={requestRefund} disabled={working}>
                    {working ? "Requesting…" : "Request refund"}
                  </button>
                ) : (
                  <div className="note">
                    Returns are allowed until 11:59 PM the day before your visit.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
