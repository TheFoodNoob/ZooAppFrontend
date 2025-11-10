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
    const cutoff = new Date(v.getFullYear(), v.getMonth(), v.getDate() - 1, 23, 59, 59, 999);
    return new Date() <= cutoff;
  } catch {
    return false;
  }
}

/* ---------- component ---------- */
export default function OrderLookup() {
  // form
  const [orderId, setOrderId] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");

  // data / auth
  const [token, setToken] = React.useState("");
  const [order, setOrder] = React.useState(null);

  // ui state
  const [stage, setStage] = React.useState("lookup"); // lookup | verify | view
  const [err, setErr] = React.useState("");
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [working, setWorking] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false); // NEW: 2-click confirm

  /* ---- step 1: request code ---- */
  async function sendCode(e) {
    e?.preventDefault?.();
    setErr("");
    setNote("");
    setOrder(null);
    setToken("");
    setStage("lookup");
    setConfirming(false);

    if (!orderId || !email) return setErr("Please enter your order # and email.");

    setBusy(true);
    try {
      // Non-enumerating: always returns {ok:true, sent:true}
      const r = await fetch(`${api}/api/public/orders/find`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: Number(orderId), email: String(email).trim() }),
      });
      if (!r.ok) throw new Error("Lookup failed");
      setStage("verify");
      setNote("We sent a 6-digit verification code to your email. Enter it below to view your order.");
    } catch (e) {
      setErr(e.message || "Lookup failed");
    } finally {
      setBusy(false);
    }
  }

  /* ---- step 2: verify code -> get token -> fetch order ---- */
  async function verifyAndLoad(e) {
    e?.preventDefault?.();
    setErr("");
    setNote("");
    setConfirming(false);
    if (!/^\d{6}$/.test(code)) return setErr("Please enter the 6-digit code.");

    setBusy(true);
    try {
      // exchange code for short-lived token
      const r1 = await fetch(`${api}/api/public/orders/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: Number(orderId),
          email: String(email).trim(),
          code: String(code).trim(),
        }),
      });
      const j1 = await r1.json().catch(() => ({}));
      if (!r1.ok || !j1.token) throw new Error(j1.error || "Verification failed");

      setToken(j1.token);

      // fetch order summary
      const r2 = await fetch(`${api}/api/public/orders/${Number(orderId)}`, {
        headers: { Authorization: `Bearer ${j1.token}` },
      });
      const j2 = await r2.json().catch(() => ({}));
      if (!r2.ok) throw new Error(j2.error || "Failed to load order");

      setOrder(j2);
      setStage("view");
    } catch (e) {
      setErr(e.message || "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  /* ---- step 3: request refund (token-protected) ---- */
  async function requestRefund() {
    if (!order) return;
    if (!isRefundEligible(order.visit_date)) {
      return setNote("The return window has closed (refunds allowed until the day before your visit).");
    }

    // First click = arm confirmation, second click = execute
    if (!confirming) {
      setConfirming(true);
      setNote("Click “Confirm refund” to finalize your refund.");
      return;
    }

    setWorking(true);
    setErr("");
    setNote("");
    try {
      const r = await fetch(`${api}/api/public/orders/${order.order_id}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Refund failed");

      // reflect updated order state locally
      const updated = {
        ...order,
        status: "refunded",
        refund_cents: j?.refund?.refunded_cents ?? order.total_cents,
        refunded_cents: j?.refund?.refunded_cents ?? order.total_cents,
        refunded_at: j?.refund?.refunded_at ?? new Date().toISOString(),
      };
      setOrder(updated);
      setConfirming(false);
      setNote(`Refund processed for ${toUSD(updated.refund_cents ?? updated.total_cents)}. A confirmation email has been sent.`);
    } catch (e) {
      setErr(e.message || "Refund failed");
    } finally {
      setWorking(false);
    }
  }

  const refunded = String(order?.status || "").toLowerCase() === "refunded";
  const eligible = order ? isRefundEligible(order.visit_date) : false;

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

      {/* Stage: enter order/email */}
      {stage === "lookup" && (
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
            onSubmit={sendCode}
            className="two-col"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            {err && <div className="error span-2">{err}</div>}
            {note && <div className="note span-2">{note}</div>}

            <div>
              <label>Order #</label>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="e.g., 1234"
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

            <div className="span-2" style={{ display: "flex", justifyContent: "center" }}>
              <button className="btn btn-primary" type="submit" disabled={busy}>
                {busy ? "Sending…" : "Find order"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stage: enter OTP code */}
      {stage === "verify" && (
        <div
          className="panel"
          style={{
            width: "100%",
            maxWidth: 520,
            background: "#fff9e6",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
            marginBottom: 14,
          }}
        >
          {err && <div className="error" style={{ marginBottom: 10 }}>{err}</div>}
          {note && <div className="note" style={{ marginBottom: 10 }}>{note}</div>}

          <form onSubmit={verifyAndLoad} className="two-col" style={{ gap: 12 }}>
            <div className="span-2">
              <label>Verification code</label>
              <input
                inputMode="numeric"
                pattern="\d{6}"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                required
              />
            </div>
            <div className="span-2" style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button className="btn" type="button" onClick={sendCode} disabled={busy}>
                Resend
              </button>
              <button className="btn btn-primary" type="submit" disabled={busy}>
                {busy ? "Verifying…" : "Verify & view order"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stage: show order details + refund */}
      {stage === "view" && order && (
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
          {err && <div className="error" style={{ marginBottom: 10 }}>{err}</div>}
          {note && <div className="note" style={{ marginBottom: 10 }}>{note}</div>}

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
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {(order.items || []).map((it, i) => (
                    <li
                      key={i}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        padding: "6px 0",
                        borderBottom: "1px dashed #eadfae",
                      }}
                    >
                      <span>
                        {it.name} × {it.quantity}
                      </span>
                      <span>{toUSD(it.line_total_cents)}</span>
                    </li>
                  ))}
                </ul>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    fontWeight: 900,
                    marginTop: 6,
                  }}
                >
                  <span>Total</span>
                  <span>{toUSD(order.total_cents)}</span>
                </div>

                {refunded && (
                  <div style={{ marginTop: 6 }}>
                    <span style={{ fontWeight: 700 }}>Refunded:</span>{" "}
                    {toUSD(order.refund_cents ?? order.refunded_cents ?? order.total_cents)}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Actions</div>
                {refunded ? (
                  <div className="note">This order has already been refunded.</div>
                ) : eligible ? (
                  confirming ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="btn btn-primary" type="button" onClick={requestRefund} disabled={working}>
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
                        setNote("Click “Confirm refund” to finalize your refund.");
                      }}
                      disabled={working}
                    >
                      Request refund
                    </button>
                  )
                ) : (
                  <div className="note">
                    Returns are allowed until 11:59 PM the day before your visit.
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
