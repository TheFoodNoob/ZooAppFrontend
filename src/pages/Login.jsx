// src/pages/Login.jsx
import React from "react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost, apiGet } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();

  const [email, setEmail] = useState("dustin@zooapp.com");
  const [password, setPassword] = useState("MyPassword123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // 1) Login → get JWT
      const { token } = await apiPost("/api/auth/login", { email, password });
      setToken(token);

      // 2) Fetch profile with JWT
      const me = await apiGet("/api/employee/me", token);
      setUser(me);

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center">
      <form className="card" onSubmit={handleSubmit}>
        <h1>Employee Login</h1>
        {error && <div className="error">{error}</div>}

        <label>Email</label>
        <input
          type="email"
          placeholder="you@zooapp.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <button disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
      </form>
    </div>
  );
}
