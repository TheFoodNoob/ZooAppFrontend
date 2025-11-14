// src/pages/customer/AccountDonationDetail.jsx
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

export default function AccountDonationDetail() {
  const { id } = useParams();
  const { customerToken } = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [d, setD] = React.useState(null);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${api}/api/customer/donations/${id}`, {
          headers: { Authorization: `Bearer ${customerToken}` },
        });
        if (!res.ok)
          throw new Error(`Failed to load donation (${res.status})`);
        setD(await res.json());
      } catch (e) {
        setError(e.message || "Failed to load donation");
      } finally {
        setLoading(false);
      }
    }
    if (customerToken) load();
  }, [id, customerToken]);

  return (
    <div className="page">
      <div className="container">
        <h1>Donation</h1>

        {loading && <p>Loading…</p>}
        {error && !loading && <div className="error">{error}</div>}

        {d && !loading && !error && (
          <div className="card" style={{ marginTop: 16 }}>
            <h2>Donation #{d.donation_id}</h2>
            <p>
              <strong>Date:</strong> {formatDate(d.created_at)}
              <br />
              <strong>Amount:</strong> {formatUSD(d.amount_cents)}
              <br />
              <strong>Tier:</strong> {d.tier_label || "—"}
              <br />
              {d.is_anonymous ? (
                <em>This donation was marked as anonymous.</em>
              ) : d.donor_name ? (
                <strong>Donor:</strong>
              ) : null}
              {!d.is_anonymous && d.message && (
                <>
                  <br />
                  <strong>Message:</strong> {d.message}
                </>
              )}
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
