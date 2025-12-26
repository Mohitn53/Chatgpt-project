const API_BASE = "http://localhost:3001/auth";

/* ========== REGISTER ========== */
export const registerUser = async (payload) => {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // 🔥 cookie support
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

/* ========== LOGIN ========== */
export const loginUser = async (payload) => {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // 🔥 cookie support
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const getMe = async () => {
  const res = await fetch("http://localhost:3001/auth/me", {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
};

