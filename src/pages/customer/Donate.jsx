// src/pages/customer/Donate.jsx
import React from "react";
import { api } from "../../api";

const PRESETS = [10, 25, 50, 100];

export default function Donate() {
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    message: "",
  });
  const [amountMode, setAmountMode] = React.useState("preset"); // "preset" | "custom"
  const [preset, setPreset] = React.useState(25);
  const [customAmount, setCustomAmount] = React.useState("");
  const [anonymous, setAnonymous] = React.useState(false);

  const [status, setStatus] = React.useState({
    loading: false,
    success: "",
    error: "",
  });

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function computeAmountDollars() {
    if (amountMode === "preset") return preset;
    const n = Number(customAmount);
    return Number.isFinite(n) ? n : 0;
  }

  async function submit(e) {
    e.preventDefault();
    setStatus({ loading: true, success: "", error: "" });

    const dollars = computeAmountDollars();
    if (!dollars || dollars <= 0) {
      setStatus({
        loading: false,
        success: "",
        error: "Please enter a valid donation amount.",
      });
      return;
    }

    if (!anonymous && !form.name.trim()) {
      setStatus({
        loading: false,
        success: "",
        error: "Please enter your name or mark the donation as anonymous.",
      });
      return;
    }

    const cents = Math.round(dollars * 100);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      message: form.message.trim() || "",
      is_anonymous: anonymous,
      amount_cents: cents,
      tier:
        amountMode === "preset"
          ? `$${preset}`
          : "Custom",
    };

    try {
      const res = await fetch(`${api}/api/public/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to record donation");
      }

      setStatus({
        loading: false,
        success: "Thank you for your support! Your donation has been recorded.",
        error: "",
      });

      // Reset form
      setForm({ name: "", email: "", message: "" });
      setAmountMode("preset");
      setPreset(25);
      setCustomAmount("");
      setAnonymous(false);
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
        <h1>Support the Zoo</h1>
        <p style={{ maxWidth: 520, marginTop: 8 }}>
          Your gift helps fund animal care, conservation programs, and education
          for visitors of all ages.
        </p>

        <div className="card" style={{ marginTop: 24 }}>
          <form onSubmit={submit} className="two-col" style={{ gap: 16 }}>
            {/* Amount section */}
            <div className="span-2">
              <h2 style={{ marginTop: 0 }}>Choose an amount</h2>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {PRESETS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className="btn"
                    style={{
                      marginTop: 0,
                      padding: "8px 14px",
                      borderRadius: 999,
                      background:
                        amountMode === "preset" && preset === amt
                          ? "#065f46"
                          : "#ffffff",
                      color:
                        amountMode === "preset" && preset === amt
                          ? "#ffffff"
                          : "#065f46",
                      borderColor: "#065f46",
                    }}
                    onClick={() => {
                      setAmountMode("preset");
                      setPreset(amt);
                    }}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={{ marginTop: 8 }}>
                  Or enter a custom amount
                </label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span>$</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={customAmount}
                    onChange={(e) => {
                      setAmountMode("custom");
                      setCustomAmount(e.target.value);
                    }}
                    placeholder="e.g. 35"
                    style={{ maxWidth: 160 }}
                  />
                </div>
                <small className="muted">
                  Minimum $1. No real payment is processed – this is a simulated
                  demo.
                </small>
              </div>
            </div>

            {/* Donor info */}
            <div className="span-2">
              <label>
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                Give anonymously
              </label>
              <small className="muted">
                If checked, your name won&apos;t appear in internal donor
                reports.
              </small>
            </div>

            {!anonymous && (
              <>
                <div>
                  <label>Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    required={!anonymous}
                  />
                </div>

                <div>
                  <label>Email (optional)</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="For a thank-you email"
                  />
                </div>
              </>
            )}

            {anonymous && (
              <>
                <div>
                  <label>Name (optional)</label>
                  <input
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Leave blank to stay fully anonymous"
                  />
                </div>

                <div>
                  <label>Email (optional)</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="For a thank-you email"
                  />
                </div>
              </>
            )}

            <div className="span-2">
              <label>Message (optional)</label>
              <textarea
                rows={3}
                value={form.message}
                onChange={(e) => updateField("message", e.target.value)}
                placeholder="Any notes you want to share with the zoo team."
              />
            </div>

            <div className="span-2">
              <button className="btn btn-primary" disabled={status.loading}>
                {status.loading ? "Processing…" : "Submit Donation"}
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
