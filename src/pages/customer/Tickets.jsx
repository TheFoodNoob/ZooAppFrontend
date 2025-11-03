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
  const [qty, setQty] = React.useState({}); // { [ticket_type_id]: number }

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${api}/api/public/ticket-types`);
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        const data = await res.json();
        setTypes(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message || "Failed to load ticket types");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setCount = (id, n) =>
    setQty((p) => ({ ...p, [id]: Math.max(0, Math.min(99, Number(n) || 0)) }));

  const inc = (id) => setCount(id, (qty[id] || 0) + 1);
  const dec = (id) => setCount(id, (qty[id] || 0) - 1);
  const clearAll = () => setQty({});

  const items = types.map((t) => ({
    id: t.ticket_type_id ?? t.id,
    name: t.name,
    price_cents: t.price_cents,
    description: t.description || "",
    active: t.is_active !== 0,
  }));

  const totalCents = items.reduce(
    (sum, it) => sum + (qty[it.id] || 0) * Number(it.price_cents || 0),
    0
  );
  const totalQty = Object.values(qty).reduce((a, b) => a + (Number(b) || 0), 0);

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

            <aside className="ticket-summary">
              <div className="summary-row">
                <span className="summary-label">Items</span>
                <span className="summary-val">{totalQty}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Total</span>
                <span className="summary-val total">{fmtUSD(totalCents)}</span>
              </div>
              <div className="summary-actions">
                <button className="btn btn-ghost" onClick={clearAll} type="button">
                  Clear
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={totalCents <= 0}
                  onClick={() =>
                    alert(
                      `Demo only 🐾\n\nCart: ${JSON.stringify(qty)}\nTotal: ${fmtUSD(
                        totalCents
                      )}`
                    )
                  }
                >
                  Proceed
                </button>
              </div>
              <div className="muted sm">
                Public demo: cart/checkout are disabled. Staff tools are available
                after login.
              </div>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
