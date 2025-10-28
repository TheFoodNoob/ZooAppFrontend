import React, { useState } from "react";

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

  // Update form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newForm = { ...formData, [name]: value };
    setFormData(newForm);

    const selectedTicket = ticketOptions.find((t) => t.type === newForm.ticketType);
    const newTotal = selectedTicket.price * newForm.quantity;
    setTotal(newTotal);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Processing purchase...");

    try {
      const res = await fetch("http://localhost:4000/api/tickets/purchase", {
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

      if (!res.ok) throw new Error("Purchase failed");
      const data = await res.json();

      setMessage(`✅ ${data.message || "Purchase successful!"}`);
      setFormData({ name: "", email: "", ticketType: "Adult", quantity: 1 });
      setTotal(20);
    } catch (error) {
      setMessage("❌ Error: Could not process purchase.");
    }
  };

  return (
    <div className="page">
      <h1>Buy Tickets</h1>
      <div className="panel">
        <form onSubmit={handleSubmit}>
          <label>
            Name:
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Email:
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Ticket Type:
            <select
              name="ticketType"
              value={formData.ticketType}
              onChange={handleChange}
            >
              {ticketOptions.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.type} - ${t.price}
                </option>
              ))}
            </select>
          </label>

          <label>
            Quantity:
            <input
              type="number"
              name="quantity"
              min="1"
              value={formData.quantity}
              onChange={handleChange}
            />
          </label>

          <h3>Total: ${total}</h3>

          <button className="btn" >
            Submit Purchase
          </button>
        </form>

        {message && <p>{message}</p>}
      </div>
    </div>
  );
}