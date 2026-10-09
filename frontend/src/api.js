const BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.message || `Request failed: ${res.status}`
    );
  }

  return data;
}

export const api = {
  base: BASE,

  // =========================================================
  // USER LOGIN
  // =========================================================
  userLogin: (pin) =>
    request("/api/auth/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pin,
      }),
    }),

  // =========================================================
  // ADMIN LOGIN
  // =========================================================
  adminLogin: (password) =>
    request("/api/auth/admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password,
      }),
    }),

  // =========================================================
  // CREATE REPORT
  // =========================================================
  createReport: (token, form) =>
    request("/api/reports", {
      method: "POST",
      headers: {
        "X-Session-Token": token,
      },
      body: form,
    }),

  // =========================================================
  // USER'S REPORTS
  // =========================================================
  mine: (token) =>
    request("/api/reports/mine", {
      headers: {
        "X-Session-Token": token,
      },
    }),

  // =========================================================
  // ADMIN - ALL REPORTS
  // =========================================================
  reports: (token) =>
    request("/api/reports", {
      headers: {
        "X-Session-Token": token,
      },
    }),

  // =========================================================
  // ADMIN - DASHBOARD STATS
  // =========================================================
  stats: (token) =>
    request("/api/reports/stats", {
      headers: {
        "X-Session-Token": token,
      },
    }),

  // =========================================================
  // ADMIN - UPDATE REPORT STATUS
  // =========================================================
  updateStatus: (token, id, status) =>
    request(`/api/reports/${id}/status`, {
      method: "PATCH",
      headers: {
        "X-Session-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
      }),
    }),

  // =========================================================
  // CHECK USER PIN
  // =========================================================
  checkUserPin: (pin) =>
    request("/api/auth/user/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pin,
      }),
    }),

  // =========================================================
  // REGISTER USER
  // =========================================================
  registerUser: (pin) =>
    request("/api/auth/user/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pin,
      }),
    }),
};