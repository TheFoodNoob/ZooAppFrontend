import React from "react";
import { useParams, useLocation, Link } from "react-router-dom";

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
    minimumFractionDigits: 2,
  });
}

export default function AccountDonationDetail() {
  const { id } = useParams();
  const location = useLocation();
  const donation = location.state?.donation;

  if (!donation) {
    return (
      <div className="page">
        <div className="container">
          <h1>Donation #{id}</h1>
          <div className="card" style={{ marginTop: 20 }}>
            <p>We couldn&apos;t load this donation from here.</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>
              Please go back to <Link to="/account">My Account</Link> and open
              it again from the donations section.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1>Donation</h1>
        <div className="card" style={{ marginTop: 20 }}>
          <h2 style={{ marginTop: 0 }}>Donation #{donation.donation_id}</h2>
          <p>
            <strong>Date:</strong> {formatDate(donation.created_at)}
            <br />
            <strong>Amount:</strong> {formatUSD(donation.amount_cents)}
            <br />
            <strong>Tier:</strong> {donation.tier_label || "—"}
          </p>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Donations come from the <code>donation</code> table. This page
            provides a simple receipt-style view for your contribution.
          </p>
        </div>

        <p style={{ marginTop: 16 }}>
          &larr; <Link to="/account">Back to My Account</Link>
        </p>
      </div>
    </div>
  );
}
