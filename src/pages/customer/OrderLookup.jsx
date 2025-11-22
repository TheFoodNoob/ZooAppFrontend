// src/pages/customer/OrderLookup.jsx
import React from "react";
import { api } from "../../api";

/* ---------- helpers ---------- */
const toUSD = (cents) =>
  (Number(cents || 0) / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

function isRefundEligible(visitDate) {
  try {
    const v = new Date(visitDate);
    // Refunds allowed through 11:59:59 PM the day BEFORE the visit
    const cutoff = new Date(
      v.getFullYear(),
      v.getMonth(),
      v.getDate() - 1,
      23,
      59,
      59,
      999
    );
    return new Date() <= cutoff;
  } catch {
    return false;
  }
}

/* small helper to add a timeout to fetch */
async function fetchWithTimeout(url, opts = {}, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(t);
    return res;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

/* ---------- component ---------- */
export default function OrderLookup() {
  const [orderId, setOrderId] = React.useState("");
  const [email, setEmail] = React.useState("");

  const [order, setOrder] = React.useState(null);

  const [err, setErr] = React.useState("");
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [working, setWorking] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false); // 2-click confirm

  /* ---- step 1: lookup order directly ---- */
  async function lookup(e) {
    e?.preventDefault?.();
    setErr("");
    setNote("");
    setOrder(null);
    setConfirming(false);

    if (!orderId || !email) {
      return setErr("Please enter your order # and email.");
    }

    setBusy(true);
    try {
      const r = await fetchWithTimeout(`${api}/api/public/orders/find`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: Number(orderId),
          email: String(email).trim(),
        }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        throw new Error(j.error || "Lookup failed");
      }

      setOrder(j.order);

      const status = String(j.order.status || "").toLowerCase();
      if (status === "refunded") {
        setNote("This order has already been refunded.");
      } else if (j.order.refund_eligible) {
        setNote(
          "This order is eligible for a refund until the day before your visit."
        );
      } else {
        setNote(
          "The refund window has closed (refunds allowed until the day before your visit)."
        );
      }
    } catch (e) {
      setErr(
        e.name === "AbortError"
          ? "Network is slow. Please try again."
          : e.message || "Lookup failed"
      );
    } finally {
      setBusy(false);
    }
  }

  /* ---- step 2: request refund (order_id + email) ---- */
  async function requestRefund() {
    if (!order) return;
    if (!isRefundEligible(order.visit_date)) {
      return setNote(
        "The refund window has closed (refunds allowed until the day before your visit)."
      );
    }

    // First click = arm confirmation, second click = execute
    if (!confirming) {
      setConfirming(true);
      setNote('Click "Confirm refund" to finalize your refund.');
      return;
    }

    setWorking(true);
    setErr("");
    setNote("");
    try {
      const r = await fetchWithTimeout(`${api}/api/public/orders/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.order_id,
          email: String(email).trim(),
          reason: "customer self-service",
        }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        throw new Error(j.error || "Refund failed");
      }

      const refundedCents =
        j?.refund?.refunded_cents ??
        j?.refund?.refund_cents ??
        order.total_cents;

      const updated = {
        ...order,
        status: "refunded",
        refunded_cents: refundedCents,
        refund_cents: refundedCents,
        refunded_at: j?.refund?.refunded_at ?? new Date().toISOString(),
      };
      setOrder(updated);
      setConfirming(false);
      setNote(
        `Refund processed for ${toUSD(
          refundedCents
        )}. You should receive confirmation shortly.`
      );
    } catch (e) {
      setErr(
        e.name === "AbortError"
          ? "Network is slow. Please try again."
          : e.message || "Refund failed"
      );
    } finally {
      setWorking(false);
    }
  }

  const refunded = String(order?.status || "").toLowerCase() === "refunded";
  const eligible = order ? isRefundEligible(order.visit_date) : false;

  // For totals section
  const subtotalCents = Number(order?.subtotal_cents ?? order?.total_cents ?? 0);
  const discountCents = Number(order?.discount_cents || 0);
  const discountPct = order?.discount_pct;

  // Split items into tickets vs POS (food & gift)
  const ticketItems = order?.items || [];
  const posItems = Array.isArray(order?.pos_items) ? order.pos_items : [];
  const hasTickets = ticketItems.length > 0;
  const hasPos = posItems.length > 0;

  return (
    <div
      className="page"
      style={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <h1 style={{ marginBottom: 20 }}>Find my order</h1>

      {/* Lookup panel */}
      <div
        className="panel"
        style={{
          width: "100%",
          maxWidth: 680,
          background: "#fff9e6",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
          marginBottom: 14,
        }}
      >
        <form
          onSubmit={lookup}
          className="two-col"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          {err && <div className="error span-2">{err}</div>}
          {note && <div className="note span-2">{note}</div>}

          <div>
            <label>Order #</label>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={orderId}
              onChange={(e) =>
                setOrderId(e.target.value.replace(/[^\d]/g, ""))
              }
              placeholder="e.g., 38"
              required
            />
          </div>
          <div>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div
            className="span-2"
            style={{ display: "flex", justifyContent: "center" }}
          >
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "Looking up…" : "Find order"}
            </button>
          </div>
        </form>
      </div>

      {/* Order details + refund actions */}
      {order && (
        <div
          className="panel"
          style={{
            width: "100%",
            maxWidth: 720,
            background: "#fffef5",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                Order #{order.order_id} — {order.status}
              </div>
              <div style={{ opacity: 0.85 }}>
                Visit date: <strong>{order.visit_date}</strong>
              </div>
              <div style={{ opacity: 0.85 }}>
                Buyer: <strong>{order.buyer_name}</strong> · {order.buyer_email}
              </div>
            </div>

            <div className="two-col" style={{ gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Items</div>
                <ul
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                  }}
                >
                  {hasTickets && (
                    <>
                      <li
                        style={{
                          fontWeight: 700,
                          padding: "4px 0",
                          borderBottom: "1px solid #f0e6b8",
                          marginBottom: 2,
                        }}
                      >
                        Tickets
                      </li>
                      {ticketItems.map((it, i) => (
                        <li
                          key={`t-${i}`}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            padding: "4px 0",
                            borderBottom: "1px dashed #eadfae",
                          }}
                        >
                          <span>
                            {it.name} × {it.quantity}
                          </span>
                          <span>{toUSD(it.line_total_cents)}</span>
                        </li>
                      ))}
                    </>
                  )}

                  {hasPos && (
                    <>
                      <li
                        style={{
                          fontWeight: 700,
                          padding: "8px 0 4px",
                          borderBottom: "1px solid #f0e6b8",
                          marginTop: hasTickets ? 6 : 0,
                          marginBottom: 2,
                        }}
                      >
                        Food &amp; gift shop
                      </li>
                      {posItems.map((it, i) => (
                        <li
                          key={`p-${i}`}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            padding: "4px 0",
                            borderBottom: "1px dashed #eadfae",
                          }}
                        >
                          <span>
                            {it.name} × {it.quantity}
                          </span>
                          <span>{toUSD(it.line_total_cents)}</span>
                        </li>
                      ))}
                    </>
                  )}

                  {!hasTickets && !hasPos && (
                    <li style={{ padding: "4px 0", opacity: 0.7 }}>
                      No line items found for this order.
                    </li>
                  )}
                </ul>

                {/* Totals section with discount breakdown */}
                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 6,
                    borderTop: "1px solid #f0e6b8",
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                    }}
                  >
                    <span>Subtotal</span>
                    <span>{toUSD(subtotalCents)}</span>
                  </div>

                  {discountCents > 0 && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        fontSize: 14,
                        opacity: 0.9,
                      }}
                    >
                      <span>
                        Membership discount
                        {discountPct ? ` (${discountPct}%)` : ""}
                      </span>
                      <span>-{toUSD(discountCents)}</span>
                    </div>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      fontWeight: 900,
                      marginTop: 4,
                    }}
                  >
                    <span>Total paid</span>
                    <span>{toUSD(order.total_cents ?? subtotalCents)}</span>
                  </div>

                  {refunded && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        marginTop: 4,
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>Refunded</span>
                      <span>
                        {toUSD(
                          order.refund_cents ??
                            order.refunded_cents ??
                            order.total_cents
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Actions</div>
                {refunded ? (
                  <div className="note">
                    This order has already been refunded.
                  </div>
                ) : eligible ? (
                  confirming ? (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={requestRefund}
                        disabled={working}
                      >
                        {working ? "Processing…" : "Confirm refund"}
                      </button>
                      <button
                        className="btn"
                        type="button"
                        onClick={() => {
                          setConfirming(false);
                          setNote("");
                        }}
                        disabled={working}
                      >
                        Never mind
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn"
                      type="button"
                      onClick={() => {
                        setConfirming(true);
                        setNote(
                          'Click "Confirm refund" to finalize your refund.'
                        );
                      }}
                      disabled={working}
                    >
                      Request refund
                    </button>
                  )
                ) : (
                  <div className="note">
                    Returns are allowed until 11:59 PM the day before your
                    visit.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
