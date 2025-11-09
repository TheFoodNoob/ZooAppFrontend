import React from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api";

export default function VerifySent() {
  const [params] = useSearchParams();
  const presetEmail = params.get("email") || "";
  const [email, setEmail] = React.useState(presetEmail);
  const [msg, setMsg] = React.useState("");

  async function resend(e) {
    e.preventDefault();
    setMsg("");
    try {
      const r = await fetch(`${api}/api/auth/verify/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) throw new Error("Could not send email");
      setMsg("If that email exists, a verification link has been sent. (Dev: see server console.)");
    } catch (e) {
      setMsg(e.message || "Failed");
    }
  }

  return (
    <div className="page card-page">
      <div className="card-page-inner">
        <h2 className="card-page-title">Check your email</h2>
        <div className="card card-page-body">
          <p>
            We sent a verification link to your email.
            In development, the link is printed in the backend console.
          </p>

          <form onSubmit={resend} className="two-col" style={{ gap: 10, marginTop: 12 }}>
            <div className="span-2">
              <label>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="span-2">
              <button className="btn btn-primary" type="submit">Resend verification email</button>
            </div>
          </form>

          {msg && <div className="note" style={{ marginTop: 10 }}>{msg}</div>}
        </div>
      </div>
    </div>
  );
}
