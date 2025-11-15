// src/pages/customer/Checkout.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";

const toUSD = (cents) =>
  (Number(cents || 0) / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

/* Helpers to read/write cart from storage */
function readJSON(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function readCartQty() {
  const s = readJSON(sessionStorage, "cartQty", null);
  if (s && typeof s === "object") return s;
  return readJSON(localStorage, "cartQty", {});
}

function readTicketTypes() {
  const s = readJSON(sessionStorage, "ticketTypes", null);
  if (Array.isArray(s)) return s;
  return readJSON(localStorage, "ticketTypes", []);
}

// POS helpers
function readPosCart() {
  const s = readJSON(sessionStorage, "posCart", null);
  if (s && typeof s === "object") return s;
  return readJSON(localStorage, "posCart", {});
}

function readPosItems() {
  const s = readJSON(sessionStorage, "posItems", null);
  if (Array.isArray(s)) return s;
  return readJSON(localStorage, "posItems", []);
}

function clearCartEverywhere() {
  try {
    // tickets
    sessionStorage.setItem("cartQty", "{}");
    localStorage.setItem("cartQty", "{}");

    // POS
    sessionStorage.setItem("posCart", "{}");
    localStorage.setItem("posCart", "{}");
    sessionStorage.setItem("posItems", "[]");
    localStorage.setItem("posItems", "[]");
  } catch {}
  window.dispatchEvent(new Event("cart:changed"));
}

export default function Checkout() {
  const nav = useNavigate();
  const { customerToken, user } = useAuth() || {};

  const [lines, setLines] = React.useState([]);
  const [totalCents, setTotalCents] = React.useState(0);

  const [buyerName, setBuyerName] = React.useState("");
  // for guests only; when logged in we always use user.email as the effective email
  const [buyerEmail, setBuyerEmail] = React.useState("");
  const [visitDate, setVisitDate] = React.useState("");

  // membership preview coming back from the API
  const [quote, setQuote] = React.useState(null);

  // cosmetic “fake payment” fields (never sent to backend)
  const [cardNum, setCardNum] = React.useState("");
  const [cardExp, setCardExp] = React.useState("");
  const [cardCvc, setCardCvc] = React.useState("");

  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  // Build the visual summary once on mount (and when storage changes)
  React.useEffect(() => {
    const qty = readCartQty();
    const types = readTicketTypes();
    const posQty = readPosCart();
    const posItems = readPosItems();

    // ----- tickets -----
    const tmap = new Map(
      (types || []).map((t) => [
        String(t.ticket_type_id ?? t.id),
        { name: t.name, price_cents: Number(t.price_cents || 0) },
      ])
    );

    const ticketLines = Object.entries(qty)
      .filter(([, q]) => Number(q) > 0)
      .map(([id, q]) => {
        const meta = tmap.get(String(id)) || { name: "Ticket", price_cents: 0 };
        const n = Number(q);
        return {
          kind: "ticket",
          ticket_type_id: Number(id),
          name: meta.name,
          qty: n,
          price_cents: meta.price_cents,
          line_total_cents: n * meta.price_cents,
        };
      });

    // ----- POS (food + gift) -----
    const pmap = new Map(
      (posItems || []).map((p) => [
        String(p.pos_item_id ?? p.id),
        { name: p.name, price_cents: Number(p.price_cents || 0) },
      ])
    );

    const posLines = Object.entries(posQty)
      .filter(([, q]) => Number(q) > 0)
      .map(([id, q]) => {
        const meta = pmap.get(String(id)) || { name: "Item", price_cents: 0 };
        const n = Number(q);
        return {
          kind: "pos",
          pos_item_id: Number(id),
          name: meta.name,
          qty: n,
          price_cents: meta.price_cents,
          line_total_cents: n * meta.price_cents,
        };
      });

    const allLines = [...ticketLines, ...posLines];

    setLines(allLines);
    setTotalCents(allLines.reduce((s, l) => s + l.line_total_cents, 0));

    if (allLines.length === 0) {
      nav("/tickets", { replace: true });
    }
  }, [nav]);

  // Prefill name/email from logged-in customer
  React.useEffect(() => {
    if (user && user.role === "customer") {
      // lock email to the customer account; we won't let this be overridden
      if (user.email) {
        setBuyerEmail((prev) => prev || user.email || "");
      }
      const fullName = `${user.first_name || ""} ${
        user.last_name || ""
      }`.trim();
      if (fullName) {
        setBuyerName((prev) => prev || fullName);
      }
    }
  }, [user]);

  // Preview membership discount once we have email + visit date + items
  React.useEffect(() => {
    async function fetchQuote() {
      if (!lines.length) {
        setQuote(null);
        return;
      }

      const effectiveEmail = user?.email || buyerEmail;

      if (!/^\S+@\S+\.\S+$/.test(effectiveEmail)) {
        setQuote(null);
        return;
      }

      try {
        const payload = {
          buyer_name: buyerName || "Guest",
          buyer_email: effectiveEmail,
          visit_date: visitDate,
          items: lines
            .filter((l) => l.kind === "ticket")
            .map((l) => ({
              ticket_type_id: l.ticket_type_id,
              quantity: l.qty,
            })),
          pos_items: lines
            .filter((l) => l.kind === "pos")
            .map((l) => ({
              pos_item_id: l.pos_item_id,
              quantity: l.qty,
            })),
          preview: true,
        };

        const headers = { "Content-Type": "application/json" };
        if (customerToken) {
          headers.Authorization = `Bearer ${customerToken}`;
        }

        const r = await fetch(`${api}/api/public/checkout`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) {
          setQuote(null);
          return;
        }

        // server returns { ok, ...totals } in preview mode OR { ok, order, ... } for real
        setQuote(j.order || j);
      } catch (e) {
        console.error("checkout preview error:", e);
        setQuote(null);
      }
    }

    fetchQuote();
  }, [buyerName, buyerEmail, visitDate, lines, user, customerToken]);

  async function placeOrder() {
    setErr("");

    // Re-read the cart directly from storage so we never send an empty cart
    const qty = readCartQty();
    const types = readTicketTypes();
    const posQty = readPosCart();
    const posItemsMeta = readPosItems();

    const tmap = new Map(
      (types || []).map((t) => [
        String(t.ticket_type_id ?? t.id),
        { name: t.name, price_cents: Number(t.price_cents || 0) },
      ])
    );
    const pmap = new Map(
      (posItemsMeta || []).map((p) => [
        String(p.pos_item_id ?? p.id),
        { name: p.name, price_cents: Number(p.price_cents || 0) },
      ])
    );

    const ticketItems = Object.entries(qty)
      .filter(([, q]) => Number(q) > 0)
      .map(([id, q]) => {
        const meta = tmap.get(String(id)) || { price_cents: 0 };
        const n = Number(q);
        return {
          ticket_type_id: Number(id),
          quantity: n,
          price_cents: meta.price_cents,
        };
      });

    const posItems = Object.entries(posQty)
      .filter(([, q]) => Number(q) > 0)
      .map(([id, q]) => {
        const meta = pmap.get(String(id)) || { price_cents: 0 };
        const n = Number(q);
        return {
          pos_item_id: Number(id),
          quantity: n,
          price_cents: meta.price_cents,
        };
      });

    if (ticketItems.length === 0 && posItems.length === 0) {
      return setErr("Your cart is empty.");
    }

    if (!buyerName.trim()) return setErr("Please enter your name.");

    const effectiveEmail = user?.email || buyerEmail;

    if (!/^\S+@\S+\.\S+$/.test(effectiveEmail))
      return setErr("Please enter a valid email.");

    if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate))
      return setErr("Please choose a visit date (YYYY-MM-DD).");

    // Optional demo validation for the fake payment fields
    if (cardNum && !/^\d{12,19}$/.test(cardNum.replace(/[^\d]/g, "")))
      return setErr("Card number looks invalid (demo field).");
    if (cardExp && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExp))
      return setErr("Expiry should be MM/YY (demo field).");
    if (cardCvc && !/^\d{3,4}$/.test(cardCvc))
      return setErr("CVC should be 3–4 digits (demo field).");

    const payload = {
      buyer_name: buyerName,
      buyer_email: effectiveEmail, // always account email when logged in
      visit_date: visitDate,
      items: ticketItems.map((t) => ({
        ticket_type_id: t.ticket_type_id,
        quantity: t.quantity,
      })),
      pos_items: posItems.map((p) => ({
        pos_item_id: p.pos_item_id,
        quantity: p.quantity,
      })),
    };

    setBusy(true);
    try {
      const headers = { "Content-Type": "application/json" };
      if (customerToken) {
        headers.Authorization = `Bearer ${customerToken}`;
      }

      const r = await fetch(`${api}/api/public/checkout`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      let j = {};
      try {
        j = await r.json();
      } catch {
        j = {};
      }

      if (!r.ok) {
        throw new Error(j.error || "Checkout failed");
      }

      clearCartEverywhere();

      nav(`/order/${j.order_id}?t=${encodeURIComponent(j.lookup_token)}`, {
        state: {
          order: j.order || null,
          magic: j.lookup_token || "",
        },
        replace: true,
      });
    } catch (e) {
      setErr(e.message || "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  const effectiveEmailForInput = user?.email || buyerEmail;

  // ---- Membership savings breakdown for the summary ----
  const originalSubtotal = totalCents; // full cart (tickets + POS) before membership

  const subtotalAfterFree =
    typeof quote?.subtotal_cents === "number"
      ? quote.subtotal_cents
      : originalSubtotal;

  const percentDiscountCents =
    typeof quote?.discount_cents === "number" ? quote.discount_cents : 0;

  const finalTotalCents =
    typeof quote?.total_cents === "number"
      ? quote.total_cents
      : originalSubtotal;

  // Free admissions = difference between original subtotal and subtotal after free tickets
  const freeAdmissionCents = Math.max(
    0,
    originalSubtotal - subtotalAfterFree
  );

  const memberSavingsCents = Math.max(
    0,
    freeAdmissionCents + percentDiscountCents
  );

  const membershipPercent =
    typeof quote?.discount_pct === "number" ? quote.discount_pct : null;

  const membershipTier =
    quote?.membership_tier_at_sale ||
    quote?.membership_free?.membership_tier ||
    null;

  let freeAdmissionLabel = null;
  if (freeAdmissionCents > 0 && membershipTier) {
    const t = membershipTier.toLowerCase();
    if (t.includes("individual")) {
      freeAdmissionLabel = "Member adult ticket included";
    } else if (t.includes("family") || t.includes("supporter")) {
      freeAdmissionLabel = "Member family admission included";
    } else {
      freeAdmissionLabel = "Member admission included";
    }
  }

  return (
    <div className="page">
      <h1>Checkout</h1>

      <div className="two-col" style={{ gap: 12 }}>
        {/* Summary */}
        <div className="panel" style={{ background: "#fff8e1" }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Summary</div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {lines.map((l, idx) => (
              <li
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  padding: "6px 0",
                  borderBottom: "1px dashed #eadfae",
                }}
              >
                <span>
                  {l.name} × {l.qty}
                  {l.kind === "pos" && (
                    <span
                      style={{ marginLeft: 6, fontSize: 12, opacity: 0.7 }}
                    >
                      (food/gift)
                    </span>
                  )}
                </span>
                <span style={{ fontWeight: 800 }}>
                  {toUSD(l.line_total_cents)}
                </span>
              </li>
            ))}
          </ul>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              paddingTop: 8,
              marginTop: 6,
              borderTop: "1px solid #eadfae",
              fontWeight: 700,
              rowGap: 4,
            }}
          >
            {/* Subtotal before membership savings */}
            <span>Subtotal</span>
            <span>{toUSD(originalSubtotal)}</span>

            {/* Membership free admissions */}
            {freeAdmissionCents > 0 && freeAdmissionLabel && (
              <>
                <span>{freeAdmissionLabel}</span>
                <span>-{toUSD(freeAdmissionCents)}</span>
              </>
            )}

            {/* Membership % discount */}
            {percentDiscountCents > 0 && (
              <>
                <span>
                  Membership discount
                  {membershipPercent != null ? ` (${membershipPercent}%)` : ""}
                </span>
                <span>-{toUSD(percentDiscountCents)}</span>
              </>
            )}

            {/* Final estimated total */}
            <span style={{ marginTop: 4, fontWeight: 900 }}>
              Estimated total
            </span>
            <span style={{ marginTop: 4, fontWeight: 900 }}>
              {toUSD(finalTotalCents)}
            </span>
          </div>

          {quote && memberSavingsCents > 0 ? (
            <p style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>
              As a member, you save{" "}
              <strong>{toUSD(memberSavingsCents)}</strong> on this order.
            </p>
          ) : (
            <p style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>
              Any eligible membership discounts for your account will be applied
              when your order is processed and will appear on your receipt.
            </p>
          )}
        </div>

        {/* Your info */}
        <div className="panel" style={{ background: "#fff8e1" }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Your info</div>
          <div className="two-col" style={{ gap: 8 }}>
            <div>
              <label>Name</label>
              <input
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label>Email</label>
              <input
                value={effectiveEmailForInput}
                onChange={
                  user ? undefined : (e) => setBuyerEmail(e.target.value)
                }
                readOnly={!!user}
                placeholder="jane@example.com"
              />
              {user && (
                <p
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    color: "var(--muted)",
                  }}
                >
                  This email is tied to your customer account. Orders placed
                  while logged in will always be linked to{" "}
                  <strong>{user.email}</strong>.
                </p>
              )}
            </div>
            <div className="span-2">
              <label>Visit date</label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </div>

            {/* Demo payment block */}
            <div className="span-2" style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                Payment (Demo)
              </div>
              <div className="two-col" style={{ gap: 8 }}>
                <div className="span-2">
                  <label>Card number</label>
                  <input
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="4242 4242 4242 4242"
                    value={cardNum}
                    onChange={(e) => setCardNum(e.target.value)}
                  />
                </div>
                <div>
                  <label>Expiry (MM/YY)</label>
                  <input
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="12/28"
                    value={cardExp}
                    onChange={(e) => setCardExp(e.target.value)}
                  />
                </div>
                <div>
                  <label>CVC</label>
                  <input
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                  />
                </div>
              </div>
              <div className="note" style={{ marginTop: 6 }}>
                Demo only — these values are not sent to the server.
              </div>
            </div>
          </div>

          {err && (
            <div className="error" style={{ marginTop: 10 }}>
              {err}
            </div>
          )}

          <div className="row" style={{ marginTop: 12 }}>
            <button
              className="btn"
              type="button"
              onClick={() => nav("/tickets")}
            >
              Back
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={busy}
              onClick={placeOrder}
            >
              {busy ? "Placing…" : "Place order"}
            </button>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        Tickets, food, and gift shop items are processed together in this online
        checkout. Your email receipt includes a breakdown of everything in your
        order, including any membership discounts.
      </div>
    </div>
  );
}
