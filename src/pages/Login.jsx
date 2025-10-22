import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("dustin@zooapp.com");  // your seeded admin
  const [password, setPassword] = useState("MyPassword123"); // your chosen password
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await login(email, password);
      nav("/dashboard", { replace: true });
    } catch (error) {
      setErr(error.message);
    }
  }

  return (
    <div className="page center">
      <form className="card" onSubmit={onSubmit}>
        <h2>Employee Login</h2>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <div className="error">{err}</div>}
        <button className="btn" type="submit">Sign in</button>
      </form>
    </div>
  );
}
