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

  // Order may be passed in via navigate(..., { state: { order } })
  const [order, setOrder] = React.useState(loc.state?.order || null);

  // For this page we treat `t` as the **magic lookup token**, not a JWT
  const [magic, setMagic] = React.useState(() => {
    const params = new URLSearchParams(window.location.search);
    return loc.state?.magic || params.get("t") || "";
  });

  const [err, setErr] = React.useState("");
  const [note, setNote] = React.useState("");

  // Load order from API when we have a magic token but no order yet
  React.useEffect(() => {
    if (!id || !magic || order) return;

    (async () => {
      try {
        const r = await fetch(`${api}/api/public/orders/${id}`, {
          headers: {
            "X-Order-Magic": magic,
          },
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || "Load failed");
        setOrder(j);
      } catch (e) {
        setErr(e.message || "Failed to load order");
      }
    })();
  }, [id, magic, order]);

  // --------- early states ---------

  if (!magic) {
    return (
      <div className="page">
        <h1>Order #{id}</h1>
        <div className="error">
          Missing access token. Please use the link from your email, or visit the{" "}
          <Link to="/orders">“Find my order”</Link> page and enter your order
          number and verification code.
        </div>
        <Link to="/tickets">Back to tickets</Link>
      </div>
    );
  }

  if (err) {
    return (
      <div className="page">
        <h1>Order #{id}</h1>
        <div className="error">{err}</div>
        <Link to="/tickets">Back to tickets</Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page">
        <h1>Order #{id}</h1>
        <p>Loading…</p>
      </div>
    );
  }

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

          {refunded && (
            <div style={{ marginTop: 6 }}>
              <span style={{ fontWeight: 700 }}>Refunded:</span>{" "}
              {toUSD(
                order.refund_cents ??
                  order.refunded_cents ??
                  order.total_cents
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: "1.25rem", textAlign: "left" }}>
          <h3>Refunds</h3>
          <p style={{ margin: 0, color: "#444" }}>
            This receipt link lets you <strong>view</strong> your order. To
            request a refund, please go to the{" "}
            <Link to="/orders">“Find my order”</Link> page, enter your order
            number and email, and use the verification code sent to you. That
            flow uses a secure one-time code and will let you cancel if you’re
            still within the refund window.
          </p>
        </div>
      </div>

      <Link to="/tickets" style={{ marginTop: 16 }}>
        Back to tickets
      </Link>
    </div>
  );
}
