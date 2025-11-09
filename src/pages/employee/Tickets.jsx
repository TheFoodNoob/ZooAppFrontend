// src/pages/TicketStats.jsx
import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { api } from "../../api";
export default function TicketStats() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stats
  const [totalSold, setTotalSold] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await fetch(`${api}/api/public/ticket-types`);
        if (!res.ok) throw new Error("Failed to fetch tickets");
        const data = await res.json();

        // Compute stats
        let sold = 0;
        let revenue = 0;
        const chartData = data.map(t => {
          const quantity = Math.floor(Math.random() * 50) + 10; // placeholder quantity sold
          const price = t.price_cents / 100;
          sold += quantity;
          revenue += quantity * price;
          return { name: t.name, quantity, revenue: quantity * price };
        });

        setTickets(chartData);
        setTotalSold(sold);
        setTotalRevenue(revenue);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    }

    fetchTickets();
  }, []);

  if (loading) return <p>Loading ticket stats...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="page">
      <h1>Ticket Sales Stats</h1>

      <div className="stats-grid" style={{ display: "flex", gap: "2rem", marginBottom: "2rem" }}>
        <div className="stat-card" style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}>
          <h3>Total Tickets Sold</h3>
          <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{totalSold}</p>
        </div>
        <div className="stat-card" style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}>
          <h3>Total Revenue</h3>
          <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <h2>Tickets Sold per Type (Bar Chart)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={tickets} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => `$${value}`} />
          <Bar dataKey="quantity" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>

      <h2>Revenue per Ticket Type (Bar Chart)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={tickets} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
          <Bar dataKey="revenue" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
