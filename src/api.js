// src/api.js

// Determine base API URL (works for both local dev and Vercel production)
const raw =
  import.meta.env?.VITE_API_BASE ||
  (typeof window !== "undefined"
    ? window.location.hostname.includes("localhost")
      ? "http://localhost:4000" // local backend
      : "https://zoo-app-backend-production.up.railway.app" // <-- your deployed backend
    : "");

const base = String(raw).replace(/\/+$/, ""); // strip trailing slash

// Export the base URL for all fetches
export const api = base;

// Helper to build full URLs cleanly
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

  verify: {
    start: () => url("api/auth/verify/start"),
    confirm: () => url("api/auth/verify/confirm"),
    status: () => url("api/auth/verify/status"),
  },
};

// ---------------------------
//  Auth and Password Actions
// ---------------------------

export async function loginEmployee(email, password) {
  return jfetch("api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function forgotPassword(email) {
  return jfetch("api/auth/forgot", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token, password) {
  return jfetch("api/auth/reset", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export async function getCurrentEmployee(token) {
  return jfetch("api/employee/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export { jfetch };
