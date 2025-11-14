import React from "react";
import { useParams, useLocation, Link } from "react-router-dom";

function formatDate(s) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(s);
  }
}

function formatTime(s) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return String(s);
  }
}

function formatUSD(cents) {
  if (cents == null) return "";
  const n = Number(cents) / 100;
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

export default function AccountOrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const order = location.state?.order;

  if (!order) {
    // Direct-URL case with no state
    return (
      <div className="page">
        <div className="container">
          <h1>Order #{id}</h1>
          <div className="card" style={{ marginTop: 20 }}>
            <p>We couldn&apos;t load details for this order from here.</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>
              Please go back to <Link to="/account">My Account</Link> and open
              this order from the list again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1>Ticket order</h1>
        <div className="card" style={{ marginTop: 20 }}>
          <h2 style={{ marginTop: 0 }}>Order #{order.order_id}</h2>
          <p>
            <strong>Placed on:</strong>{" "}
            {formatDate(order.created_at || order.order_date)}{" "}
            {formatTime(order.created_at || order.order_date)}
            <br />
            <strong>Visit date:</strong> {formatDate(order.visit_date)}
            <br />
            <strong>Status:</strong>{" "}
            {order.status
              ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
              : "—"}
            <br />
            <strong>Total:</strong> {formatUSD(order.total_cents)}
          </p>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Line items for ticket orders are stored in the <code>order_item</code>{" "}
            table. This page shows how an order header is tied to your customer
            account and visit history.
          </p>
        </div>

        <p style={{ marginTop: 16 }}>
          &larr; <Link to="/account">Back to My Account</Link>
        </p>
      </div>
    </div>
  );
}
