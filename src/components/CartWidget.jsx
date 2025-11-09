// src/components/CartWidget.jsx
import React from "react";
import { Link } from "react-router-dom";

// Helpers
const centsToUSD = (c) =>
  (Number(c || 0) / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

export default function CartWidget() {
  const [open, setOpen] = React.useState(false);
  const [count, setCount] = React.useState(0);
  const [lines, setLines] = React.useState([]);
  const [total, setTotal] = React.useState(0);

  const load = React.useCallback(() => {
    let qty = {};
    let types = [];
    try {
      qty = JSON.parse(sessionStorage.getItem("cartQty") || "{}");
    } catch {}
    try {
      types = JSON.parse(sessionStorage.getItem("ticketTypes") || "[]");
    } catch {}

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
        const nqty = Number(q);
        return {
          id: Number(id),
          name: meta.name,
          qty: nqty,
          price_cents: meta.price_cents,
          line_total_cents: nqty * meta.price_cents,
        };
      });

    const totalQty = built.reduce((s, l) => s + l.qty, 0);
    const totalCents = built.reduce((s, l) => s + l.line_total_cents, 0);

    setLines(built);
    setCount(totalQty);
    setTotal(totalCents);
  }, []);

  React.useEffect(() => {
    load();

    // Updates from our app (Tickets.jsx dispatches this after any change)
    const onCartChanged = () => load();
    window.addEventListener("cart:changed", onCartChanged);

    // Optional: patch same-tab sessionStorage.setItem so changes outside Tickets also refresh
    const origSetItem = sessionStorage.setItem.bind(sessionStorage);
    sessionStorage.setItem = function (key, value) {
      origSetItem(key, value);
      if (key === "cartQty" || key === "ticketTypes") load();
    };

    return () => {
      window.removeEventListener("cart:changed", onCartChanged);
      sessionStorage.setItem = origSetItem;
    };
  }, [load]);

  return (
    <div className="cart-wrapper">
      <button
        className="cart-btn"
        type="button"
        aria-label="Cart"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="cart-icon" aria-hidden>🛒</span>
        {count > 0 && <span className="cart-badge">{count}</span>}
      </button>

      {open && (
        <div className="cart-dropdown" role="dialog" aria-label="Cart">
          <div className="cart-dropdown-head">
            <div className="cart-title">Cart</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} type="button">
              Close
            </button>
          </div>

          {lines.length === 0 ? (
            <div className="muted">Your cart is empty.</div>
          ) : (
            <>
              <ul className="cart-list">
                {lines.map((l) => (
                  <li key={l.id} className="cart-line">
                    <div className="cart-line-name">{l.name}</div>
                    <div className="cart-line-meta">
                      <span className="cart-line-qty">x{l.qty}</span>
                      <span className="cart-line-price">{centsToUSD(l.line_total_cents)}</span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="cart-total-row">
                <span>Total</span>
                <strong>{centsToUSD(total)}</strong>
              </div>

              <div className="cart-actions">
                <Link
                  className="btn btn-primary btn-block"
                  to="/checkout"
                  onClick={() => setOpen(false)}
                >
                  Go to Checkout
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
