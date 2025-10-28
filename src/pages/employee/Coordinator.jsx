import React from "react";

export default function Coordinator() {
  return (
    <div className="page" style={{ padding: "24px 16px" }}>
      <div className="container" style={{ maxWidth: 1120, margin: "0 auto" }}>
        <h2 style={{ margin: "0 0 12px 0" }}>Coordinator Dashboard</h2>
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
              <h3 style={{ margin: "0 0 8px" }}>Scheduling</h3>
              <p className="note">No schedules yet.</p>
            </section>
            <section>
              <h3 style={{ margin: "0 0 8px" }}>Assignments</h3>
              <p className="note">No assignments to show.</p>
            </section>
            <section>
              <h3 style={{ margin: "0 0 8px" }}>Open Requests</h3>
              <p className="note">No requests pending.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
