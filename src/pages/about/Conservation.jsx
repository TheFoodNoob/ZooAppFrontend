// src/pages/about/Conservation.jsx
import React from "react";

export default function Conservation() {
  return (
    <div className="page">
      <div className="container">
        <h1>Conservation Efforts</h1>

        <div className="card" style={{ marginTop: 20 }}>
          <p>
            H-Town Zoo is committed to protecting endangered species, restoring 
            ecosystems, and supporting conservation programs around the world.
          </p>

          <h3>What We Support</h3>
          <ul>
            <li>🔹 Habitat restoration and anti-poaching programs</li>
            <li>🔹 Breeding and release programs for threatened species</li>
            <li>🔹 Wildlife rescue and rehabilitation</li>
            <li>🔹 Scientific research and global conservation partnerships</li>
          </ul>

          <p>
            When you visit, donate, or become a member, you directly contribute to 
            these vital initiatives. Together, we can preserve wildlife for future 
            generations.
          </p>
        </div>
      </div>
    </div>
  );
}
