// src/api.js

// Read the base API URL from Vite env (set in .env / .env.production).
// Fallback: current origin (useful if backend and frontend are served together).
const raw =
  import.meta.env?.VITE_API_BASE ||
  (typeof window !== "undefined" ? window.location.origin : "");

const base = String(raw).replace(/\/+$/, ""); // strip trailing slash just in case

// Backward-compatible export used across the app
export const api = base;

// Nice helpers (optional, use if you want)
// Build a full URL from a relative path (e.g., url("api/employees"))
export function url(path = "") {
  const p = String(path).replace(/^\/+/, ""); // strip leading slash
  return `${base}/${p}`;
}

// Predefined endpoints (optional convenience)
export const endpoints = {
  auth: {
    login: () => url("api/auth/login"),
    me: () => url("api/employee/me"),
  },
  employees: {
    list: () => url("api/employees"),
    one: (id) => url(`api/employees/${id}`),
    fullUpdate: (id) => url(`api/employees/${id}/full`),
  },
  animals: {
    list: () => url("api/animals"),
  },
  reports: {
    summary: () => url("api/reports/summary"),
  },
};

// ADD at bottom of src/api.js
export async function fetchAuth(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${api}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (res.status === 403) {
    window.location.href = "/403";
    throw new Error("Forbidden");
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { msg = (await res.json())?.error || msg; } catch {}
    throw new Error(msg);
  }
  try { return await res.json(); } catch { return null; }
}
