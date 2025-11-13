// src/pages/about/Contact.jsx
import React from "react";
import { api } from "../../api";

export default function Contact() {
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = React.useState({
    loading: false,
    success: "",
    error: "",
  });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setStatus({ loading: true, success: "", error: "" });

    try {
      const res = await fetch(`${api}/api/public/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to send message");
      }

      setStatus({
        loading: false,
        success: "Your message has been sent! We will respond soon.",
        error: "",
      });

      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setStatus({
        loading: false,
        success: "",
        error: err.message || "Something went wrong.",
      });
    }
  }

  return (
    <div className="page">
      <div className="container">
        <h1>Contact Us</h1>

        <div className="card" style={{ marginTop: 20 }}>
          <form onSubmit={submit} className="two-col" style={{ gap: 16 }}>
            <div>
              <label>Name</label>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>

            <div>
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>

            <div className="span-2">
              <label>Subject</label>
              <input
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
              />
            </div>

            <div className="span-2">
              <label>Message</label>
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                required
              />
            </div>

            <div className="span-2">
              <button className="btn btn-primary" disabled={status.loading}>
                {status.loading ? "Sending…" : "Send Message"}
              </button>
            </div>

            {status.success && (
              <div className="note span-2" style={{ color: "#0a7a2a" }}>
                {status.success}
              </div>
            )}

            {status.error && (
              <div className="error span-2">{status.error}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
