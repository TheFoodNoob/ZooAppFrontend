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
