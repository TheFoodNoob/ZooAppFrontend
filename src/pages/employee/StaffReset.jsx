// src/pages/employee/StaffReset.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api";

export default function StaffReset() {
  const { token } = useParams();
  const nav = useNavigate();
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (pw1.length < 6) return setErr("Password must be at least 6 characters.");
    if (pw1 !== pw2) return setErr("Passwords do not match.");
    try {
      // 👇 DIFFERENCE: endpoint is /api/employees/reset
      const r = await fetch(`${api}/api/employees/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: pw1 }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || "Reset failed");
      }
      setOk(true);
      setTimeout(() => nav("/staff/login"), 1200);
    } catch (e) {
      setErr(e.message || "Failed");
    }
  }

  return (
    <div className="page card-page">
      <div className="card-page-inner">
        <h2 className="card-page-title">Set New Password</h2>
        <div className="card card-page-body">
          {ok ? (
            <div className="note">Password updated! Redirecting to login…</div>
          ) : (
            <form onSubmit={submit} className="two-col" style={{ gap: 10 }}>
              <div className="span-2">
                <label>New password</label>
                <input
                  type="password"
                  value={pw1}
                  onChange={(e) => setPw1(e.target.value)}
                  required
                />
              </div>
              <div className="span-2">
                <label>Confirm password</label>
                <input
                  type="password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  required
                />
              </div>
              <div className="span-2">
                <button className="btn btn-primary" type="submit">
                  Update password
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
