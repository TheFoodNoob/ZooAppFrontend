import React from "react";
import { Link } from "react-router-dom";

export default function Security() {
  return (
    <div className="page" style={{ padding: "24px 16px" }}>
      <div className="container" style={{ maxWidth: 1120, margin: "0 auto" }}>
        <h2 style={{ margin: "0 0 12px 0" }}>Security Dashboard</h2>
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
              <h3 style={{ margin: "0 0 8px" }}>Incidents</h3>
              <p className="note">No incidents recorded.</p>
            </section>
            <section>
              <h3 style={{ margin: "0 0 8px" }}>Patrol Logs</h3>
              <p className="note">No patrols logged.</p>
            </section>
            <section>
              <h3 style={{ margin: "0 0 8px" }}>Access Alerts</h3>
              <p className="note">No access alerts.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}


/*<div className="panel">
        <ul>
        <li><Link to="/employees/security">view personel</Link></li>            
        </ul>
      </div>
*/