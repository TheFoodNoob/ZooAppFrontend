// src/pages/customer/Tickets.jsx
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../../api";

const toUSD = (cents) =>
  (Number(cents || 0) / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

function imageFor(name = "") {
  const n = String(name).toLowerCase();
  if (n.includes("infant")) return "/img/infant.jpg";
  if (n.includes("child") || n.includes("kid")) return "/img/child.jpg";
  if (n.includes("senior")) return "/img/seniorcitizen.jpg";
  if (n.includes("adult")) return "/img/adult.jpg";
  return "/img/adult.jpg";
}

const offsetFor = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("infant")) return { x: "-12px", y: "0px", bleed: "24px" };
  if (n.includes("child"))  return { x: "-6px",  y: "0px", bleed: "12px" };
  if (n.includes("senior")) return { x: "1px",   y: "0px", bleed: "20px" };
  if (n.includes("adult"))  return { x: "-8px",  y: "0px", bleed: "16px" };
  return { x: "0px", y: "0px", bleed: "0px" };
};

function blurbFor(name = "") {
  const n = String(name).toLowerCase();
  if (n.includes("infant")) return "Under 3 (free)";
  if (n.includes("child") || n.includes("kid")) return "Ages 3–12";
  if (n.includes("senior")) return "Ages 65+";
  if (n.includes("adult")) return "Ages 13–64";
  return "";
}

export default function Tickets() {
  const navigate = useNavigate();

  const [types, setTypes] = React.useState([]);
  const [qty, setQty] = React.useState({});

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      let data = [];
      try {
        const res = await fetch(`${api}/api/public/ticket-types`);
        if (res.ok) data = await res.json();
      } catch {}
      if (!Array.isArray(data) || data.length === 0) {
        data = [
          { ticket_type_id: 1, name: "Infant", price_cents: 0,    blurb: "Under 3 (free)" },
          { ticket_type_id: 2, name: "Child",  price_cents: 1200, blurb: "Ages 3–12" },
          { ticket_type_id: 3, name: "Senior", price_cents: 1500, blurb: "Ages 65+" },
          { ticket_type_id: 4, name: "Adult",  price_cents: 2000, blurb: "Ages 13–64" },
        ];
      }
      const withImgs = data.map((t) => ({ ...t, img: imageFor(t.name) }));
      if (!cancelled) {
        setTypes(withImgs);
        const minimal = withImgs.map((t) => ({
          ticket_type_id: t.ticket_type_id ?? t.id,
          name: t.name,
          price_cents: Number(t.price_cents || 0),
          blurb: t.blurb ?? blurbFor(t.name),
        }));
        // store catalog for this tab only
        sessionStorage.setItem("ticketTypes", JSON.stringify(minimal));
        window.dispatchEvent(new Event("cart:changed"));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    try {
      // read per-tab cart state
      const saved = JSON.parse(sessionStorage.getItem("cartQty") || "{}");
      if (saved && typeof saved === "object") setQty(saved);
    } catch {}
  }, []);

  const setAndPersistQty = React.useCallback((next) => {
    setQty(next);
    sessionStorage.setItem("cartQty", JSON.stringify(next));
    window.dispatchEvent(new Event("cart:changed"));
  }, []);

  const inc = (id) => {
    const k = String(id);
    setAndPersistQty({ ...qty, [k]: Number(qty[k] || 0) + 1 });
  };
  const dec = (id) => {
    const k = String(id);
    const n = Math.max(0, Number(qty[k] || 0) - 1);
    const next = { ...qty, [k]: n };
    if (n === 0) delete next[k];
    setAndPersistQty(next);
  };

  const lines = React.useMemo(() => {
    const map = new Map(
      (types || []).map((t) => [
        String(t.ticket_type_id ?? t.id),
        { name: t.name, price_cents: Number(t.price_cents || 0) },
      ])
    );
    return Object.entries(qty)
      .filter(([, q]) => Number(q) > 0)
      .map(([id, q]) => {
        const meta = map.get(String(id)) || { name: "Ticket", price_cents: 0 };
        const n = Number(q);
        return { id: Number(id), name: meta.name, qty: n, cents: n * meta.price_cents };
      });
  }, [qty, types]);

  const totalCents = lines.reduce((s, l) => s + l.cents, 0);
  const items = lines.reduce((s, l) => s + l.qty, 0);

  const clearAll = () => {
    setQty({});
    sessionStorage.setItem("cartQty", "{}");
    window.dispatchEvent(new Event("cart:changed"));
  };

  return (
    <div className="page">
      <h1>Tickets</h1>

      <div className="ticket-catalog">
        <div className="ticket-grid">
          {types.map((t) => {
            const id = t.ticket_type_id ?? t.id;
            const q = Number(qty[String(id)] || 0);
            const { x, y, bleed } = offsetFor(t.name);

            return (
              <article key={id} className={`ticket-card${q > 0 ? " is-selected" : ""}`}>
                {/* LEFT: details */}
                <div className="ticket-card__main" style={{ display: "grid", gap: 8 }}>
                  <div>
                    <div className="t-title">{t.name}</div>
                    <div className="t-price">{toUSD(t.price_cents)}</div>
                    {(t.blurb ?? blurbFor(t.name)) && (
                      <div className="t-blurb">{t.blurb ?? blurbFor(t.name)}</div>
                    )}
                  </div>

                  <div className="qty-row" style={{ marginTop: 8 }}>
                    <button className="btn btn-sm qty-btn" type="button" onClick={() => dec(id)} aria-label={`Decrease ${t.name}`}>–</button>
                    <input
                      className="qty-input"
                      type="number"
                      min="0"
                      value={q}
                      onChange={(e) => {
                        const v = Math.max(0, Number(e.target.value || 0));
                        const next = { ...qty, [String(id)]: v };
                        if (v === 0) delete next[String(id)];
                        setAndPersistQty(next);
                      }}
                    />
                    <button className="btn btn-sm qty-btn" type="button" onClick={() => inc(id)} aria-label={`Increase ${t.name}`}>+</button>
                  </div>
                </div>

                {/* RIGHT: image (position tweakable via CSS vars) */}
                <div
                  className="ticket-card__media"
                  style={{
                    ["--ticket-img-offset-x"]: x,
                    ["--ticket-img-offset-y"]: y,
                    ["--ticket-img-bleed"]: bleed
                  }}
                >
                  <img src={t.img} alt={t.name} />
                </div>
              </article>
            );
          })}
        </div>

        {/* Summary + Next step */}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr", marginTop: 14 }}>
          <div className="panel" style={{ background: "#fff8e1" }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Summary</div>
            {lines.length === 0 ? (
              <div className="note">No tickets selected yet.</div>
            ) : (
              <>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {lines.map((l) => (
                    <li key={l.id} style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      padding: "6px 0",
                      borderBottom: "1px dashed #eadfae"
                    }}>
                      <span>{l.name} × {l.qty}</span>
                      <span style={{ fontWeight: 800 }}>{toUSD(l.cents)}</span>
                    </li>
                  ))}
                </ul>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  paddingTop: 8,
                  marginTop: 6,
                  borderTop: "1px solid #eadfae",
                  fontWeight: 900
                }}>
                  <span>Total</span>
                  <span>{toUSD(totalCents)}</span>
                </div>
              </>
            )}
          </div>

          <div className="panel" style={{ background: "#fff8e1" }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Next step</div>
            <div className="note">You’ll enter contact info and pick a visit date on the next page.</div>
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn" type="button" onClick={clearAll}>Clear</button>
              <Link
                to={items === 0 ? "#" : "/checkout"}
                className={`btn btn-primary${items === 0 ? " disabled" : ""}`}
                aria-disabled={items === 0}
                onClick={(e) => { if (items === 0) e.preventDefault(); }}
              >
                Go to checkout
              </Link>
            </div>
            <div style={{ marginTop: 8, fontSize: 13 }}>
              <a href="/orders">Find my order / Request a refund</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
