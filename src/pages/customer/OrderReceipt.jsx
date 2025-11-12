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
  const [confirming, setConfirming] = React.useState(false);

  // Magic token from ?t=...
  const magic = React.useMemo(
    () => new URLSearchParams(window.location.search).get("t"),
    []
  );

  // Load order on first visit when we don't already have it from navigation state
  React.useEffect(() => {
    if (order || !id || !magic) return;

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

  async function doRefund() {
    if (!order) return;

    setWorking(true);
    setErr("");
    setNote("");

    try {
      const r = await fetch(`${api}/api/public/orders/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // not required by backend but harmless; documents intent
          "X-Order-Magic": magic || "",
        },
        body: JSON.stringify({
          order_id: order.order_id,
          email: order.buyer_email,
          reason: "customer self-service",
        }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Refund failed");

      setOrder((o) => ({
        ...(o || {}),
        status: "refunded",
        refund_cents: j.order?.refund_cents ?? o?.total_cents,
        refunded_cents: j.order?.refunded_cents ?? o?.total_cents,
        refunded_at: j.order?.refunded_at ?? new Date().toISOString(),
      }));

      setNote(`Refund processed for ${toUSD(j.order.refund_cents)}.`);
    } catch (e) {
      setErr(e.message || "Refund failed");
    } finally {
      setWorking(false);
      setConfirming(false);
    }
  }

  const refunded = String(order?.status || "").toLowerCase() === "refunded";

  // ---- Render guards ----
  if (!magic) {
    return (
      <div className="page">
        <h1>Order #{id}</h1>
        <div className="error">
          Missing access token. Please use the link from your email.
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
        <p>Loading...</p>
      </div>
    );
  }

  // ---- Main UI ----
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
          <div
            className="note"
            style={{
              marginBottom: 8,
              padding: "8px 12px",
              background: "#e8f5e9",
              borderRadius: 8,
            }}
          >
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
          ) : confirming ? (
            <div style={{ marginTop: 8 }}>
              <p style={{ marginBottom: 8 }}>
                Are you sure you want to request a refund for this order?
              </p>
              <button
                className="btn"
                onClick={doRefund}
                disabled={working}
                style={{ marginRight: 8 }}
              >
                {working ? "Processing..." : "Yes, refund order"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirming(false)}
                disabled={working}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="btn"
              onClick={() => setConfirming(true)}
              disabled={working}
            >
              Request refund
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
