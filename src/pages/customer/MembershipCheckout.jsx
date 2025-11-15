// src/pages/customer/MembershipCheckout.jsx
import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../api";
import { MEMBERSHIP_TIERS } from "./Memberships.jsx";

function toUSD(cents) {
  return (Number(cents || 0) / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

export default function MembershipCheckout() {
  const { tierId } = useParams();
  const { user, customerToken } = useAuth();
  const navigate = useNavigate();

  const tier = MEMBERSHIP_TIERS.find((t) => t.id === tierId);

  // If tier is invalid, just send them back to memberships
  if (!tier) {
    return (
      <div className="page">
        <div className="container">
          <h1>Membership not found</h1>
          <p>
            The membership plan you selected could not be found. Please choose a
            plan again.
          </p>
          <Link to="/memberships" className="btn btn-primary">
            Back to memberships
          </Link>
        </div>
      </div>
    );
  }

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  // Simple “today → +1 year” preview for the user
  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  const displayStart = startDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const displayEnd = endDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  async function handleConfirm() {
    setError("");

    if (!customerToken) {
      navigate("/login", {
        state: {
          from: `/memberships/checkout/${tierId}`,
          flash: {
            message:
              "Please log in or create an account before purchasing a membership.",
          },
        },
      });
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(`${api}/api/customer/memberships/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          membership_tier: tier.id, // "individual" | "family" | "supporter"
          source: "online",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.ok === false) {
        setError(data.error || "We couldn't complete your membership purchase.");
        return;
      }

      // Go to confirmation / receipt page with transaction data
      navigate("/memberships/confirmation", {
        state: {
          tier,
          txn: data,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
    } catch (e) {
      console.error("membership checkout error", e);
      setError("Something went wrong while processing your membership.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="container">
        <h1>Confirm your membership</h1>
        <p className="page-intro">
          Review your membership details and confirm your purchase. For this
          demo, payment details are simulated only.
        </p>

        <div className="grid-2">
          {/* Left: membership summary */}
          <div className="card">
            <h2>{tier.name} membership</h2>
            <p className="membership-tagline">{tier.tagline}</p>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              {tier.price}
            </div>
            <ul className="membership-list">
              {tier.perks.map((perk) => (
                <li key={perk}>{perk}</li>
              ))}
            </ul>

            <div style={{ marginTop: 16, fontSize: 14 }}>
              <strong>Membership period:</strong>
              <br />
              {displayStart} – {displayEnd}
            </div>
          </div>

          {/* Right: account + confirmation */}
          <div className="card">
            <h2>Account & billing</h2>
            <p style={{ fontSize: 14, color: "var(--muted)" }}>
              This membership will be linked to your H-Town Zoo customer
              account. For demo purposes, payment is simulated only.
            </p>

            <dl className="simple-def-list">
              <div>
                <dt>Name</dt>
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
            </dl>

            <div className="card" style={{ marginTop: 16 }}>
              <h3>Order summary</h3>
              <div className="summary-row">
                <span>{tier.name} membership</span>
                <span>
                  {/* hard-code cents to match backend plan prices */}
                  {tier.id === "individual" && toUSD(7500)}
                  {tier.id === "family" && toUSD(14500)}
                  {tier.id === "supporter" && toUSD(25000)}
                </span>
              </div>
              <div className="summary-row summary-total">
                <span>Total due today</span>
                <span>
                  {tier.id === "individual" && toUSD(7500)}
                  {tier.id === "family" && toUSD(14500)}
                  {tier.id === "supporter" && toUSD(25000)}
                </span>
              </div>
            </div>

            {error && (
              <p style={{ marginTop: 12, color: "var(--danger)" }}>{error}</p>
            )}

            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? "Processing..." : "Confirm membership purchase"}
              </button>
              <Link to="/memberships" className="btn btn-ghost">
                Back to memberships
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
