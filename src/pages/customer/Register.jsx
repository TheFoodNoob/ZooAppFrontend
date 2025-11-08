// src/pages/customer/Register.jsx
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../../api";

export default function Register() {
  const [form, setForm] = React.useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [err, setErr] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const navigate = useNavigate();

  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim() || !form.password) {
      return "first_name, last_name, email and password are required";
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Please enter a valid email";
    if (form.password.length < 6) return "Password must be at least 6 characters";
    return "";
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    const v = validate();
    if (v) return setErr(v);

    setSubmitting(true);
    try {
      const res = await fetch(`${api}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          password: form.password,
          ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const msg =
          j.error ||
          (Array.isArray(j.errors) && j.errors[0]?.msg) ||
          `Register failed (${res.status})`;
        throw new Error(msg);
      }

      navigate("/login");
    } catch (e) {
      setErr(e.message || "Register failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
  <div
    className="page"
    style={{
      minHeight: "80vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      padding: "20px",
    }}
  >
    <h1 style={{ marginBottom: 20 }}>Create Account</h1>

    <div
      className="panel"
      style={{
        maxWidth: 720,
        width: "100%",
        background: "#fff9e6",
        borderRadius: 10,
        padding: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <form onSubmit={submit} className="two-col" style={{ gap: 10 }}>
        {err && (
          <div className="error span-2" style={{ marginBottom: 10 }}>
            {err}
          </div>
        )}

        <div>
          <label htmlFor="first_name">First name</label>
          <input
            id="first_name"
            value={form.first_name}
            onChange={upd("first_name")}
            required
            autoComplete="given-name"
          />
        </div>

        <div>
          <label htmlFor="last_name">Last name</label>
          <input
            id="last_name"
            value={form.last_name}
            onChange={upd("last_name")}
            required
            autoComplete="family-name"
          />
        </div>

        <div className="span-2">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={upd("email")}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>

        <div className="span-2">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={upd("password")}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <div className="span-2">
          <label htmlFor="phone">Phone (optional)</label>
          <input
            id="phone"
            value={form.phone}
            onChange={upd("phone")}
            placeholder="e.g. 555-123-4567"
            autoComplete="tel"
          />
        </div>

        <div className="span-2 row" style={{ marginTop: 10, justifyContent: "center", gap: 10 }}>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create account"}
          </button>
          <Link to="/login" className="btn">Back to login</Link>
        </div>
      </form>
    </div>
  </div>
);

}
