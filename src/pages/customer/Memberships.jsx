// src/pages/customer/Memberships.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export const MEMBERSHIP_TIERS = [
  {
    id: "individual",
    name: "Individual",
    price: "$75 / year",
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
    tagline: "For animal lovers who want to give more.",
    perks: [
      "All Family benefits",
      "Invites to select behind-the-scenes experiences",
      "Recognition in our annual supporter listing",
      "Exclusive conservation updates",
    ],
  },
];

export default function Memberships() {
  const { customerToken } = useAuth();
  const navigate = useNavigate();

  function handleJoin(tierId) {
    // If they're not logged in, send to login first
    if (!customerToken) {
      navigate("/login", {
        state: {
          from: "/memberships",
          flash: {
            message:
              "Please log in or create an account before purchasing a membership.",
          },
        },
      });
      return;
    }

    // Logged in → go to checkout/review page
    navigate(`/memberships/checkout/${tierId}`);
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
          <strong>Accounts & memberships</strong>
          <p style={{ marginTop: 6, fontSize: 14, color: "var(--muted)" }}>
            You can create a free H-Town Zoo <strong>customer account</strong>{" "}
            without a membership. To buy or manage a membership, you’ll need to
            be signed in to your customer account.
          </p>

          <div className="membership-links">
            <Link to="/login" className="btn btn-ghost">
              Customer Login
            </Link>
            <Link to="/register" className="btn btn-ghost">
              Create Account
            </Link>
          </div>
        </div>

        <div className="membership-grid">
          {MEMBERSHIP_TIERS.map((tier) => (
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
                  className="btn btn-primary"
                  onClick={() => handleJoin(tier.id)}
                >
                  Join with zoo account
                </button>
                <p className="membership-note">
                  Requires an H-Town Zoo customer account. Accounts and
                  memberships are separate, but you must have an account to add
                  a membership.
                </p>
              </div>
            </section>
          ))}
        </div>

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
