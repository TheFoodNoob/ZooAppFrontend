// src/pages/customer/MembershipConfirmation.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

function toUSD(cents) {
  return (Number(cents || 0) / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

export default function MembershipConfirmation() {
  const { user } = useAuth();
  const location = useLocation();
  const state = location.state || {};

  const { tier, txn, startDate, endDate } = state;

  // If they hit this page directly (no state), just show a simple message
  if (!tier || !txn) {
    return (
      <div className="page">
        <div className="container">
          <h1>Membership purchase</h1>
          <p>
            Your membership purchase has been processed. You can review all
            details from your account page.
          </p>
          <Link to="/account" className="btn btn-primary">
            Go to My Account
          </Link>
        </div>
      </div>
    );
  }

  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date();

  const displayStart = start.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const displayEnd = end.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const amount = toUSD(txn.price_cents || txn.total_cents || 0);

  return (
    <div className="page">
      <div className="container">
        <h1>Membership purchase confirmed</h1>
        <p className="page-intro">
          Thank you for becoming an H-Town Zoo member! A confirmation has been
          recorded in your account.
        </p>

        <div className="card">
          <h2>Receipt</h2>

          <dl className="simple-def-list">
            <div>
              <dt>Member name</dt>
              <dd>
                {user
                  ? `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                    user.email
                  : "Signed-in customer"}
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email || "—"}</dd>
            </div>
            <div>
              <dt>Membership tier</dt>
              <dd>{tier.name}</dd>
            </div>
            <div>
              <dt>Transaction #</dt>
              <dd>{txn.membership_txn_id}</dd>
            </div>
            <div>
              <dt>Amount charged</dt>
              <dd>{amount}</dd>
            </div>
            <div>
              <dt>Membership period</dt>
              <dd>
                {displayStart} – {displayEnd}
              </dd>
            </div>
            <div>
              <dt>Discount on tickets & shop</dt>
              <dd>{txn.discount_pct}%</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{txn.source || "online"}</dd>
            </div>
          </dl>

          <p style={{ marginTop: 16, fontSize: 14, color: "var(--muted)" }}>
            You can view this membership and its savings anytime from your{" "}
            <strong>My Account</strong> page under{" "}
            <em>“Membership history”</em>.
          </p>

          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <Link to="/account" className="btn btn-primary">
              Go to My Account
            </Link>
            <Link to="/memberships" className="btn btn-ghost">
              Back to memberships
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
