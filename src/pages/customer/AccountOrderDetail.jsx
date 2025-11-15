// src/pages/customer/AccountOrderDetail.jsx
import React from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";

function formatDate(s) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(s);
  }
}

function formatTime(s) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return String(s);
  }
}

function formatUSD(cents) {
  if (cents == null) return "";
  const n = Number(cents) / 100;
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

export default function AccountOrderDetail() {
  const { id } = useParams();
  const { customerToken } = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [header, setHeader] = React.useState(null);
  const [items, setItems] = React.useState([]);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${api}/api/customer/orders/${id}`, {
          headers: { Authorization: `Bearer ${customerToken}` },
        });
        if (!res.ok) throw new Error(`Failed to load order (${res.status})`);
        const data = await res.json();
        setHeader(data.header || data); // backwards-compat
        setItems(data.items || []);
      } catch (e) {
        setError(e.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    }
    if (customerToken) load();
  }, [id, customerToken]);

  // ---- derived ticket-only totals ----
  const ticketSubtotalCents = items.reduce(
    (sum, it) => sum + Number(it.line_total_cents || 0),
    0
  );

  const discountPct = header ? Number(header.discount_pct || 0) : 0;

  let ticketDiscountCents = 0;
  let ticketFinalCents = ticketSubtotalCents;

  if (discountPct > 0 && ticketSubtotalCents > 0) {
    ticketDiscountCents = Math.round(
      ticketSubtotalCents * (discountPct / 100)
    );
    if (ticketDiscountCents < 0) ticketDiscountCents = 0;
    if (ticketDiscountCents > ticketSubtotalCents) {
      ticketDiscountCents = ticketSubtotalCents;
    }
    ticketFinalCents = ticketSubtotalCents - ticketDiscountCents;
  }

  return (
    <div className="page">
      <div className="container">
        <h1>Ticket order</h1>

        {loading && <p>Loading…</p>}
        {error && !loading && <div className="error">{error}</div>}

        {header && !loading && !error && (
          <div className="card" style={{ marginTop: 16 }}>
            <h2>Order #{header.order_id}</h2>
            <p>
              <strong>Placed on:</strong>{" "}
              {formatDate(header.created_at)} {formatTime(header.created_at)}
              <br />
              <strong>Visit date:</strong> {formatDate(header.visit_date)}
              <br />
              <strong>Status:</strong>{" "}
              {header.status
                ? header.status.charAt(0).toUpperCase() +
                  header.status.slice(1)
                : "—"}
              <br />
              <strong>Total paid for tickets:</strong>{" "}
              {formatUSD(ticketFinalCents)}
              <br />
              <strong>Membership at sale:</strong>{" "}
              {header.membership_tier_at_sale || "None"}
              <br />
              <strong>Subtotal (tickets):</strong>{" "}
              {formatUSD(ticketSubtotalCents)}
              <br />
              <strong>Membership discount:</strong>{" "}
              {discountPct > 0 ? (
                <>
                  {discountPct}% (-{formatUSD(ticketDiscountCents)})
                </>
              ) : (
                "—"
              )}
              <br />
              <strong>Final total (tickets):</strong>{" "}
              {formatUSD(ticketFinalCents)}
            </p>

            {items.length > 0 ? (
              <>
                <h3 style={{ marginTop: 16 }}>Tickets</h3>
                <div style={{ marginTop: 8, overflowX: "auto" }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Ticket type</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Line total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => (
                        <tr key={it.order_item_id}>
                          <td>{it.ticket_name || "Ticket"}</td>
                          <td>{it.quantity}</td>
                          <td>{formatUSD(it.price_cents)}</td>
                          <td>{formatUSD(it.line_total_cents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p style={{ marginTop: 16, fontSize: 14 }}>
                This order does not contain any ticket items. If it only
                included food or gift shop purchases, check the{" "}
                <em>Gift shop &amp; food purchases</em> section on your account.
              </p>
            )}

            <p style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
              Ticket line items are stored in the <code>order_item</code> table.
              This view shows the ticket portion of your order, including any
              membership discount applied to tickets.
            </p>

            <p style={{ marginTop: 16 }}>
              &larr; <Link to="/account">Back to My Account</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
