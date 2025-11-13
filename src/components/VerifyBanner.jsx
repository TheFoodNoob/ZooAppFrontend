// src/components/VerifyBanner.jsx
import React from "react";
import useVerifyStatus from "../hooks/useVerifyStatus";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function VerifyBanner() {
  const { user } = useAuth();
  const { loading, verified } = useVerifyStatus();
  const [sent, setSent] = React.useState("");

  // Only show for logged-in customers who are not verified yet
  if (!user || user.role !== "customer" || loading || verified) return null;

  async function resend() {
    setSent("");
    try {
      const r = await fetch(`${api}/api/customer-auth/verify/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      if (!r.ok) {
        console.warn("verify/start failed:", r.status);
        setSent("Could not send verification email.");
        return;
      }

      setSent("Verification email sent. (Dev: see server console.)");
    } catch (e) {
      console.warn("verify/start error:", e);
      setSent("Could not send verification email.");
    }
  }

  return (
    <div
      style={{
        background: "#fff3cd",
        borderBottom: "1px solid #ffeeba",
        color: "#856404",
        padding: "8px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <strong>Email not verified.</strong>
        <span>Please check your inbox and verify to unlock all features.</span>
        <button className="btn btn-sm" onClick={resend}>
          Resend
        </button>
        <Link
          className="btn btn-sm"
          to={`/verify-sent?email=${encodeURIComponent(user.email)}`}
        >
          Help
        </Link>
        {sent && (
          <span style={{ marginLeft: 8, fontSize: 12 }}>{sent}</span>
        )}
      </div>
    </div>
  );
}
