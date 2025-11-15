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

  const [order, setOrder] = React.useState(loc.state?.order || null);

  const [magic] = React.useState(() => {
    const params = new URLSearchParams(window.location.search);
    return loc.state?.magic || params.get("t") || "";
  });

  const [err, setErr] = React.useState("");
  const [note] = React.useState("");

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

  if (!magic) {
    return (
      <div className="page">
        <h1>Order #{id}</h1>
        <div className="error">
          Missing access token. Please use the link from your email, or visit
          <Link to="/orders">“Find my order”</Link>.
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
  const posItems = Array.isArray(order.pos_items) ? order.pos_items : [];

  /* --------------------------------------------------------
   * DISCOUNT LOGIC (this was missing before)
   * -------------------------------------------------------- */

  const subtotalCents =
    order.subtotal_cents != null ? order.subtotal_cents : order.total_cents;

  const totalCents =
    order.total_cents != null ? order.total_cents : subtotalCents;

  const discountCents =
    order.discount_cents != null
      ? order.discount_cents
      : Math.max(0, subtotalCents - totalCents);

  const hasDiscount = discountCents > 0;

  const discountPct =
    order.discount_pct != null
      ? order.discount_pct
      : hasDiscount && subtotalCents > 0
      ? Math.round((discountCents * 100) / subtotalCents)
      : 0;

  /* -------------------------------------------------------- */

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
        {note && <div className="note">{note}</div>}

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
          <h3 style={{ marginBottom: "0.25rem" }}>Tickets</h3>

          {order.items && order.items.length > 0 ? (
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
          ) : (
            <p style={{ color: "#555" }}>No admission tickets in this order.</p>
          )}

          {posItems.length > 0 && (
            <>
              <h3 style={{ marginTop: "1rem", marginBottom: "0.25rem" }}>
                Food &amp; gift shop items
              </h3>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {posItems.map((it, i) => (
                  <li
                    key={`pos-${i}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      padding: "6px 0",
                      borderBottom: "1px dashed #eadfae",
                    }}
                  >
                    <span>
                      {it.name} × {it.quantity}{" "}
                      {it.category && (
                        <span style={{ opacity: 0.6, fontSize: 12 }}>
                          ({it.category})
                        </span>
                      )}
                    </span>
                    <span>{toUSD(it.line_total_cents)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* ---------------------- */}
          {/*  TOTALS WITH DISCOUNT */}
          {/* ---------------------- */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              marginTop: 12,
              fontWeight: 700,
            }}
          >
            <span>Subtotal</span>
            <span>{toUSD(subtotalCents)}</span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              marginTop: 4,
              fontWeight: 700,
            }}
          >
            <span>Membership discount</span>
            <span>
              {hasDiscount
                ? `${discountPct}% (-${toUSD(discountCents)})`
                : "—"}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              marginTop: 4,
              fontWeight: 900,
            }}
          >
            <span>Total</span>
            <span>{toUSD(totalCents)}</span>
          </div>

          {refunded && (
            <div style={{ marginTop: 6 }}>
              <strong>Refunded:</strong>{" "}
              {toUSD(order.refund_cents ?? order.refunded_cents ?? totalCents)}
            </div>
          )}
        </div>

        <div style={{ marginTop: "1.25rem", textAlign: "left" }}>
          <h3>Refunds</h3>
          <p style={{ margin: 0 }}>
            To request a refund, go to{" "}
            <Link to="/orders">“Find my order”</Link> and enter your order
            number and email.
          </p>
        </div>
      </div>

      <Link to="/tickets" style={{ marginTop: 16 }}>
        Back to tickets
      </Link>
    </div>
  );
}
