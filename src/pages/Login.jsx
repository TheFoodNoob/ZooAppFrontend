import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
// async function login(email, password) {
//   // Instead of calling the backend, accept everything:
//   const fakeToken = "fake-jwt-token";
//   localStorage.setItem("jwt", fakeToken);
//   //setToken(fakeToken);

//   // Create a fake user object based on input
//   //setUser({ email, role: "employee" });

//   return true; // always resolves
// }

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("dustin@zooapp.com"); // seeded admin
  const [password, setPassword] = useState("MyPassword123"); // chosen password
  const [err, setErr] = useState("");
  const [isEmployee, setIsEmployee] = useState(true); // toggle state

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await login(email, password,); // you could customize login logic per type if needed
      nav("/dashboard", { replace: true });
    } catch (error) {
      setErr(error.message);
    } 
  }

  function toggleLoginType() {
    setIsEmployee(!isEmployee);
    setErr("");
    setEmail("");
    setPassword("");
  }

  return (
    <div className="page center">
      <form className="card" onSubmit={onSubmit}>
        {/* Toggle Button */}
        {/* <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
          <button
            type="button"
            className="btn"
            style={{ padding: "6px 12px", fontSize: "0.9rem" }}
            onClick={toggleLoginType}
          >
            Switch to {isEmployee ? "Customer" : "Employee"} Login
          </button>
        </div> */}

        <h2>{isEmployee ? "Employee/Admin Login" : "Customer Login"}</h2>

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
