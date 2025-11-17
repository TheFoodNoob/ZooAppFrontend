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
const PLAN_LABELS = {
  individual: "Individual",
  family: "Family",
  supporter: "Zoo Supporter",
};

const PLAN_PRICES = {
  individual: 7500,  // $75
  family: 14500,     // $145
  supporter: 25000,  // $250
};

const INITIAL_ROWS = 5;

export default function MyAccount() {
  const { user, customerToken, setUser } = useAuth();
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

  // total membership savings (in cents) from the tiny endpoint
  const [membershipSavings, setMembershipSavings] = React.useState(0);

  const [upgradeConfirm, setUpgradeConfirm] = React.useState(null);
  // shape: { fromTier, toTier, priceCents }

  const [upgradeLoading, setUpgradeLoading] = React.useState(false);
  const [upgradeError, setUpgradeError] = React.useState("");

  // animated display value for savings badge
  const [displaySavings, setDisplaySavings] = React.useState(0);

  // cancel membership UI state
  const [cancelLoading, setCancelLoading] = React.useState(false);
  const [cancelError, setCancelError] = React.useState("");
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);

    // update information form
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [editError, setEditError] = React.useState("");
  const [editSuccess, setEditSuccess] = React.useState("");
  const [form, setForm] = React.useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  // --------------------------------------------------
  // Shared loader so we can call it after cancellation
  // --------------------------------------------------
  const loadAccountData = React.useCallback(async () => {
    const baseAccount = {
      name:
        user?.full_name ||
        [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
        user?.email,
      email: user?.email,
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      phone: user?.phone || "",
      membership_tier: user?.membership_tier || null,
      membership_status: user?.membership_tier ? "active" : "none",
      member_since: user?.member_since || null,
    };

    if (!user || !customerToken) {
      setLoading(false);
      setAccount(null);
      setOrders([]);
      setPosPurchases([]);
      setMembershipHistory([]);
      setDonations([]);
      setMembershipSavings(0);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [acctRes, ordersRes, historyRes, savingsRes] =
        await Promise.allSettled([
          fetch(`${api}/api/customer/account`, {
            headers: { Authorization: `Bearer ${customerToken}` },
          }),
          fetch(`${api}/api/customer/orders`, {
            headers: { Authorization: `Bearer ${customerToken}` },
          }),
          fetch(`${api}/api/customer/history`, {
            headers: { Authorization: `Bearer ${customerToken}` },
          }),
          // tiny endpoint that returns { total_savings_cents: number }
          fetch(`${api}/api/customer/membership-savings`, {
            headers: { Authorization: `Bearer ${customerToken}` },
          }),
        ]);

      let acctData = null;
      let orderData = [];
      let historyData = null;
      let savingsData = null;

      if (acctRes.status === "fulfilled" && acctRes.value.ok) {
        acctData = await acctRes.value.json().catch(() => null);
      }
      if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
        orderData = await ordersRes.value.json().catch(() => []);
      }
      if (historyRes.status === "fulfilled" && historyRes.value.ok) {
        historyData = await historyRes.value.json().catch(() => null);
      }
      if (savingsRes.status === "fulfilled" && savingsRes.value.ok) {
        savingsData = await savingsRes.value.json().catch(() => null);
      }

      const acc = acctData || baseAccount;
      setAccount(acc);

      // prime edit form from account data
      setForm({
        first_name: acc.first_name || "",
        last_name: acc.last_name || "",
        phone: acc.phone || "",
      });

      setOrders(Array.isArray(orderData) ? orderData : []);
      setPosPurchases(historyData?.pos || []);
      setMembershipHistory(historyData?.memberships || []);
      setDonations(historyData?.donations || []);
      setMembershipSavings(Number(savingsData?.total_savings_cents || 0));

      // reset visible-row limits whenever data is reloaded
      setTicketLimit(INITIAL_ROWS);
      setPosLimit(INITIAL_ROWS);
      setMembershipLimit(INITIAL_ROWS);
      setDonationLimit(INITIAL_ROWS);

      setLoading(false);
    } catch (e) {
      console.error("my account load error:", e);
      setAccount(baseAccount);
      setError(
        "We couldn't load all of your account details. Some sections may be limited."
      );
      setLoading(false);
    }
  }, [user, customerToken]);

  // initial load
  React.useEffect(() => {
    loadAccountData();
  }, [loadAccountData]);

  // animate the savings value whenever membershipSavings changes
  React.useEffect(() => {
    if (!membershipSavings || membershipSavings <= 0) {
      setDisplaySavings(0);
      return;
    }

    let frameId;
    const startValue = 0;
    const target = membershipSavings;
    const duration = 800; // ms
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic for smoother ending
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (target - startValue) * eased);
      setDisplaySavings(current);
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    }

    frameId = requestAnimationFrame(step);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [membershipSavings]);

  // Guard AFTER hooks
  if (!user || !customerToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const membershipStatus = account?.membership_status || "none";
  const isMember = membershipStatus === "active";

  // current membership cost (for progress bar) – use latest membership txn if present
  const currentMembershipTxn = membershipHistory[0] || null;
  const membershipCostCents =
    currentMembershipTxn?.total_cents ?? currentMembershipTxn?.price_cents ?? 0;

  let membershipProgressPct = null;
  if (membershipCostCents > 0 && membershipSavings > 0) {
    membershipProgressPct = Math.min(
      100,
      Math.round((membershipSavings / membershipCostCents) * 100)
    );
  }

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

  // --------------------------------------------------
  // Cancel membership handler
  // --------------------------------------------------
  async function handleCancelMembership() {
  setCancelError("");
  setCancelLoading(true);

  try {
    const res = await fetch(`${api}/api/customer/memberships/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${customerToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "Failed to cancel membership");
    }

    // On success: hide the confirmation and reload account data
    await loadAccountData();
    setShowCancelConfirm(false);
  } catch (e) {
    console.error("cancel membership error:", e);
    setCancelError(e.message || "Failed to cancel membership");
  } finally {
    setCancelLoading(false);
  }
}
 // -------- Update information handlers --------
  function startEditing() {
    if (!account) return;
    setEditError("");
    setEditSuccess("");
    setForm({
      first_name: account.first_name || "",
      last_name: account.last_name || "",
      phone: account.phone || "",
    });
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setEditError("");
    setEditSuccess("");
    if (account) {
      setForm({
        first_name: account.first_name || "",
        last_name: account.last_name || "",
        phone: account.phone || "",
      });
    }
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSaveChanges() {
    if (!customerToken || !account) return;

    const fn = form.first_name.trim();
    const ln = form.last_name.trim();

    if (!fn || !ln) {
      setEditError("First and last name are required.");
      return;
    }

    setSaving(true);
    setEditError("");
    setEditSuccess("");

    try {
      const res = await fetch(`${api}/api/customer/account`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          first_name: fn,
          last_name: ln,
          phone: form.phone.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to update account.");
      }

      const updated = data.customer || {};

      // update account state (keep email & membership fields)
      setAccount((prev) => ({
        ...prev,
        ...updated,
        name:
          `${updated.first_name || ""} ${
            updated.last_name || ""
          }`.trim() || prev?.name,
      }));

      // also patch AuthContext user if possible
      if (setUser && user) {
        setUser((prev) => ({
          ...prev,
          first_name: updated.first_name ?? prev.first_name,
          last_name: updated.last_name ?? prev.last_name,
          phone: updated.phone ?? prev.phone,
          email: prev.email, // keep same email
        }));
      }

      setEditSuccess("Your information has been updated.");
      setEditing(false);
    } catch (e) {
      console.error("update account error:", e);
      setEditError(e.message || "Failed to update account.");
    } finally {
      setSaving(false);
    }
  }

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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <h2 style={{ margin: 0 }}>Account overview</h2>

                {!editing && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={startEditing}
                  >
                    Update information
                  </button>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  rowGap: 8,
                  columnGap: 24,
                  marginTop: 12,
                }}
              >
                {/* Name (editable) */}
                <div>
                  <div className="label">Name</div>
                  {editing ? (
                    <div
                      className="two-col"
                      style={{ gap: 8, alignItems: "flex-start" }}
                    >
                      <input
                        name="first_name"
                        placeholder="First name"
                        value={form.first_name}
                        onChange={handleEditChange}
                      />
                      <input
                        name="last_name"
                        placeholder="Last name"
                        value={form.last_name}
                        onChange={handleEditChange}
                      />
                    </div>
                  ) : (
                    <div>{account?.name || "—"}</div>
                  )}
                </div>

                {/* Email (always read-only) */}
                <div>
                  <div className="label">Email</div>
                  <input
                    value={account?.email || "—"}
                    readOnly
                  />
                  <p
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: "var(--muted)",
                    }}
                  >
                    Email is tied to your customer account and can't be changed
                    here. Contact support if you need to update it.
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <div className="label">Phone (optional)</div>
                  {editing ? (
                    <input
                      name="phone"
                      placeholder="(555) 555-5555"
                      value={form.phone}
                      onChange={handleEditChange}
                    />
                  ) : (
                    <div>{account?.phone || "—"}</div>
                  )}
                </div>

                {/* Membership info (unchanged) */}
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

              {/* edit error/success + buttons */}
              {editing && (
                <div style={{ marginTop: 10 }}>
                  {editError && (
                    <div className="error" style={{ marginBottom: 8 }}>
                      {editError}
                    </div>
                  )}
                  {editSuccess && (
                    <div
                      className="note"
                      style={{ marginBottom: 8, color: "#1b5e20" }}
                    >
                      {editSuccess}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={cancelEditing}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSaveChanges}
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
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

                {/* Savings badge */}
                {membershipSavings > 0 && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: "18px 22px",
                      borderRadius: 18,
                      background:
                        "linear-gradient(135deg, rgba(35,115,66,0.12), rgba(35,115,66,0.03))",
                      textAlign: "center",
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                      border: "1px solid #e6c979", // thin gold border
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: ".09em",
                        color: "#237342",
                        marginBottom: 4,
                      }}
                    >
                      TOTAL SAVED WITH YOUR MEMBERSHIP
                    </span>
                    <span
                      style={{
                        fontSize: 32,
                        fontWeight: 800,
                        color: "#1b5c35",
                      }}
                    >
                      {formatUSD(displaySavings)}
                    </span>

                    {membershipProgressPct != null && (
                      <div
                        style={{
                          marginTop: 12,
                          width: "100%",
                          maxWidth: 360,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 12,
                            marginBottom: 4,
                            color: "#4f5b4f",
                          }}
                        >
                          <span>Membership savings progress</span>
                          <span>{membershipProgressPct}%</span>
                        </div>
                        <div
                          style={{
                            height: 8,
                            borderRadius: 999,
                            background: "#e6f2ea",
                            overflow: "hidden",
                            border: "1px solid rgba(0,0,0,0.06)",
                          }}
                        >
                          <div
                            style={{
                              width: `${membershipProgressPct}%`,
                              height: "100%",
                              borderRadius: 999,
                              background:
                                "linear-gradient(90deg, #2e7d32, #66bb6a)",
                              transition: "width 0.4s ease-out",
                            }}
                          />
                        </div>
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 11,
                            color: "#4f5b4f",
                          }}
                        >
                          Saving toward your{" "}
                          {(account?.membership_tier || "membership").toLowerCase()}{" "}
                          cost of {formatUSD(membershipCostCents || 0)}.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <ul
                  style={{
                    marginTop: 16,
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

                {/* primary cancel button -> shows inline confirmation */}
                <button
                  type="button"
                  className="btn"
                  style={{ marginTop: 16 }}
                  onClick={() => {
                    setCancelError("");
                    setShowCancelConfirm(true);
                  }}
                  disabled={cancelLoading}
                >
                  Cancel membership
                </button>

                <p
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "var(--muted)",
                  }}
                >
                  (Demo only – cancels future benefits but does not process refunds.)
                </p>

                {/* inline confirmation popup */}
                {showCancelConfirm && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "#fff6f0",
                      border: "1px solid #f0b68c",
                      maxWidth: 420,
                    }}
                  >
                    <div style={{ fontSize: 14, marginBottom: 8 }}>
                      Are you sure you want to cancel your membership? This demo does not
                      process refunds, but it will stop your future membership benefits.
                    </div>

                    {cancelError && (
                      <div className="error" style={{ marginTop: 4 }}>
                        {cancelError}
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        className="btn"
                        onClick={handleCancelMembership}
                        disabled={cancelLoading}
                      >
                        {cancelLoading ? "Cancelling…" : "Yes, cancel membership"}
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
                          setShowCancelConfirm(false);
                          setCancelError("");
                        }}
                        disabled={cancelLoading}
                      >
                        Keep membership
                      </button>
                    </div>
                  </div>
                )}
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
