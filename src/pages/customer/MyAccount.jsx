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

const INITIAL_ROWS = 5;

export default function MyAccount() {
  const { user, customerToken } = useAuth();
  const location = useLocation();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [account, setAccount] = React.useState(null);
  const [orders, setOrders] = React.useState([]);

  const [posPurchases, setPosPurchases] = React.useState([]);
  const [membershipHistory, setMembershipHistory] = React.useState([]);
  const [donations, setDonations] = React.useState([]);

  // how many rows to show for each section
  const [ticketLimit, setTicketLimit] = React.useState(INITIAL_ROWS);
  const [posLimit, setPosLimit] = React.useState(INITIAL_ROWS);
  const [membershipLimit, setMembershipLimit] = React.useState(INITIAL_ROWS);
  const [donationLimit, setDonationLimit] = React.useState(INITIAL_ROWS);

  React.useEffect(() => {
    let cancelled = false;

    if (!user || !customerToken) {
      setLoading(false);
      setAccount(null);
      setOrders([]);
      setPosPurchases([]);
      setMembershipHistory([]);
      setDonations([]);
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
        const [acctRes, ordersRes, historyRes] = await Promise.allSettled([
          fetch(`${api}/api/customer/account`, {
            headers: { Authorization: `Bearer ${customerToken}` },
          }),
          fetch(`${api}/api/customer/orders`, {
            headers: { Authorization: `Bearer ${customerToken}` },
          }),
          fetch(`${api}/api/customer/history`, {
            headers: { Authorization: `Bearer ${customerToken}` },
          }),
        ]);

        let acctData = null;
        let orderData = [];
        let historyData = null;

        if (acctRes.status === "fulfilled" && acctRes.value.ok) {
          acctData = await acctRes.value.json().catch(() => null);
        }

        if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
          orderData = await ordersRes.value.json().catch(() => []);
        }

        if (historyRes.status === "fulfilled" && historyRes.value.ok) {
          historyData = await historyRes.value.json().catch(() => null);
        }

        if (!cancelled) {
          setAccount(acctData || baseAccount);
          setOrders(Array.isArray(orderData) ? orderData : []);

          setPosPurchases(historyData?.pos || []);
          setMembershipHistory(historyData?.memberships || []);
          setDonations(historyData?.donations || []);

          // reset visible-row limits whenever data is reloaded
          setTicketLimit(INITIAL_ROWS);
          setPosLimit(INITIAL_ROWS);
          setMembershipLimit(INITIAL_ROWS);
          setDonationLimit(INITIAL_ROWS);

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

  // Guard AFTER hooks
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

  // slice the visible rows per section
  const visibleTicketOrders = orders.slice(0, ticketLimit);
  const visiblePos = posPurchases.slice(0, posLimit);
  const visibleMemberships = membershipHistory.slice(0, membershipLimit);
  const visibleDonations = donations.slice(0, donationLimit);

  // simple inline style for the "View more / View less" buttons
  const viewMoreStyle = {
    marginTop: 8,
    padding: 0,
    border: "none",
    background: "none",
    color: "var(--link-color, #237342)",
    cursor: "pointer",
    fontSize: 14,
    textDecoration: "underline",
  };

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

            {/* Ticket orders history */}
            <div className="card" style={{ marginTop: 20 }}>
              <h2>Recent ticket orders</h2>
              {orders.length === 0 ? (
                <p style={{ marginTop: 8, fontSize: 14 }}>
                  We didn't find any ticket orders linked to your account yet.
                  When you purchase tickets, they’ll appear here.
                </p>
              ) : (
                <>
                  <div style={{ marginTop: 10, overflowX: "auto" }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Placed on</th>
                          <th>Visit date</th>
                          <th>Ticket total</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleTicketOrders.map((o) => {
                          // same discount logic as AccountOrderDetail / history
                          let ticketSubtotalCents;
                          let ticketDiscountCents;
                          let ticketFinalCents;

                          const discountPct = Number(o.discount_pct || 0);

                          if (o.ticket_subtotal_cents != null) {
                            ticketSubtotalCents = Number(
                              o.ticket_subtotal_cents || 0
                            );
                            ticketDiscountCents = Number(
                              o.ticket_discount_cents || 0
                            );
                            ticketFinalCents =
                              o.ticket_total_cents != null
                                ? Number(o.ticket_total_cents)
                                : ticketSubtotalCents - ticketDiscountCents;
                          } else {
                            ticketSubtotalCents =
                              o.subtotal_cents != null
                                ? Number(o.subtotal_cents)
                                : Number(o.total_cents || 0);

                            ticketDiscountCents = 0;
                            ticketFinalCents = ticketSubtotalCents;

                            if (discountPct > 0 && ticketSubtotalCents > 0) {
                              ticketDiscountCents = Math.round(
                                ticketSubtotalCents * (discountPct / 100)
                              );
                              if (ticketDiscountCents < 0)
                                ticketDiscountCents = 0;
                              if (ticketDiscountCents > ticketSubtotalCents) {
                                ticketDiscountCents = ticketSubtotalCents;
                              }
                              ticketFinalCents =
                                ticketSubtotalCents - ticketDiscountCents;
                            }
                          }

                          return (
                            <tr key={o.order_id}>
                              <td>{o.order_id}</td>
                              <td>
                                {formatDate(o.created_at || o.order_date)}{" "}
                                {formatTime(o.created_at || o.order_date)}
                              </td>
                              <td>{formatDate(o.visit_date)}</td>
                              <td>{formatUSD(ticketFinalCents)}</td>
                              <td>
                                {o.status
                                  ? o.status.charAt(0).toUpperCase() +
                                    o.status.slice(1)
                                  : "—"}
                              </td>
                              <td>
                                <Link
                                  to={`/account/orders/${o.order_id}`}
                                  state={{ order: o }}
                                >
                                  View details
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {orders.length > INITIAL_ROWS && (
                    <button
                      type="button"
                      style={viewMoreStyle}
                      onClick={() => {
                        if (ticketLimit >= orders.length) {
                          setTicketLimit(INITIAL_ROWS);
                        } else {
                          setTicketLimit(
                            Math.min(ticketLimit + INITIAL_ROWS, orders.length)
                          );
                        }
                      }}
                    >
                      {ticketLimit >= orders.length ? "View less" : "View more"}
                    </button>
                  )}
                </>
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

            {/* POS history */}
            <div className="card" style={{ marginTop: 20 }}>
              <h2>Gift shop &amp; food purchases</h2>
              {posPurchases.length === 0 ? (
                <p style={{ marginTop: 8, fontSize: 14 }}>
                  We didn&apos;t find any gift shop or food purchases linked to
                  your account yet. When you use your customer account at the
                  zoo, those purchases will appear here.
                </p>
              ) : (
                <>
                  <div style={{ marginTop: 10, overflowX: "auto" }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Receipt #</th>
                          <th>Date</th>
                          <th>Source</th>
                          <th>Membership at sale</th>
                          <th>Discount</th>
                          <th>Total</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {visiblePos.map((p) => (
                          <tr key={p.pos_sale_id}>
                            <td>{p.pos_sale_id}</td>
                            <td>{formatDate(p.created_at)}</td>
                            <td>{p.source}</td>
                            <td>{p.membership_tier_at_sale || "None"}</td>
                            <td>
                              {p.discount_pct
                                ? `${p.discount_pct}% (-${formatUSD(
                                    p.discount_cents
                                  )})`
                                : "—"}
                            </td>
                            <td>{formatUSD(p.total_cents)}</td>
                            <td>
                              <Link to={`/account/pos/${p.pos_sale_id}`}>
                                View details
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {posPurchases.length > INITIAL_ROWS && (
                    <button
                      type="button"
                      style={viewMoreStyle}
                      onClick={() => {
                        if (posLimit >= posPurchases.length) {
                          setPosLimit(INITIAL_ROWS);
                        } else {
                          setPosLimit(
                            Math.min(
                              posLimit + INITIAL_ROWS,
                              posPurchases.length
                            )
                          );
                        }
                      }}
                    >
                      {posLimit >= posPurchases.length
                        ? "View less"
                        : "View more"}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Membership history */}
            <div className="card" style={{ marginTop: 20 }}>
              <h2>Membership history</h2>
              {membershipHistory.length === 0 ? (
                <p style={{ marginTop: 8, fontSize: 14 }}>
                  No membership purchases found yet. When you buy or renew a
                  membership, the details will appear here.
                </p>
              ) : (
                <>
                  <div style={{ marginTop: 10, overflowX: "auto" }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Transaction #</th>
                          <th>Tier</th>
                          <th>Started</th>
                          <th>Ends</th>
                          <th>Discount</th>
                          <th>Amount</th>
                          <th>Source</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleMemberships.map((m) => (
                          <tr key={m.membership_txn_id}>
                            <td>{m.membership_txn_id}</td>
                            <td>{m.membership_tier}</td>
                            <td>{formatDate(m.started_on)}</td>
                            <td>{formatDate(m.ends_on)}</td>
                            <td>
                              {m.discount_pct ? `${m.discount_pct}%` : "—"}
                            </td>
                            <td>{formatUSD(m.total_cents)}</td>
                            <td>{m.source}</td>
                            <td>
                              <Link
                                to={`/account/memberships/${m.membership_txn_id}`}
                                state={{ membership: m }}
                              >
                                View details
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {membershipHistory.length > INITIAL_ROWS && (
                    <button
                      type="button"
                      style={viewMoreStyle}
                      onClick={() => {
                        if (membershipLimit >= membershipHistory.length) {
                          setMembershipLimit(INITIAL_ROWS);
                        } else {
                          setMembershipLimit(
                            Math.min(
                              membershipLimit + INITIAL_ROWS,
                              membershipHistory.length
                            )
                          );
                        }
                      }}
                    >
                      {membershipLimit >= membershipHistory.length
                        ? "View less"
                        : "View more"}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Optional: donations */}
            {donations.length > 0 && (
              <div className="card" style={{ marginTop: 20 }}>
                <h2>Donations</h2>
                <div style={{ marginTop: 10, overflowX: "auto" }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Donation #</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Tier</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleDonations.map((d) => (
                        <tr key={d.donation_id}>
                          <td>{d.donation_id}</td>
                          <td>{formatDate(d.created_at)}</td>
                          <td>{formatUSD(d.amount_cents)}</td>
                          <td>{d.tier_label || "—"}</td>
                          <td>
                            <Link
                              to={`/account/donations/${d.donation_id}`}
                              state={{ donation: d }}
                            >
                              View details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {donations.length > INITIAL_ROWS && (
                  <button
                    type="button"
                    style={viewMoreStyle}
                    onClick={() => {
                      if (donationLimit >= donations.length) {
                        setDonationLimit(INITIAL_ROWS);
                      } else {
                        setDonationLimit(
                          Math.min(
                            donationLimit + INITIAL_ROWS,
                            donations.length
                          )
                        );
                      }
                    }}
                  >
                    {donationLimit >= donations.length
                      ? "View less"
                      : "View more"}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
