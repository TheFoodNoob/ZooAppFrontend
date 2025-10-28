import React from "react";

export default function Vet() {
  return (
    <div className="page" style={{ padding: "24px 16px" }}>
      <div className="container" style={{ maxWidth: 1120, margin: "0 auto" }}>
        <h2 style={{ margin: "0 0 12px 0" }}>Vet Dashboard</h2>
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
              <h3 style={{ margin: "0 0 8px" }}>Upcoming Appointments</h3>
              <p className="note">No appointments scheduled yet.</p>
            </section>
            <section>
              <h3 style={{ margin: "0 0 8px" }}>Medical Alerts</h3>
              <p className="note">No alerts.</p>
            </section>
            <section>
              <h3 style={{ margin: "0 0 8px" }}>Recent Treatments</h3>
              <p className="note">Nothing to show.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
