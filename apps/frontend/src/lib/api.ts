const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function apiFetch(path: string, options?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };
  
  if (options?.body instanceof FormData) {
    // Let browser set Content-Type with multipart boundary
    delete headers["Content-Type"];
  } else if (!headers["Content-Type"]) {
    // Default to JSON
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function setUserInfo(user: { publicHandle: string; role: string; email: string | null }) {
  localStorage.setItem("user_info", JSON.stringify(user));
}

export function getUserInfo(): { publicHandle: string; role: string; email: string | null } | null {
  if (typeof window === "undefined") return null;
  const info = localStorage.getItem("user_info");
  return info ? JSON.parse(info) : null;
}

export function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

export function clearToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user_info");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
