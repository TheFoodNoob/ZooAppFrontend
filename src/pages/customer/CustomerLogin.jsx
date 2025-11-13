// src/pages/customer/CustomerLogin.jsx
import React from "react";
import { NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function CustomerLogin() {
  const { loginCustomer } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const navigate = useNavigate();
  const loc = useLocation();

  const flashMsg = loc.state?.flash?.message || "";

  async function onLogin(e) {
    e.preventDefault();
    setMsg("");
    setSubmitting(true);

    const r = await loginCustomer(email, password);
    setSubmitting(false);

    if (!r.ok) {
      setMsg(r.error || "Login failed");
    } else {
      // Always send customer to My Account on success
      navigate("/account", { replace: true });
    }
  }

  return (
    <div className="page">
      <h1>Login</h1>

      <div className="auth-wrap" style={{ width: "min(560px, 94vw)" }}>
        <div className="auth-card">
          {flashMsg && (
            <div className="note" style={{ marginBottom: 12 }}>
              {flashMsg}
            </div>
          )}

          <form onSubmit={onLogin}>
            <label>Email</label>
            <input
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <NavLink to="/forgot" style={{ fontSize: 12 }}>
              Forgot password?
            </NavLink>

            <div className="row" style={{ marginTop: 10, gap: 10 }}>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Logging in…" : "Login"}
              </button>

              <Link className="btn" to="/register">
                Create account
              </Link>
            </div>

            {msg && (
              <div className="error" style={{ marginTop: 10 }}>
                {msg}
              </div>
            )}
          </form>
        </div>

        <div className="note" style={{ marginTop: 12 }}>
          Employees: please use the <a href="/staff/login">Staff Login</a>.
        </div>
      </div>
    </div>
  );
}
