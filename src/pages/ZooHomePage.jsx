import React from "react";

export default function Home() {
  return (
    <div>

      {/* Hero Section */}
      <div className="hero">
        <a href="/animals" className="hero-card">
          <i className="fas fa-paw"></i>
          <div>Animals</div>
        </a>
        <a href="/exhibits" className="hero-card">
          <i className="fas fa-tree"></i>
          <div>Exhibits</div>
        </a>
        <a href="/visit" className="hero-card">
          <i className="fas fa-map"></i>
          <div>Plan Your Visit</div>
        </a>
        <a href="/team" className="hero-card">
          <i className="fas fa-users"></i>
          <div>Team</div>
        </a>
        <a href="/tickets" className="hero-card">
          <i className="fas fa-ticket-alt"></i>
          <div>Buy Tickets</div>
        </a>
      </div>

      {/* Page Content */}
      <main className="page">
        {/* Example content */}
        <div className="grid">
          <div className="card">Featured Animal 1</div>
          <div className="card">Featured Animal 2</div>
          <div className="card">Featured Animal 3</div>
        </div>
      </main>
    </div>
  );
}
