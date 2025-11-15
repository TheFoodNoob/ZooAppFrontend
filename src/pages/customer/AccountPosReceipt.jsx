// src/pages/customer/AccountPosReceipt.jsx
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

function formatUSD(cents) {
  if (cents == null) return "";
  const n = Number(cents) / 100;
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

export default function AccountPosReceipt() {
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
        const res = await fetch(`${api}/api/customer/pos/${id}`, {
          headers: { Authorization: `Bearer ${customerToken}` },
        });
        if (!res.ok) throw new Error(`Failed to load receipt (${res.status})`);
        const data = await res.json();
        setHeader(data.header);
        setItems(data.items || []);
      } catch (e) {
        setError(e.message || "Failed to load receipt");
      } finally {
        setLoading(false);
      }
    }
    if (customerToken) load();
  }, [id, customerToken]);

  // ---------- derived discount fields ----------
  let subtotalCents = 0;
  let totalCents = 0;
  let discountCents = 0;
  let discountPct = 0;
  let hasDiscount = false;

  if (header) {
    subtotalCents =
      header.subtotal_cents != null ? header.subtotal_cents : header.total_cents || 0;
    totalCents = header.total_cents != null ? header.total_cents : subtotalCents;

    if (header.discount_cents != null) {
      discountCents = header.discount_cents;
    } else {
      discountCents = Math.max(0, subtotalCents - totalCents);
    }

    hasDiscount = discountCents > 0;

    if (header.discount_pct != null) {
      discountPct = header.discount_pct;
    } else if (hasDiscount && subtotalCents > 0) {
      discountPct = Math.round((discountCents * 100) / subtotalCents);
    }
  }

  return (
    <div className="page">
      <div className="container">
        <h1>Gift shop &amp; food purchase</h1>

        {loading && <p>Loading…</p>}
        {error && !loading && <div className="error">{error}</div>}

        {header && !loading && !error && (
          <div className="card" style={{ marginTop: 16 }}>
            <h2>Receipt #{header.pos_sale_id}</h2>
            <p>
              <strong>Date:</strong> {formatDate(header.created_at)}
              <br />
              <strong>Source:</strong> {header.source}
              <br />
              <strong>Membership at sale:</strong>{" "}
              {header.membership_tier_at_sale || "None"}
            </p>

            {items.length > 0 && (
              <>
                <h3 style={{ marginTop: 16 }}>Items</h3>
                <div style={{ marginTop: 8, overflowX: "auto" }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Category</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Line total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr
                          key={it.pos_sale_item_id || it.pos_item_id || `i-${idx}`}
                        >
                          <td>{it.item_name || it.name || "Item"}</td>
                          <td>{it.category || "—"}</td>
                          <td>{it.quantity}</td>
                          <td>{formatUSD(it.price_cents)}</td>
                          <td>
                            {formatUSD(
                              it.line_total_cents || it.line_subtotal_cents
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <p style={{ marginTop: 16 }}>
              <strong>Subtotal:</strong> {formatUSD(subtotalCents)}
              <br />
              <strong>Membership discount:</strong>{" "}
              {hasDiscount
                ? `${discountPct}% (-${formatUSD(discountCents)})`
                : "—"}
              <br />
              <strong>Total paid:</strong> {formatUSD(totalCents)}
            </p>

            <p style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
              Line-item breakdown is stored in the <code>pos_sale_item</code>{" "}
              table.
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
