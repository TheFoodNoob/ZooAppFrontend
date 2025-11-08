import React, { useState } from "react";
import { api } from "../../api";

export default function StaffForgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setSent(false);
    setLoading(true);
    try {
      const r = await fetch(`${api}/api/employees/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || "Request failed");
      }
      setSent(true);
    } catch (e) {
      setErr(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page card-page">
      <div className="card-page-inner">
        <h2 className="card-page-title">Staff Password Reset</h2>
        <div className="card card-page-body">
          {sent ? (
            <div className="note">
              If that staff email exists, a reset link was generated.
              <br />
              <small>(Dev note: check the backend console for the link in development.)</small>
            </div>
          ) : (
            <form onSubmit={submit} className="two-col" style={{ gap: 10 }}>
              <div className="span-2">
                <label htmlFor="staff-forgot-email">Email</label>
                <input
                  id="staff-forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@htownzoo.org"
                  required
                />
              </div>
              <div className="span-2">
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </div>
              {err && <div className="error span-2">{err}</div>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
