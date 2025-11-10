// src/pages/customer/Checkout.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

const toUSD = (cents) =>
  (Number(cents || 0) / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

/* Helpers to read/write cart from sessionStorage (with localStorage fallback) */
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
function clearCartEverywhere() {
  try {
    sessionStorage.setItem("cartQty", "{}");
    localStorage.setItem("cartQty", "{}"); // safety if an older tab used localStorage
  } catch {}
  window.dispatchEvent(new Event("cart:changed"));
}

export default function Checkout() {
  const nav = useNavigate();

  // Build summary from storage
  const [lines, setLines] = React.useState([]);
  const [totalCents, setTotalCents] = React.useState(0);

  const [buyerName, setBuyerName] = React.useState("");
  const [buyerEmail, setBuyerEmail] = React.useState("");
  const [visitDate, setVisitDate] = React.useState("");

  // cosmetic “fake payment” fields (never sent to backend)
  const [cardNum, setCardNum] = React.useState("");
  const [cardExp, setCardExp] = React.useState("");
  const [cardCvc, setCardCvc] = React.useState("");

  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    const qty = readCartQty();
    const types = readTicketTypes();

    const tmap = new Map(
      (types || []).map((t) => [
        String(t.ticket_type_id ?? t.id),
        { name: t.name, price_cents: Number(t.price_cents || 0) },
      ])
    );

    const built = Object.entries(qty)
      .filter(([, q]) => Number(q) > 0)
      .map(([id, q]) => {
        const meta = tmap.get(String(id)) || { name: "Ticket", price_cents: 0 };
        const n = Number(q);
        return {
          ticket_type_id: Number(id),
          name: meta.name,
          qty: n,
          price_cents: meta.price_cents,
          line_total_cents: n * meta.price_cents,
        };
      });

    setLines(built);
    setTotalCents(built.reduce((s, l) => s + l.line_total_cents, 0));

    if (built.length === 0) nav("/tickets", { replace: true });
  }, [nav]);

  async function placeOrder() {
    setErr("");

    if (lines.length === 0) return setErr("Your cart is empty.");
    if (!buyerName.trim()) return setErr("Please enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(buyerEmail)) return setErr("Please enter a valid email.");
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
      buyer_email: buyerEmail,
      visit_date: visitDate,
      items: lines.map((l) => ({
        ticket_type_id: l.ticket_type_id,
        quantity: l.qty, // backend expects 'quantity'
      })),
    };

    setBusy(true);
    try {
      const r = await fetch(`${api}/api/public/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Checkout failed");

      // Clear cart everywhere & notify the cart widget
      clearCartEverywhere();

      // ✅ Include the magic token in the redirect so the receipt can load anywhere
      nav(`/order/${j.order_id}?t=${encodeURIComponent(j.lookup_token)}`, {
        state: j,
        replace: true,
      });
    } catch (e) {
      setErr(e.message || "Checkout failed");
    } finally {
      setBusy(false);
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
            {lines.map((l) => (
              <li
                key={l.ticket_type_id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  padding: "6px 0",
                  borderBottom: "1px dashed #eadfae",
                }}
              >
                <span>
                  {l.name} × {l.qty}
                </span>
                <span style={{ fontWeight: 800 }}>{toUSD(l.line_total_cents)}</span>
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
              fontWeight: 900,
            }}
          >
            <span>Total</span>
            <span>{toUSD(totalCents)}</span>
          </div>
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
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="jane@example.com"
              />
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
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Payment (Demo)</div>
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

          {err && <div className="error" style={{ marginTop: 10 }}>{err}</div>}

          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" type="button" onClick={() => nav("/tickets")}>
              Back
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={busy || lines.length === 0}
              onClick={placeOrder}
            >
              {busy ? "Placing…" : "Place order"}
            </button>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        Payment step: simulated. If you decide to accept real payments later, we can drop in
        Stripe Checkout and redirect back here on success.
      </div>
    </div>
  );
}
