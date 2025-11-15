// src/pages/customer/Memberships.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../api";

// NOTE: exported so MembershipCheckout.jsx can import it
export const MEMBERSHIP_TIERS = [
  {
    id: "individual",
    name: "Individual",
    price: "$75 / year",
    price_cents: 7500,
    tagline: "Best for frequent solo visitors.",
    perks: [
      "Unlimited daytime admission for 1 adult",
      "10% off food and gift shop purchases",
      "Member-only email offers and previews",
      "Discounts on select special events",
    ],
  },
  {
    id: "family",
    name: "Family",
    price: "$145 / year",
    price_cents: 14500,
    tagline: "Perfect for parents and kids.",
    perks: [
      "Unlimited daytime admission for 2 adults + up to 4 children",
      "10% off food, gift shop, and stroller rentals",
      "Early access to select member mornings",
      "Discounts on camps and birthday packages",
    ],
  },
  {
    id: "supporter",
    name: "Zoo Supporter",
    price: "$250 / year",
    price_cents: 25000,
    tagline: "For animal lovers who want to give more.",
    perks: [
      "All Family benefits",
      "Invites to select behind-the-scenes experiences",
      "Recognition in our annual supporter listing",
      "Exclusive conservation updates",
    ],
  },
];

// simple “ranking” to know what counts as an upgrade
const TIER_ORDER = {
  individual: 1,
  family: 2,
  supporter: 3,
};

function getTierLabel(id) {
  const t = MEMBERSHIP_TIERS.find((x) => x.id === id);
  return t ? t.name : id;
}

export default function Memberships() {
  const { customerToken, user } = useAuth();
  const navigate = useNavigate();

  const [account, setAccount] = React.useState(null);
  const [loadingAccount, setLoadingAccount] = React.useState(false);

  // upgrade confirmation UI
  const [upgradeConfirm, setUpgradeConfirm] = React.useState(null);
  // shape: { fromLabel, toLabel, priceText, toTier }
  const [upgradeLoading, setUpgradeLoading] = React.useState(false);
  const [upgradeError, setUpgradeError] = React.useState("");

  // Load /api/customer/account so we know current membership tier
  React.useEffect(() => {
    let cancelled = false;

    if (!customerToken) {
      setAccount(null);
      return;
    }

    (async () => {
      try {
        setLoadingAccount(true);
        const r = await fetch(`${api}/api/customer/account`, {
          headers: { Authorization: `Bearer ${customerToken}` },
        });
        if (!r.ok) throw new Error("account load failed");
        const data = await r.json().catch(() => null);
        if (!cancelled) setAccount(data);
      } catch {
        if (!cancelled) setAccount(null);
      } finally {
        if (!cancelled) setLoadingAccount(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customerToken]);

  const currentTier = account?.membership_tier || null;
  const membershipStatus = account?.membership_status || "none";
  const isMember = membershipStatus === "active" && !!currentTier;

  const displayName =
    (user &&
      `${user.first_name || ""} ${user.last_name || ""}`.trim()) ||
    user?.email ||
    "your customer account";

  function requireLogin(redirectTo) {
    navigate("/login", {
      state: {
        from: redirectTo || "/memberships",
        flash: {
          message:
            "Please log in or create an account before purchasing a membership.",
        },
      },
    });
  }

  function handleJoin(tierId) {
    if (!customerToken) {
      requireLogin(`/memberships`);
      return;
    }
    // New membership purchase (no current membership)
    navigate(`/memberships/checkout/${tierId}`);
  }

  // Open inline confirmation for an upgrade
  function handleUpgradeClick(tier) {
    if (!customerToken) {
      requireLogin("/memberships");
      return;
    }

    if (!currentTier) return;

    const fromLabel = getTierLabel(currentTier);
    const toLabel = getTierLabel(tier);
    const plan = MEMBERSHIP_TIERS.find((t) => t.id === tier);

    setUpgradeError("");
    setUpgradeConfirm({
      fromLabel,
      toLabel,
      priceText: plan?.price || "",
      toTier: tier,
    });
  }

  // Confirm upgrade: call backend and then go to My Account
  async function handleConfirmUpgrade() {
    if (!upgradeConfirm || !customerToken) return;

    setUpgradeLoading(true);
    setUpgradeError("");

    try {
      const r = await fetch(`${api}/api/customer/memberships/upgrade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ membership_tier: upgradeConfirm.toTier }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.error || j.ok === false) {
        throw new Error(
          j.error || "Membership upgrade failed. Please try again."
        );
      }

      // On success, send them to My Account so everything refreshes
      navigate("/account");
    } catch (e) {
      console.error("upgrade error", e);
      setUpgradeError(
        e.message || "Membership upgrade failed. Please try again."
      );
    } finally {
      setUpgradeLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="container">
        <h1>Zoo Memberships</h1>
        <p className="page-intro">
          Turn your zoo visits into year-round adventures. Memberships include
          unlimited daytime admission plus extra perks and support our animals
          and conservation programs.
        </p>

        <div className="card" style={{ marginTop: 20 }}>
          <strong>Accounts &amp; memberships</strong>

          {!customerToken ? (
            <p style={{ marginTop: 6, fontSize: 14, color: "var(--muted)" }}>
              You can create a free H-Town Zoo{" "}
              <strong>customer account</strong> without a membership. To buy or
              manage a membership, you’ll need to be signed in to your customer
              account.
            </p>
          ) : (
            <p style={{ marginTop: 6, fontSize: 14, color: "var(--muted)" }}>
              You’re signed in to your H-Town Zoo{" "}
              <strong>customer account</strong> as{" "}
              <strong>{displayName}</strong>.{" "}
              {loadingAccount ? (
                <>Loading your membership details…</>
              ) : isMember ? (
                <>
                  Your current membership tier is{" "}
                  <strong>{getTierLabel(currentTier)}</strong>. Choose a higher
                  tier below to upgrade, or visit <strong>My Account</strong> to
                  review your history.
                </>
              ) : (
                <>
                  You don’t have an active membership yet. Choose a tier below
                  to become a member.
                </>
              )}
            </p>
          )}

          {!customerToken && (
            <div className="membership-links">
              <Link to="/login" className="btn btn-ghost">
                Customer Login
              </Link>
              <Link to="/register" className="btn btn-ghost">
                Create Account
              </Link>
            </div>
          )}
        </div>

        <div className="membership-grid">
          {MEMBERSHIP_TIERS.map((tier) => {
            const order = TIER_ORDER[tier.id];
            const currentOrder = TIER_ORDER[currentTier] || 0;

            const isCurrent = isMember && tier.id === currentTier;
            const isUpgradeTarget =
              isMember && currentTier && order > currentOrder;
            const isDowngrade =
              isMember && currentTier && order < currentOrder;

            let ctaLabel = "Join with zoo account";
            let ctaHandler = () => handleJoin(tier.id);
            let ctaDisabled = false;
            let helperText =
              "Requires an H-Town Zoo customer account. Accounts and memberships are separate, but you must have an account to add a membership.";

            if (isMember) {
              if (isCurrent) {
                ctaLabel = "Current plan";
                ctaHandler = () => {};
                ctaDisabled = true;
                helperText = "This is your current membership tier.";
              } else if (isUpgradeTarget) {
                ctaLabel = `Upgrade to ${tier.name}`;
                ctaHandler = () => handleUpgradeClick(tier.id);
                helperText =
                  "Upgrading will start a new one-year membership at this tier.";
              } else if (isDowngrade) {
                ctaLabel = `Downgrade to ${tier.name}`;
                ctaHandler = () => {};
                ctaDisabled = true;
                helperText =
                  "Downgrades aren’t available in this demo. Upgrades only.";
              }
            }

            return (
              <section key={tier.id} className="card membership-card">
                <div className="membership-head">
                  <h2>{tier.name}</h2>
                  <div className="membership-price">{tier.price}</div>
                </div>

                <p className="membership-tagline">{tier.tagline}</p>

                <ul className="membership-list">
                  {tier.perks.map((perk) => (
                    <li key={perk}>{perk}</li>
                  ))}
                </ul>

                <div className="membership-cta">
                  <button
                    type="button"
                    className={`btn ${
                      isCurrent ? "btn-secondary" : "btn-primary"
                    }`}
                    onClick={ctaHandler}
                    disabled={ctaDisabled}
                  >
                    {ctaLabel}
                  </button>
                  <p className="membership-note">{helperText}</p>
                </div>
              </section>
            );
          })}
        </div>

        {/* Inline upgrade confirmation panel */}
        {upgradeConfirm && (
          <div
            className="card"
            style={{
              marginTop: 20,
              padding: "16px 18px",
              borderRadius: 14,
              background: "#fff6f0",
              border: "1px solid #f0b68c",
              maxWidth: 560,
            }}
          >
            <div
              style={{
                fontSize: 15,
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Upgrade your membership from {upgradeConfirm.fromLabel} to{" "}
              {upgradeConfirm.toLabel}?
            </div>
            <div
              style={{
                fontSize: 14,
                marginBottom: 8,
                color: "#5b4633",
              }}
            >
              For this demo, you will be charged the full{" "}
              {upgradeConfirm.priceText} for a new 1-year term starting today.
            </div>

            {upgradeError && (
              <div className="error" style={{ marginBottom: 8 }}>
                {upgradeError}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 4,
              }}
            >
              <button
                type="button"
                className="btn"
                onClick={handleConfirmUpgrade}
                disabled={upgradeLoading}
              >
                {upgradeLoading ? "Upgrading…" : "Yes, upgrade membership"}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  background: "transparent",
                  color: "var(--link-color, #237342)",
                  border: "none",
                  textDecoration: "underline",
                  paddingInline: 0,
                }}
                onClick={() => {
                  setUpgradeConfirm(null);
                  setUpgradeError("");
                }}
                disabled={upgradeLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="card" style={{ marginTop: 24 }}>
          <h2>How memberships work</h2>
          <ol className="membership-steps">
            <li>Create or log in to your H-Town Zoo customer account.</li>
            <li>Choose the membership tier that fits your household.</li>
            <li>
              Use your membership when you purchase tickets to unlock your
              discounts and perks.
            </li>
          </ol>
          <p style={{ marginTop: 10, fontSize: 14, color: "var(--muted)" }}>
            For your database demo, memberships show how we can store long-term
            customer relationships separately from one-time ticket orders.
          </p>
        </div>
      </div>
    </div>
  );
}
