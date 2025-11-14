import React from "react";
import { api } from "../../api";
import PosCartSummary from "../../components/PosCartSummary.jsx";

const CATEGORY = "giftshop";

function formatUSD(cents) {
  if (cents == null) return "";
  const n = Number(cents) / 100;
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

// Shared helper for POS (food/gift) items
// 👉 NO LONGER TOUCHES posCart QUANTITIES – only metadata
function addPosItemToCart(item, categoryFallback) {
  const posId = String(item.pos_item_id ?? item.id);

  // Metadata
  let meta = [];
  try {
    meta = JSON.parse(sessionStorage.getItem("posItems") || "[]");
  } catch {
    meta = [];
  }
  const already = meta.some((m) => String(m.pos_item_id ?? m.id) === posId);
  if (!already) {
    meta.push({
      pos_item_id: item.pos_item_id ?? item.id,
      name: item.name,
      price_cents: Number(item.price_cents || 0),
      category: item.category || categoryFallback || null,
    });
  }
  sessionStorage.setItem("posItems", JSON.stringify(meta));

  window.dispatchEvent(new Event("cart:changed"));
}

export default function GiftShop() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [qty, setQty] = React.useState({});

  // Load catalog
  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `${api}/api/public/pos-items?category=${CATEGORY}`
        );
        if (!res.ok) throw new Error("Failed to load gift shop items");
        const data = await res.json();

        if (!cancelled) {
          setItems(Array.isArray(data) ? data : []);
        }

        // Seed posItems with this catalog
        const minimal = (Array.isArray(data) ? data : []).map((it) => ({
          pos_item_id: it.pos_item_id ?? it.id,
          name: it.name,
          price_cents: Number(it.price_cents || 0),
          category: it.category || CATEGORY,
        }));

        try {
          const existing = JSON.parse(
            sessionStorage.getItem("posItems") || "[]"
          );
          const byId = new Map(
            existing.map((m) => [String(m.pos_item_id ?? m.id), m])
          );
          for (const m of minimal) {
            const id = String(m.pos_item_id);
            if (!byId.has(id)) byId.set(id, m);
          }
          sessionStorage.setItem(
            "posItems",
            JSON.stringify(Array.from(byId.values()))
          );
        } catch {
          sessionStorage.setItem("posItems", JSON.stringify(minimal));
        }
      } catch (e) {
        console.error("GiftShop load error:", e);
        if (!cancelled) setError("We couldn't load the gift shop catalog.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load existing POS cart quantities
  React.useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("posCart") || "{}");
      if (saved && typeof saved === "object") setQty(saved);
    } catch {
      // ignore
    }
  }, []);

  const setAndPersistQty = React.useCallback((next) => {
    setQty(next);
    sessionStorage.setItem("posCart", JSON.stringify(next));
    window.dispatchEvent(new Event("cart:changed"));
  }, []);

  const inc = (id) => {
    const key = String(id);
    const next = { ...qty, [key]: Number(qty[key] || 0) + 1 };
    setAndPersistQty(next);

    // only ensure metadata exists; no quantity change here
    addPosItemToCart(
      items.find((it) => (it.pos_item_id ?? it.id) === id) || {
        pos_item_id: id,
      },
      CATEGORY
    );
  };

  const dec = (id) => {
    const key = String(id);
    const current = Number(qty[key] || 0);
    const n = Math.max(0, current - 1);
    const next = { ...qty, [key]: n };
    if (n === 0) delete next[key];
    setAndPersistQty(next);
  };

  return (
    <div className="page">
      <div className="container">
        <h1>Zoo Gift Shop</h1>
        <p style={{ maxWidth: 640, marginTop: 8 }}>
          Pick up souvenirs and zoo merch before or after your visit. This page
          demonstrates how food &amp; gift shop items can be modeled separately
          from tickets but still tied to a customer account.
        </p>

        {loading && <p style={{ marginTop: 16 }}>Loading gift shop items…</p>}
        {!loading && error && (
          <div className="error" style={{ marginTop: 16 }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Catalog grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
                marginTop: 18,
              }}
            >
              {items.map((it) => {
                const id = it.pos_item_id ?? it.id;
                const q = Number(qty[String(id)] || 0);

                return (
                  <article
                    key={id}
                    className={`card${q > 0 ? " is-selected" : ""}`}
                    style={{ display: "grid", gap: 8 }}
                  >
                    <div>
                      <h3 style={{ marginBottom: 2 }}>{it.name}</h3>
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        {formatUSD(it.price_cents)}
                      </div>
                      {it.description && (
                        <div
                          style={{
                            fontSize: 14,
                            color: "var(--muted)",
                            minHeight: 40,
                          }}
                        >
                          {it.description}
                        </div>
                      )}
                    </div>

                    <div className="qty-row" style={{ marginTop: 6 }}>
                      <button
                        className="btn btn-sm qty-btn"
                        type="button"
                        onClick={() => dec(id)}
                        aria-label={`Decrease ${it.name}`}
                      >
                        –
                      </button>
                      <input
                        className="qty-input"
                        type="number"
                        min="0"
                        value={q}
                        onChange={(e) => {
                          const v = Math.max(0, Number(e.target.value || 0));
                          const key = String(id);
                          const next = { ...qty, [key]: v };
                          if (v === 0) delete next[key];
                          setAndPersistQty(next);
                        }}
                      />
                      <button
                        className="btn btn-sm qty-btn"
                        type="button"
                        onClick={() => inc(id)}
                        aria-label={`Increase ${it.name}`}
                      >
                        +
                      </button>
                    </div>
                  </article>
                );
              })}

              {items.length === 0 && (
                <p style={{ marginTop: 8 }}>
                  No gift shop items available yet.
                </p>
              )}
            </div>

            {/* Summary for just GIFTS, styled like tickets summary */}
            <div
              className="panel"
              style={{ marginTop: 20, background: "#fff8e1" }}
            >
              <PosCartSummary
                label="Your gift shop cart"
                filterCategory="giftshop"
                emptyMessage="We didn't find any gift shop items in your cart yet. Use the controls above to add souvenirs and merch for your visit."
              />
              <p
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: "var(--muted)",
                }}
              >
                For demo purposes, food and gift purchases are modeled in a
                separate POS cart, but they share the same checkout and account
                history as ticket orders.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
