// src/components/PosCartSummary.jsx
import React from "react";
import { Link } from "react-router-dom";

const centsToUSD = (cents) =>
  (Number(cents || 0) / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

/**
 * Shared summary card for POS (food + gift shop) items.
 *
 * Props:
 *  - label: heading text (e.g. "Your food cart")
 *  - filterCategory: "food" | "giftshop" | undefined
 *  - emptyMessage: text to show when nothing in this category
 */
export default function PosCartSummary({
  label = "Your cart",
  filterCategory,
  emptyMessage,
}) {
  const [lines, setLines] = React.useState([]);
  const [totalCents, setTotalCents] = React.useState(0);

  const load = React.useCallback(() => {
    let qtyMap = {};
    let meta = [];

    try {
      qtyMap = JSON.parse(sessionStorage.getItem("posCart") || "{}");
    } catch {
      qtyMap = {};
    }

    try {
      meta = JSON.parse(sessionStorage.getItem("posItems") || "[]");
    } catch {
      meta = [];
    }

    const metaById = new Map(
      meta.map((m) => [String(m.pos_item_id ?? m.id), m])
    );

    const built = Object.entries(qtyMap)
      .filter(([, q]) => Number(q) > 0)
      .map(([id, q]) => {
        const m =
          metaById.get(String(id)) || {
            name: "Item",
            price_cents: 0,
            category: null,
          };

        // If a filter is provided, only keep items matching that category
        if (filterCategory && m.category && m.category !== filterCategory) {
          return null;
        }

        const n = Number(q);
        return {
          id: String(id),
          name: m.name,
          qty: n,
          cents: n * Number(m.price_cents || 0),
        };
      })
      .filter(Boolean);

    setLines(built);
    setTotalCents(built.reduce((sum, l) => sum + l.cents, 0));
  }, [filterCategory]);

  React.useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("cart:changed", handler);
    return () => window.removeEventListener("cart:changed", handler);
  }, [load]);

  const totalItems = lines.reduce((sum, l) => sum + l.qty, 0);

  return (
    <div className="panel" style={{ background: "#fff8e1" }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>{label}</div>

      {totalItems === 0 ? (
        <div className="note">
          {emptyMessage || "No items in your cart yet."}
        </div>
      ) : (
        <>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {lines.map((l) => (
              <li
                key={l.id}
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
                <span style={{ fontWeight: 800 }}>{centsToUSD(l.cents)}</span>
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
            <span>{centsToUSD(totalCents)}</span>
          </div>

          {/* New: Go to checkout button, same vibe as Tickets page */}
          <div className="row" style={{ marginTop: 10 }}>
            <Link
              to={totalItems === 0 ? "#" : "/checkout"}
              className={`btn btn-primary${totalItems === 0 ? " disabled" : ""}`}
              aria-disabled={totalItems === 0}
              onClick={(e) => {
                if (totalItems === 0) e.preventDefault();
              }}
            >
              Go to checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
