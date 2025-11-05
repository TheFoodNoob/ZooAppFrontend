// src/pages/employee/StaffForgot.jsx
import React, { useState } from "react";
import { api } from "../../api";

export default function StaffForgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setSent(false);
    try {
      // 👇 DIFFERENCE: endpoint is /api/employees/forgot
      const r = await fetch(`${api}/api/employees/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) throw new Error("Request failed");
      setSent(true);
    } catch (e) {
      setErr(e.message || "Failed");
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
              (Dev note: check the backend console for the reset link.)
            </div>
          ) : (
            <form onSubmit={submit} className="two-col" style={{ gap: 10 }}>
              <div className="span-2">
                <label>Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@htownzoo.org"
                  required
                />
              </div>
              <div className="span-2">
                <button className="btn btn-primary" type="submit">
                  Send reset link
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
