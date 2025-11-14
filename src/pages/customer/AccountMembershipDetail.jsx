import React from "react";
import { useParams, useLocation, Link } from "react-router-dom";

import { } from "react-router-dom";

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

export default function AccountMembershipDetail() {
  const { id } = useParams();
  const location = useLocation();
  const membership = location.state?.membership;

  if (!membership) {
    return (
      <div className="page">
        <div className="container">
          <h1>Membership transaction #{id}</h1>
          <div className="card" style={{ marginTop: 20 }}>
            <p>We couldn&apos;t load this membership transaction here.</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>
              Please return to <Link to="/account">My Account</Link> and choose
              it again from the membership history list.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1>Membership purchase</h1>
        <div className="card" style={{ marginTop: 20 }}>
          <h2 style={{ marginTop: 0 }}>
            Transaction #{membership.membership_txn_id}
          </h2>
          <p>
            <strong>Tier:</strong> {membership.membership_tier}
            <br />
            <strong>Started:</strong> {formatDate(membership.started_on)}
            <br />
            <strong>Ends:</strong> {formatDate(membership.ends_on)}
            <br />
            <strong>Amount:</strong> {formatUSD(membership.total_cents)}
            <br />
            <strong>Discount:</strong>{" "}
            {membership.discount_pct
              ? `${membership.discount_pct}%`
              : "—"}
            <br />
            <strong>Source:</strong> {membership.source}
          </p>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Memberships are tracked in the <code>membership_txn</code> table.
            This view shows one transaction and how it contributes to your
            membership status.
          </p>
        </div>

        <p style={{ marginTop: 16 }}>
          &larr; <Link to="/account">Back to My Account</Link>
        </p>
      </div>
    </div>
  );
}
