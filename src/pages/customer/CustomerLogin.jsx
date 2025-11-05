import React from "react";
import { NavLink } from "react-router-dom"; 
import { useAuth } from "../../context/AuthContext";

export default function CustomerLogin() {
  const { loginCustomer, registerCustomer } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [msg, setMsg] = React.useState("");

  async function onLogin(e) {
    e.preventDefault();
    setMsg("");
    const r = await loginCustomer(email, password);
    if (!r.ok) setMsg(r.error || "Login failed");
  }

  async function onRegister(e) {
    e.preventDefault();
    setMsg("");
    const first_name = prompt("First name") || "";
    const last_name = prompt("Last name") || "";
    const pass = prompt("Create password") || "";
    const res = await registerCustomer({
      first_name,
      last_name,
      email,
      password: pass,
    });
    if (!res.ok) setMsg(res.error || "Could not create account");
  }

  return (
    <div className="page">
      <h1>Login</h1>

      {/* Center the card */}
      <div className="auth-wrap" style={{ width: "min(560px, 94vw)" }}>
        <div className="auth-card">
          <form onSubmit={onLogin}>
            <label>Email</label>
            <input
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* Forgot password link */}
            <div style={{ textAlign: "left", marginTop: 6 }}>
              <NavLink to="/forgot" style={{ fontSize: 12 }}>
                Forgot password?
              </NavLink>
            </div>

            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn btn-primary" type="submit">
                Login
              </button>
              <button className="btn" type="button" onClick={onRegister}>
                Create account
              </button>
            </div>

            {msg && (
              <div className="error" style={{ marginTop: 10 }}>
                {msg}
              </div>
            )}
          </form>
        </div>

        {/* Little helper note */}
        <div className="note" style={{ marginTop: 12 }}>
          Employees: please use the{" "}
          <a href="/staff/login" style={{ textDecoration: "underline" }}>
            Staff Login
          </a>
          .
        </div>
      </div>
    </div>
  );
}
