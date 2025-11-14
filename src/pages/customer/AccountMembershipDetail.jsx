// src/pages/customer/AccountMembershipDetail.jsx
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

export default function AccountMembershipDetail() {
  const { id } = useParams();
  const { customerToken } = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [m, setM] = React.useState(null);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${api}/api/customer/memberships/${id}`, {
          headers: { Authorization: `Bearer ${customerToken}` },
        });
        if (!res.ok)
          throw new Error(`Failed to load membership (${res.status})`);
        setM(await res.json());
      } catch (e) {
        setError(e.message || "Failed to load membership");
      } finally {
        setLoading(false);
      }
    }
    if (customerToken) load();
  }, [id, customerToken]);

  return (
    <div className="page">
      <div className="container">
        <h1>Membership purchase</h1>

        {loading && <p>Loading…</p>}
        {error && !loading && <div className="error">{error}</div>}

        {m && !loading && !error && (
          <div className="card" style={{ marginTop: 16 }}>
            <h2>Transaction #{m.membership_txn_id}</h2>
            <p>
              <strong>Tier:</strong> {m.membership_tier}
              <br />
              <strong>Started:</strong> {formatDate(m.started_on)}
              <br />
              <strong>Ends:</strong> {formatDate(m.ends_on)}
              <br />
              <strong>Amount:</strong> {formatUSD(m.total_cents)}
              <br />
              <strong>Discount:</strong>{" "}
              {m.discount_pct ? `${m.discount_pct}%` : "0%"}
              <br />
              <strong>Source:</strong> {m.source}
            </p>

            <p style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
              Memberships are stored in the <code>membership_txn</code> table.
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
