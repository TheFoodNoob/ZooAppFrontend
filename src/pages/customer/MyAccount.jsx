// src/pages/customer/MyAccount.jsx
import React from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
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

function formatTime(s) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
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

export default function MyAccount() {
  // ✅ use the customerToken from AuthContext (NOT the staff token)
  const { user, customerToken } = useAuth();
  const location = useLocation();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [account, setAccount] = React.useState(null);
  const [orders, setOrders] = React.useState([]);

  // ✅ Always call hooks; guard INSIDE the effect, not before it
  React.useEffect(() => {
    let cancelled = false;

    // If not logged in as a customer, just clear and stop
    if (!user || !customerToken) {
      setLoading(false);
      setAccount(null);
      setOrders([]);
      return;
    }

    async function load() {
      setLoading(true);
      setError("");

      const baseAccount = {
        name:
          user.full_name ||
          [user.first_name, user.last_name].filter(Boolean).join(" ") ||
          user.email,
        email: user.email,
        membership_tier: user.membership_tier || null,
        membership_status: user.membership_tier ? "active" : "none",
        member_since: user.member_since || null,
      };

      try {
        const [acctRes, ordersRes] = await Promise.allSettled([
          fetch(`${api}/api/customer/account`, {
            headers: { Authorization: `Bearer ${customerToken}` },
          }),
          fetch(`${api}/api/customer/orders`, {
            headers: { Authorization: `Bearer ${customerToken}` },
          }),
        ]);

        let acctData = null;
        let orderData = [];

        if (
          acctRes.status === "fulfilled" &&
          acctRes.value.ok
        ) {
          acctData = await acctRes.value.json().catch(() => null);
        }

        if (
          ordersRes.status === "fulfilled" &&
          ordersRes.value.ok
        ) {
          orderData = await ordersRes.value.json().catch(() => []);
        }

        if (!cancelled) {
          setAccount(acctData || baseAccount);
          setOrders(Array.isArray(orderData) ? orderData : []);
          setLoading(false);
        }
      } catch (e) {
        console.error("my account load error:", e);
        if (!cancelled) {
          setAccount(baseAccount);
          setError(
            "We couldn't load all of your account details. Some sections may be limited."
          );
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user, customerToken]);

  // ✅ GUARD AFTER ALL HOOKS ARE DECLARED
  if (!user || !customerToken) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  const membershipStatus = account?.membership_status || "none";
  const isMember = membershipStatus === "active";

  return (
    <div className="page">
      <div className="container">
        <h1>My Account</h1>

        {loading && (
          <p style={{ marginTop: 12 }}>Loading your account details…</p>
        )}

        {error && !loading && (
          <div className="error" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}

        {!loading && (
          <>
            {/* Account summary */}
            <div className="card" style={{ marginTop: 20 }}>
              <h2>Account overview</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  rowGap: 8,
                  columnGap: 24,
                  marginTop: 12,
                }}
              >
                <div>
                  <div className="label">Name</div>
                  <div>{account?.name || "—"}</div>
                </div>
                <div>
                  <div className="label">Email</div>
                  <div>{account?.email || "—"}</div>
                </div>
                <div>
                  <div className="label">Membership</div>
                  <div>
                    {isMember
                      ? account?.membership_tier || "Active member"
                      : "No membership"}
                  </div>
                </div>
                {isMember && account?.member_since && (
                  <div>
                    <div className="label">Member since</div>
                    <div>{formatDate(account.member_since)}</div>
                  </div>
                )}
              </div>

              {!isMember && (
                <p
                  style={{
                    marginTop: 12,
                    fontSize: 14,
                    color: "var(--muted)",
                  }}
                >
                  You currently have a customer account but no membership. Visit
                  our <Link to="/memberships">Memberships page</Link> to see
                  options and benefits.
                </p>
              )}
            </div>

            {/* Membership benefits block (only if member) */}
            {isMember && (
              <div className="card" style={{ marginTop: 20 }}>
                <h2>Your membership benefits</h2>
                <ul
                  style={{
                    marginTop: 8,
                    marginLeft: 18,
                    fontSize: 14,
                  }}
                >
                  <li>
                    Unlimited daytime admission for the duration of your
                    membership.
                  </li>
                  <li>
                    Exclusive discounts on tickets, food, and gift shop
                    purchases.
                  </li>
                  <li>
                    Early access to select member events and conservation
                    updates.
                  </li>
                  <li>
                    Priority communication from H-Town Zoo about upcoming
                    programs.
                  </li>
                </ul>
                <p
                  style={{
                    marginTop: 10,
                    fontSize: 13,
                    color: "var(--muted)",
                  }}
                >
                  For demo purposes, membership status is stored separately from
                  ticket orders, showing how long-term customer relationships
                  can be modeled in the database.
                </p>
              </div>
            )}

            {/* Orders history */}
            <div className="card" style={{ marginTop: 20 }}>
              <h2>Recent ticket orders</h2>
              {orders.length === 0 ? (
                <p style={{ marginTop: 8, fontSize: 14 }}>
                  We didn't find any ticket orders linked to your account yet.
                  When you purchase tickets, they’ll appear here.
                </p>
              ) : (
                <div style={{ marginTop: 10, overflowX: "auto" }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Placed on</th>
                        <th>Visit date</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.order_id}>
                          <td>{o.order_id}</td>
                          <td>
                            {formatDate(o.created_at || o.order_date)}{" "}
                            {formatTime(o.created_at || o.order_date)}
                          </td>
                          <td>{formatDate(o.visit_date)}</td>
                          <td>{formatUSD(o.total_cents)}</td>
                          <td>
                            {o.status
                              ? o.status.charAt(0).toUpperCase() +
                                o.status.slice(1)
                              : "—"}
                          </td>
                          <td>
                            <Link
                              to="/orders"
                              state={{ seedOrderId: o.order_id }}
                            >
                              View details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: "var(--muted)",
                }}
              >
                For your project demo, this section shows how customer accounts
                can be tied to ticket orders and visit history in the database.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
