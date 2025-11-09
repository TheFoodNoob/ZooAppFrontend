import React from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

/**
 * RequireVerified
 *
 * - mode="inline" (default): render a gentle inline callout if not logged-in or not verified
 *   and DO NOT navigate away. Useful when gating only a section of a page.
 *
 * - mode="page": behave like a hard guard:
 *   * if not logged-in -> redirect to /login
 *   * if logged-in but not verified -> show a full-page verify screen
 */
export default function RequireVerified({ children, mode = "inline" }) {
  const { user } = useAuth();
  const loc = useLocation();
  const [sending, setSending] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  const isAuthed = !!user && user.role === "customer";
  const isVerified = Boolean(user?.email_verified); // treat undefined as not verified for safety

  async function resend() {
    if (!user?.email) return;
    setSending(true);
    setMsg("");
    try {
      const r = await fetch(`${api}/api/auth/verify/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      if (!r.ok) throw new Error("Failed to send verification email");
      setMsg("Verification email sent. Please check your inbox.");
    } catch (e) {
      setMsg(e.message || "Failed to send verification email");
    } finally {
      setSending(false);
    }
  }

  if (mode === "page") {
    if (!isAuthed) {
      return (
        <Navigate
          to="/login"
          replace
          state={{ from: loc, flash: { message: "Please log in to continue." } }}
        />
      );
    }
    if (!isVerified) {
      return (
        <div className="page card-page">
          <div className="card-page-inner">
            <h2 className="card-page-title">Verify your email</h2>
            <div className="card card-page-body">
              <p>
                We sent a verification link to <strong>{user?.email}</strong>. Open it to
                verify your account and continue.
              </p>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn btn-primary" onClick={resend} disabled={sending}>
                  {sending ? "Sending…" : "Resend verification email"}
                </button>
                <Link className="btn" to="/">
                  Back home
                </Link>
              </div>
              {msg && <div className="note" style={{ marginTop: 10 }}>{msg}</div>}
            </div>
          </div>
        </div>
      );
    }
    return children;
  }

  // mode === "inline"
  if (!isAuthed) {
    return (
      <div className="note">
        Please{" "}
        <Link
          to="/login"
          state={{ from: loc, flash: { message: "Please log in to checkout." } }}
        >
          log in
        </Link>{" "}
        to complete checkout.
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="note">
        Please verify your email to checkout. We sent a link to{" "}
        <strong>{user.email}</strong>.{" "}
        <button className="btn btn-sm" onClick={resend} disabled={sending}>
          {sending ? "Sending…" : "Resend email"}
        </button>
        {msg && <span style={{ marginLeft: 8 }}>{msg}</span>}
      </div>
    );
  }

  return children;
}
