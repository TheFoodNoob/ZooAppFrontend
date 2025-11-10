// src/pages/customer/OrderReceipt.jsx
import React from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { api } from "../../api";

const toUSD = (cents) =>
  (Number(cents || 0) / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

export default function OrderReceipt() {
  const { id } = useParams();
  const loc = useLocation();
  const [order, setOrder] = React.useState(loc.state || null);
  const [err, setErr] = React.useState("");
  const [note, setNote] = React.useState("");
  const [working, setWorking] = React.useState(false);

  const token = new URLSearchParams(window.location.search).get("t");

  React.useEffect(() => {
    if (order || !id || !token) return;
    (async () => {
      try {
        const r = await fetch(`${api}/api/public/orders/${id}?t=${token}`);
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || "Load failed");
        setOrder(j);
      } catch (e) {
        setErr(e.message || "Failed to load order");
      }
    })();
  }, [id, token, order]);

  async function requestRefund() {
    if (!order) return;
    if (!window.confirm("Request a refund for this order?")) return;

    setWorking(true);
    setErr("");
    setNote("");
    try {
      const r = await fetch(`${api}/api/public/orders/${order.order_id}/refund?t=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Refund failed");
      setOrder((o) => ({ ...o, ...j.order }));
      setNote(`Refund processed for ${toUSD(j.order.refund_cents)}.`);
    } catch (e) {
      setErr(e.message || "Refund failed");
    } finally {
      setWorking(false);
    }
  }

  if (!token)
    return (
      <div className="page">
        <h1>Order #{id}</h1>
        <div className="error">Missing access token. Use the link from your email.</div>
        <Link to="/tickets">Back to tickets</Link>
      </div>
    );

  if (err)
    return (
      <div className="page">
        <h1>Order #{id}</h1>
        <div className="error">{err}</div>
        <Link to="/tickets">Back to tickets</Link>
      </div>
    );

  if (!order)
    return (
      <div className="page">
        <h1>Order #{id}</h1>
        <p>Loading...</p>
      </div>
    );

  const refunded = String(order.status || "").toLowerCase() === "refunded";

  return (
    <div
      className="page"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <h1>Order #{order.order_id}</h1>

      <div
        className="panel"
        style={{
          background: "#fff8e1",
          maxWidth: 720,
          width: "100%",
          padding: "1.5rem",
          borderRadius: 12,
          marginTop: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {note && (
          <div className="note" style={{ marginBottom: 8 }}>
            {note}
          </div>
        )}

        <p>
          <strong>Thanks, {order.buyer_name}!</strong>
        </p>

        <p style={{ margin: "0.5rem 0" }}>
          <strong>Status:</strong> {order.status}
          <br />
          <strong>Visit date:</strong> {order.visit_date}
          <br />
          <strong>Receipt sent to:</strong> {order.buyer_email}
        </p>

        <div style={{ marginTop: "1rem", textAlign: "left" }}>
          <h3 style={{ marginBottom: "0.25rem" }}>Items</h3>
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
              marginTop: 8,
              fontWeight: 700,
            }}
          >
            <span>Total</span>
            <span>{toUSD(order.total_cents)}</span>
          </div>
        </div>

        <div style={{ marginTop: "1.25rem" }}>
          <h3>Actions</h3>
          {refunded ? (
            <div className="note">This order has already been refunded.</div>
          ) : (
            <button className="btn" onClick={requestRefund} disabled={working}>
              {working ? "Processing..." : "Request refund"}
            </button>
          )}
        </div>
      </div>

      <Link to="/tickets" style={{ marginTop: 16 }}>
        Back to tickets
      </Link>
    </div>
  );
}
