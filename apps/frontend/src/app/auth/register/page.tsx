"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, setToken, setUserInfo } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [publicHandle, setPublicHandle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!publicHandle.trim()) { setError("Username is required"); return; }
    setLoading(true);

    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, publicHandle }),
      });
      setToken(data.token);
      setUserInfo({ publicHandle: data.user.publicHandle, role: data.user.role, email: data.user.email });
      router.push("/listings");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-enter" style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "calc(100vh - 64px)", padding: "20px",
    }}>
      <div className="card" style={{ padding: "40px", width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "8px" }}>
            Create <span className="gradient-text">Account</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Join to share verified reviews</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, marginBottom: "6px", display: "block" }}>Username *</label>
            <input className="input-field" type="text" placeholder="your_username" value={publicHandle} onChange={(e) => setPublicHandle(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, marginBottom: "6px", display: "block" }}>Email</label>
            <input className="input-field" type="email" placeholder="your@email.com (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, marginBottom: "6px", display: "block" }}>Password</label>
            <input className="input-field" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "var(--danger-light)", borderRadius: "var(--radius-sm)", color: "var(--danger)", fontSize: "0.85rem" }}>{error}</div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}
            style={{ width: "100%", padding: "12px", justifyContent: "center", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/auth/login" style={{ color: "var(--accent-primary)", textDecoration: "none", fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
