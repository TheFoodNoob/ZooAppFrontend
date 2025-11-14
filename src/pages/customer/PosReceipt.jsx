// src/pages/customer/PosReceipt.jsx
import React from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../api";

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
  return (Number(cents) / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

export default function PosReceipt() {
  const { id } = useParams();
  const { customerToken, user } = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [sale, setSale] = React.useState(null);

  React.useEffect(() => {
    if (!customerToken) return;

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${api}/api/customer/history`, {
          headers: { Authorization: `Bearer ${customerToken}` },
        });
        if (!res.ok) throw new Error("Failed to load purchase history");
        const data = await res.json();
        const match = (data.pos || []).find(
          (p) => Number(p.pos_sale_id) === Number(id)
        );
        if (!cancelled) {
          if (!match) {
            setError("Purchase not found.");
          } else {
            setSale(match);
          }
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Error loading purchase");
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [customerToken, id]);

  if (!user || !customerToken) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="page">
      <div className="container">
        <h1>Gift shop &amp; food purchase</h1>

        {loading && <p>Loading receipt…</p>}
        {error && !loading && (
          <div className="error" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}

        {!loading && sale && (
          <div className="card" style={{ marginTop: 16 }}>
            <h2>Receipt #{sale.pos_sale_id}</h2>
            <p style={{ marginTop: 8 }}>
              <strong>Date:</strong> {formatDate(sale.created_at)}
              <br />
              <strong>Source:</strong> {sale.source}
              <br />
              <strong>Membership at sale:</strong>{" "}
              {sale.membership_tier_at_sale || "None"}
            </p>
            <p style={{ marginTop: 8 }}>
              <strong>Subtotal:</strong> {formatUSD(sale.subtotal_cents)}
              <br />
              <strong>Discount:</strong>{" "}
              {sale.discount_pct
                ? `${sale.discount_pct}% (-${formatUSD(
                    sale.discount_cents
                  )})`
                : "—"}
              <br />
              <strong>Total paid:</strong> {formatUSD(sale.total_cents)}
            </p>

            <p style={{ marginTop: 16, fontSize: 14, color: "var(--muted)" }}>
              Line-item breakdown for POS sales is stored in the{" "}
              <code>pos_sale_item</code> table. This receipt view shows how
              those header totals are tied back to your customer account.
            </p>
          </div>
        )}

        <p style={{ marginTop: 16 }}>
          <Link to="/account">&larr; Back to My Account</Link>
        </p>
      </div>
    </div>
  );
}
