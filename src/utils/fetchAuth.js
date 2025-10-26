// src/utils/fetchAuth.js
// Small helper: use this everywhere you call fetch to auto-handle 401s.
export async function fetchAuth(url, options = {}, onUnauthorized) {
  const res = await fetch(url, options);
  if (res.status === 401 && typeof onUnauthorized === "function") {
    onUnauthorized(); // e.g., AuthContext.logout()
  }
  return res;
}

// Handy JSON helper that also extracts validator messages
export async function parseJsonWithDetail(res) {
  let data = {};
  try { data = await res.json(); } catch (_) {}

  const detail =
   data.error ||
   (Array.isArray(data.errors)
     ? data.errors
         .map((e) => `${e.param ?? "field"}: ${e.msg || "Invalid value"}`)
         .join("; ")
     : "") ||
   "";
  return { ok: res.ok, status: res.status, data, detail };
}
