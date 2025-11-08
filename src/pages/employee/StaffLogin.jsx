import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function StaffLogin() {
  const { loginEmployee } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [msg, setMsg] = React.useState("");

  const navigate = useNavigate();
  const loc = useLocation();

  const flashMsg = loc.state?.flash?.message || "";

  async function onLogin(e) {
    e.preventDefault();
    setMsg("");
    const r = await loginEmployee(email, password);
    if (!r.ok) {
      setMsg(r.error || "Login failed");
    } else {
      // If they were trying to visit a protected staff URL, send them back there.
      const backTo =
        loc.state?.from?.pathname
          ? loc.state.from.pathname + (loc.state.from.search || "")
          : "/staff";
      navigate(backTo, { replace: true });
    }
  }

  return (
    <div className="page">
      <h1>Staff Login</h1>

      <div className="auth-wrap" style={{ width: "min(560px, 94vw)" }}>
        <div className="auth-card">
          {/* Flash from ProtectedRoute */}
          {flashMsg && (
            <div className="note" style={{ marginBottom: 12 }}>{flashMsg}</div>
          )}

          <form onSubmit={onLogin}>
            <label htmlFor="staff-email">Email</label>
            <input
              id="staff-email"
              type="email"
              placeholder="you@htownzoo.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />

            <label htmlFor="staff-password">Password</label>
            <input
              id="staff-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <NavLink to="/staff/forgot" style={{ fontSize: 12 }}>
              Forgot password?
            </NavLink>

            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn btn-primary" type="submit">
                Login
              </button>
            </div>

            {msg && <div className="error" style={{ marginTop: 10 }}>{msg}</div>}
          </form>
        </div>

        <div className="note" style={{ marginTop: 12 }}>
          Customers: please use the <a href="/login">Customer Login</a>.
        </div>
      </div>
    </div>
  );
}
