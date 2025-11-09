// src/pages/employee/StaffLogin.jsx
import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";

export default function StaffLogin() {
  const nav = useNavigate();
  const loc = useLocation();
  const auth = useAuth?.() || {};
  const { loginEmployee, setAuth, setToken, setUser } = auth;

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const flashMsg = loc.state?.flash?.message || "";

  async function doDirectLogin(e, p) {
    const r = await fetch(`${api}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: e, password: p }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Login failed");

    // Persist token using whatever your AuthContext supports.
    if (typeof setToken === "function") setToken(j.token);
    else if (typeof setAuth === "function") setAuth({ token: j.token });
    else if (typeof setUser === "function") setUser({ token: j.token });
    else {
      localStorage.setItem("authToken", j.token);
      window.dispatchEvent(new Event("auth:changed"));
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (typeof loginEmployee === "function") {
        // If your context already has a helper, use it.
        const r = await loginEmployee(email, password);
        if (!r || r.ok === false) throw new Error(r?.error || "Login failed");
      } else {
        // Fallback: call the API directly
        await doDirectLogin(email, password);
      }

      const backTo =
        loc.state?.from?.pathname
          ? loc.state.from.pathname + (loc.state.from.search || "")
          : "/dashboard";
      nav(backTo, { replace: true });
    } catch (e2) {
      setErr(e2.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page card-page">
      <div className="card-page-inner" style={{ width: "min(560px, 94vw)" }}>
        <h2 className="card-page-title">Staff Login</h2>
        <div className="card card-page-body">
          {flashMsg && <div className="note" style={{ marginBottom: 12 }}>{flashMsg}</div>}

          <form onSubmit={onSubmit} className="stack" style={{ gap: 10 }}>
            <div>
              <label>Email</label>
              <input
                type="email"
                placeholder="you@htownzoo.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn btn-primary" type="submit" disabled={busy}>
                {busy ? "Logging in…" : "Login"}
              </button>
            </div>

            {err && <div className="error" style={{ marginTop: 10 }}>{err}</div>}
          </form>

          <div className="note" style={{ marginTop: 12 }}>
            Customers: please use the <Link to="/login">Customer Login</Link>.
          </div>
        </div>
      </div>
    </div>
  );
}
