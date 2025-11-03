import React from "react";
import { api } from "../../api";

// $ cents → "$0.00"
const fmtUSD = (cents) =>
  (Number(cents || 0) / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

export default function Tickets() {
  const [types, setTypes] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [qty, setQty] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cartQty") || "{}");
    } catch {
      return {};
    }
  });

  // checkout form state
  const [buyerName, setBuyerName] = React.useState("");
  const [buyerEmail, setBuyerEmail] = React.useState("");
  const [visitDate, setVisitDate] = React.useState(""); // yyyy-mm-dd
  const [submitting, setSubmitting] = React.useState(false);
  const [receipt, setReceipt] = React.useState(null);
  const [submitErr, setSubmitErr] = React.useState("");

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${api}/api/public/ticket-types`);
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        const data = await res.json();

        // Persist types for the navbar cart widget to use (id/name/price)
        try {
          const simple = (Array.isArray(data) ? data : []).map((t) => ({
            id: t.ticket_type_id ?? t.id,
            ticket_type_id: t.ticket_type_id ?? t.id,
            name: t.name,
            price_cents: Number(t.price_cents || 0),
          }));
          localStorage.setItem("ticketTypes", JSON.stringify(simple));
          window.dispatchEvent(new Event("cart:changed"));
        } catch {}

        setTypes(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message || "Failed to load ticket types");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  React.useEffect(() => {
    localStorage.setItem("cartQty", JSON.stringify(qty));
    // Let the navbar cart know it should refresh
    window.dispatchEvent(new Event("cart:changed"));
  }, [qty]);

  const setCount = (id, n) =>
    setQty((p) => ({ ...p, [id]: Math.max(0, Math.min(99, Number(n) || 0)) }));
  const inc = (id) => setCount(id, (qty[id] || 0) + 1);
  const dec = (id) => setCount(id, (qty[id] || 0) - 1);
  const clearAll = () => {
    setQty({});
    try {
      localStorage.setItem("cartQty", "{}");
      window.dispatchEvent(new Event("cart:changed"));
    } catch {}
  };

  const items = (types || []).map((t) => ({
    id: t.ticket_type_id ?? t.id,
    name: t.name,
    price_cents: t.price_cents,
    description: t.description || "",
    active: t.is_active !== 0,
  }));

  const cartLines = items
    .filter((it) => (qty[it.id] || 0) > 0)
    .map((it) => ({
      ...it,
      quantity: qty[it.id] || 0,
      line_total_cents: (qty[it.id] || 0) * Number(it.price_cents || 0),
    }));

  const totalCents = cartLines.reduce((s, l) => s + l.line_total_cents, 0);
  const totalQty = cartLines.reduce((s, l) => s + l.quantity, 0);

  async function submitOrder() {
    setSubmitErr("");
    setReceipt(null);

    // basic client validation
    if (!buyerName.trim() || !buyerEmail.trim() || !visitDate) {
      setSubmitErr("Please enter your name, email, and visit date.");
      return;
    }
    if (totalCents <= 0) {
      setSubmitErr("Your cart is empty.");
      return;
    }

    const payload = {
      buyer_name: buyerName.trim(),
      buyer_email: buyerEmail.trim(),
      visit_date: visitDate, // yyyy-mm-dd
      items: cartLines.map((l) => ({
        ticket_type_id: l.id,
        quantity: l.quantity,
      })),
    };

    setSubmitting(true);
    try {
      const res = await fetch(`${api}/api/public/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Checkout failed (${res.status})`);
      setReceipt(data);
      clearAll();
    } catch (e) {
      setSubmitErr(e.message || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page tickets-page">
      <h1>Tickets</h1>

      <div className="panel tickets-panel">
        {loading && <div className="muted">Loading…</div>}
        {err && <div className="error">{err}</div>}

        {!loading && !err && items.length === 0 && (
          <div className="callout">No ticket types found.</div>
        )}

        {!loading && !err && items.length > 0 && (
          <>
            <div className="tickets-grid">
              {items.map((it) => (
                <article key={it.id} className="ticket-card">
                  <header className="ticket-head">
                    <h3 className="ticket-title">{it.name || "Admission"}</h3>
                    <div className="ticket-price">{fmtUSD(it.price_cents)}</div>
                  </header>

                  {it.description && (
                    <p className="ticket-desc">{it.description}</p>
                  )}

                  <div className="qty-row" aria-label={`Quantity for ${it.name}`}>
                    <button
                      className="btn btn-ghost qty-btn"
                      type="button"
                      onClick={() => dec(it.id)}
                      aria-label={`Decrease ${it.name} quantity`}
                    >
                      –
                    </button>

                    <input
                      className="qty-input"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      aria-label={`${it.name} quantity`}
                      value={qty[it.id] ?? 0}
                      onChange={(e) => setCount(it.id, e.target.value)}
                    />

                    <button
                      className="btn btn-ghost qty-btn"
                      type="button"
                      onClick={() => inc(it.id)}
                      aria-label={`Increase ${it.name} quantity`}
                    >
                      +
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Checkout / Cart summary */}
            <aside className="ticket-summary">
              <div className="summary-row">
                <span className="summary-label">Items</span>
                <span className="summary-val">{totalQty}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Total</span>
                <span className="summary-val total">{fmtUSD(totalCents)}</span>
              </div>

              {/* Checkout form */}
              <div className="checkout-form">
                <div className="row">
                  <label>
                    Name
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Jane Doe"
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="jane@example.com"
                    />
                  </label>
                </div>
                <div className="row">
                  <label>
                    Visit date
                    <input
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                    />
                  </label>
                </div>
              </div>

              {submitErr && <div className="error" style={{ marginTop: 8 }}>{submitErr}</div>}

              <div className="summary-actions">
                <button className="btn btn-ghost" onClick={clearAll} type="button">
                  Clear
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={totalCents <= 0 || submitting}
                  onClick={submitOrder}
                >
                  {submitting ? "Processing…" : "Checkout"}
                </button>
              </div>

              {receipt && (
                <div className="callout" style={{ marginTop: 10 }}>
                  <strong>Order created!</strong>
                  <div>Order #{receipt.order_id}</div>
                  <div>Total: {fmtUSD(receipt.total_cents)}</div>
                  <div>Visit date: {receipt.visit_date}</div>
                  <div className="muted sm">Status: {receipt.status}</div>
                </div>
              )}
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
