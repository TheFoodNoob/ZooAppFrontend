// src/pages/customer/Register.jsx
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const { registerCustomer } = useAuth();
  const [form, setForm] = React.useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [err, setErr] = React.useState("");
  const navigate = useNavigate();

  function upd(k, v) { setForm(f => ({...f, [k]: v})); }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    const r = await registerCustomer(form);
    if (!r.ok) return setErr(r.error || "Register failed");
    navigate("/");
  }

  return (
    <div className="page">
      <h1>Create Account</h1>
      <div className="panel" style={{maxWidth:720}}>
        <form onSubmit={submit} className="two-col" style={{gap:10}}>
          {err && <div className="error span-2" style={{marginBottom:10}}>{err}</div>}
          <div>
            <label>First name</label>
            <input value={form.first_name} onChange={(e)=>upd("first_name", e.target.value)} />
          </div>
          <div>
            <label>Last name</label>
            <input value={form.last_name} onChange={(e)=>upd("last_name", e.target.value)} />
          </div>
          <div className="span-2">
            <label>Email</label>
            <input value={form.email} onChange={(e)=>upd("email", e.target.value)} />
          </div>
          <div className="span-2">
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e)=>upd("password", e.target.value)} />
          </div>
          <div className="span-2">
            <label>Phone (optional)</label>
            <input value={form.phone} onChange={(e)=>upd("phone", e.target.value)} />
          </div>
          <div className="span-2 row" style={{marginTop:10}}>
            <button className="btn btn-primary" type="submit">Create account</button>
            <Link to="/login" className="btn">Back to login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
