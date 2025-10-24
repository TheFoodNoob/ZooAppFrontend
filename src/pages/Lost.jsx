import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page center">
      <div className="card" style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", marginBottom: "16px" }}>404</h1>
        <h2 style={{ marginBottom: "24px" }}>Page Not Found</h2>
        <p style={{ marginBottom: "32px" }}>
          Oops! The page you are looking for does not exist.
        </p>
        <Link to="/" className="btn">
          Go Back Home
        </Link>
      </div>
    </div>
  );
}
