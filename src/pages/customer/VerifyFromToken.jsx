import React from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api";

export default function VerifyFromToken() {
  const { token } = useParams();
  const [state, setState] = React.useState({ loading: true, ok: false, error: "" });

  React.useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const r = await fetch(`${api}/api/auth/verify/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error || "Verification failed");
        }
        if (!ignore) setState({ loading: false, ok: true, error: "" });
      } catch (e) {
        if (!ignore) setState({ loading: false, ok: false, error: e.message || "Failed" });
      }
    })();
    return () => { ignore = true; };
  }, [token]);

  return (
    <div className="page card-page">
      <div className="card-page-inner">
        <h2 className="card-page-title">Email verification</h2>
        <div className="card card-page-body">
          {state.loading && <div>Verifying…</div>}
          {!state.loading && state.ok && (
            <div className="note">
              Your email has been verified. You can now <Link to="/login">log in</Link>.
            </div>
          )}
          {!state.loading && !state.ok && (
            <div className="error">
              {state.error || "Could not verify this token."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
