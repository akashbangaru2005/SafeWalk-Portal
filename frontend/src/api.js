const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  base: BASE,
  userLogin: (pin) => request("/api/auth/user", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({pin})
  }),
  adminLogin: (password) => request("/api/auth/admin", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({password})
  }),
  createReport: (token, form) => request("/api/reports", {
    method: "POST",
    headers: {"X-Session-Token": token},
    body: form
  }),
  mine: (token) => request("/api/reports/mine", {
    headers: {"X-Session-Token": token}
  }),
  reports: (token) => request("/api/reports", {
    headers: {"X-Session-Token": token}
  }),
  stats: (token) => request("/api/admin/stats", {
    headers: {"X-Session-Token": token}
  }),
  updateStatus: (token, id, status) => request(`/api/reports/${id}/status`, {
    method: "PATCH",
    headers: {"X-Session-Token": token, "Content-Type": "application/json"},
    body: JSON.stringify({status})
  }),
  checkUserPin: (pin) =>
    request("/api/auth/user/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        pin
      })
    }),
  registerUser: (pin) =>
    request("/api/auth/user/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        pin
      })
    })
  };
