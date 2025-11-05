import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function StaffLogin() {
  const { loginEmployee } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [msg, setMsg] = React.useState("");

  async function onLogin(e) {
    e.preventDefault();
    setMsg("");
    const r = await loginEmployee(email, password);
    if (!r.ok) setMsg(r.error || "Login failed");
  }

  return (
    <div className="page">
      <h1>Staff Login</h1>

      {/* Center the card */}
      <div className="auth-wrap" style={{ width: "min(560px, 94vw)" }}>
        <div className="auth-card">
          <form onSubmit={onLogin}>
            <label>Email</label>
            <input
              placeholder="you@htownzoo.org"
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

            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn btn-primary" type="submit">Login</button>
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
