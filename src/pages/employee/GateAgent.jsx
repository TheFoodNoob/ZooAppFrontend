import React from "react";
import { Link } from "react-router-dom";
export default function GateAgent() {
  return (
    <div className="page" style={{ padding: "24px 16px" }}>
      <div className="container" style={{ maxWidth: 1120, margin: "0 auto" }}>
        <h2 style={{ margin: "0 0 12px 0" }}>Gate Agent Dashboard</h2>
        <div
          className="card"
          style={{
            padding: 20,
            background: "#fff8e1",
            borderRadius: 12,
            boxShadow: "0 2px 6px rgba(0,0,0,0.08), 0 12px 28px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "grid", gap: 12 }}>
            <section>
              <h3 style={{ margin: "0 0 8px" }}>Ticket Scans (Today)</h3>
              <p className="note">No scans yet.</p>
            </section>
            <section>
              <h3 style={{ margin: "0 0 8px" }}>Entry Logs</h3>
              <p className="note">No entries to display.</p>
            </section>
            <section>
              <h3 style={{ margin: "0 0 8px" }}>Issues</h3>
              <p className="note">No reported issues.</p>
            </section>
          </div>
        </div>
      </div>
      <Link to = "/reports/tickets"><button className="btn">view ticket statistics</button></Link>
    </div>
  );
}
