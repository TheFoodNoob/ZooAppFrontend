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
                        <tr key={it.pos_sale_item_id || it.pos_item_id || `i-${idx}`}>
                          <td>{it.item_name || it.name || "Item"}</td>
                          <td>{it.category || "—"}</td>
                          <td>{it.quantity}</td>
                          <td>{formatUSD(it.price_cents)}</td>
                          <td>{formatUSD(it.line_total_cents || it.line_subtotal_cents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <p style={{ marginTop: 16 }}>
              <strong>Subtotal:</strong> {formatUSD(header.subtotal_cents)}
              <br />
              <strong>Discount:</strong>{" "}
              {header.discount_pct
                ? `${header.discount_pct}% (-${formatUSD(
                    header.discount_cents
                  )})`
                : "—"}
              <br />
              <strong>Total paid:</strong> {formatUSD(header.total_cents)}
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
