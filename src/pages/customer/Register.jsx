// src/pages/customer/Register.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

export default function Register() {
  const [form, setForm] = React.useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    phone: "",
  });
  const [err, setErr] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const navigate = useNavigate();

  const upd = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirm_password
    ) {
      return "First name, last name, email, password, and confirmation are required";
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      return "Please enter a valid email";
    }
    if (form.password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (form.password !== form.confirm_password) {
      return "Passwords do not match";
    }
    return "";
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");

    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    setSubmitting(true);

    try {
      const emailTrimmed = form.email.trim();

      const res = await fetch(`${api}/api/customer-auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: emailTrimmed,
          password: form.password,
          ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data.error ||
          (Array.isArray(data.errors) && data.errors[0]?.msg) ||
          `Register failed (${res.status})`;
        throw new Error(msg);
      }

      // No verification flow – just send them to the login page
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
            <label htmlFor="confirm_password">Confirm password</label>
            <input
              id="confirm_password"
              type="password"
              value={form.confirm_password}
              onChange={upd("confirm_password")}
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

          <div
            className="span-2 row"
            style={{ marginTop: 10, justifyContent: "center", gap: 10 }}
          >
            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
