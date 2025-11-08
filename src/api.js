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

// Generic JSON fetch helper with nice error handling
async function jfetch(path, options = {}) {
  const res = await fetch(url(path), {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const err = new Error(data?.error || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ---------------------------
//  Predefined API Endpoints
// ---------------------------
export const endpoints = {
  auth: {
    login: () => url("api/auth/login"),
    me: () => url("api/employee/me"),

    // 👇 NEW customer auth (forgot/reset)
    forgot: () => url("api/auth/forgot"),
    reset: () => url("api/auth/reset"),
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

// ---------------------------
//  Auth and Password Actions
// ---------------------------

// Login (Employee)
export async function loginEmployee(email, password) {
  return jfetch("api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Forgot Password (Customer)
export async function forgotPassword(email) {
  return jfetch("api/auth/forgot", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

// Reset Password (Customer)
export async function resetPassword(token, password) {
  return jfetch("api/auth/reset", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

// Example: Get current employee info
export async function getCurrentEmployee(token) {
  return jfetch("api/employee/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Generic export for reuse
export { jfetch };
