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

function isRefundEligible(visitDate) {
  try {
    const v = new Date(visitDate);
    // last day to request is the day BEFORE the visit (local time)
    const lastRefundDay = new Date(
      v.getFullYear(),
      v.getMonth(),
      v.getDate() - 1,
      23, 59, 59, 999
    );
    const now = new Date();
    return now <= lastRefundDay;
  } catch {
    return false;
  }
}

export default function OrderReceipt() {
  const { id } = useParams();
  const loc = useLocation();
  const [order, setOrder] = React.useState(loc.state || null);
  const [err, setErr] = React.useState("");
  const [note, setNote] = React.useState("");
  const [working, setWorking] = React.useState(false);

  // If user refreshed (lost state), show a minimal message.
  React.useEffect(() => {
    if (order) return;
    setErr(
      "Order placed successfully. If you refreshed, details aren’t cached. Check your email for the receipt."
    );
  }, [order]);

  // --- OTP helper: request OTP then exchange for a short-lived access token ---
  async function getOrderAccessToken(order_id, email) {
    // 1) ask server to issue OTP (dev: code is printed to server console)
    await fetch(`${api}/api/public/orders/find`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id, email }),
    });

    // 2) prompt user for the 6-digit code
    const code = window.prompt("Enter the 6-digit code we sent to your email:");
    if (!code) throw new Error("No code entered");

    // 3) exchange code for a short-lived token
    const res = await fetch(`${api}/api/public/orders/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id, email, code }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j.token) throw new Error(j.error || "Verification failed");
    return j.token;
  }

  async function requestRefund() {
    if (!order) return;
    if (!isRefundEligible(order.visit_date)) {
      return setNote(
        "The return window has closed (refunds allowed until the day before your visit)."
      );
    }
    if (!window.confirm(`Request a refund for order #${order.order_id}?`)) return;

    setWorking(true);
    setErr("");
    setNote("");

    try {
      // Obtain short-lived access token for this order via OTP
      const token = await getOrderAccessToken(order.order_id, order.buyer_email);

      // Use the token to call the protected refund endpoint
      const r = await fetch(`${api}/api/public/orders/${order.order_id}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(j.error || `Refund failed (HTTP ${r.status})`);
      }

      // reflect new status immediately
      setOrder((o) => ({ ...(o || {}), status: "refunded" }));
      setNote("Refund processed. You’ll receive a confirmation email shortly.");
    } catch (e) {
      setErr(e.message || "Refund failed");
    } finally {
      setWorking(false);
    }
  }

  if (!order) {
    return (
      <div className="page">
        <h1>Order #{id}</h1>
        {err && <div className="note">{err}</div>}
        <p><Link to="/tickets">Back to tickets</Link></p>
      </div>
    );
  }

  const eligible = isRefundEligible(order.visit_date);
  const refunded = String(order.status).toLowerCase() === "refunded";

  return (
    <div className="page">
      <h1>Order confirmed</h1>
      <div className="panel" style={{ background: "#f6ffed", borderColor: "#b7eb8f" }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Thanks, {order.buyer_name}!</div>

        <div style={{ marginBottom: 8 }}>
          Your order <strong>#{order.order_id}</strong> is{" "}
          <strong>{order.status}</strong> for visit date <strong>{order.visit_date}</strong>.
        </div>

        <div className="two-col" style={{ gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Items</div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {order.items.map((it, i) => (
                <li
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    padding: "6px 0",
                    borderBottom: "1px dashed #eaeaea",
                  }}
                >
                  <span>{it.name} × {it.quantity}</span>
                  <span>{toUSD(it.line_total_cents)}</span>
                </li>
              ))}
            </ul>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                fontWeight: 800,
                marginTop: 6,
              }}
            >
              <span>Total</span>
              <span>{toUSD(order.total_cents)}</span>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Receipt sent to</div>
            <div>{order.buyer_email}</div>

            {/* Refund action */}
            <div style={{ marginTop: 12 }}>
              {refunded ? (
                <div className="note">This order has been refunded.</div>
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

        {note && <div className="note" style={{ marginTop: 10 }}>{note}</div>}
        {err && <div className="error" style={{ marginTop: 10 }}>{err}</div>}

        <div className="row" style={{ marginTop: 12 }}>
          <Link className="btn" to="/tickets">Buy more tickets</Link>
          <Link className="btn btn-primary" to="/">Return home</Link>
        </div>
      </div>
    </div>
  );
}
