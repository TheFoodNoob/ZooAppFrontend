// src/pages/customer/Tickets.jsx
import React, { useState } from "react";
import { api } from "../../api";

export default function Tickets() {
  const ticketOptions = [
    { type: "Adult", price: 20 },
    { type: "Child", price: 10 },
    { type: "Senior", price: 15 },
  ];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    ticketType: "Adult",
    quantity: 1,
  });
  const [total, setTotal] = useState(20);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newForm = { ...formData, [name]: name === "quantity" ? Number(value) : value };
    setFormData(newForm);

    const selectedTicket = ticketOptions.find((t) => t.type === newForm.ticketType);
    setTotal(selectedTicket.price * (newForm.quantity || 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.ticketType || !formData.quantity) {
      setMessage("Please fill out all fields."); return;
    }
    setSubmitting(true); setMessage("Processing purchase…");

    try {
      const res = await fetch(`${api}/api/tickets/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          ticketType: formData.ticketType,
          quantity: Number(formData.quantity),
          total,
        }),
      });
      if (!res.ok) throw new Error(`Purchase failed (${res.status})`);
      const data = await res.json();
      setMessage(`✅ ${data.message || "Purchase successful!"}`);
      setFormData({ name: "", email: "", ticketType: "Adult", quantity: 1 });
      setTotal(20);
    } catch (error) {
      setMessage("❌ Error: Could not process purchase.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <h1>Buy Tickets</h1>
      <div className="panel">
        <form onSubmit={handleSubmit} className="two-col" style={{ gap: 12 }}>
          <label>Name<input name="name" value={formData.name} onChange={handleChange} required /></label>
          <label>Email<input type="email" name="email" value={formData.email} onChange={handleChange} required /></label>
          <label>
            Ticket Type
            <select name="ticketType" value={formData.ticketType} onChange={handleChange}>
              {ticketOptions.map((t) => (
                <option key={t.type} value={t.type}>{t.type} - ${t.price}</option>
              ))}
            </select>
          </label>
          <label>
            Quantity
            <input type="number" min="1" name="quantity" value={formData.quantity} onChange={handleChange} />
          </label>
          <div className="span-2"><h3>Total: ${total}</h3></div>
          <div className="span-2">
            <button className="btn" disabled={submitting}>{submitting ? "Submitting…" : "Submit Purchase"}</button>
          </div>
        </form>
        {message && <p style={{ marginTop: 10 }}>{message}</p>}
      </div>
    </div>
  );
}
