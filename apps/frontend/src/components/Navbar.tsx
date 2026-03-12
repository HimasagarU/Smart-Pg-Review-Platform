"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getToken, clearToken } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ publicHandle: string; role: string; email: string } | null>(null);

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  function checkAuth() {
    const token = getToken();
    if (token) {
      try {
        // Decode JWT payload (base64)
        const payload = JSON.parse(atob(token.split(".")[1]));
        // We stored userId in token; read user info from localStorage
        const userInfo = localStorage.getItem("user_info");
        if (userInfo) {
          setUser(JSON.parse(userInfo));
        } else {
          setUser({ publicHandle: "User", role: "USER", email: "" });
        }
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }

  function handleLogout() {
    clearToken();
    localStorage.removeItem("user_info");
    setUser(null);
    router.push("/");
  }

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "64px",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 clamp(16px, 4vw, 40px)",
        zIndex: 1000,
      }}
    >
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          textDecoration: "none",
        }}
      >
        <span style={{ fontSize: "1.3rem" }}>🏠</span>
        <span
          style={{
            fontSize: "1.15rem",
            fontWeight: 800,
            color: "var(--accent-primary)",
          }}
        >
          PG Review
        </span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <Link
          href="/listings"
          style={{
            color: pathname === "/listings" ? "var(--accent-primary)" : "var(--text-secondary)",
            textDecoration: "none",
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          Browse PGs
        </Link>

        {user && (user.role === "ADMIN" || user.role === "MODERATOR") && (
          <>
            <Link
              href="/admin"
              style={{
                color: pathname === "/admin" ? "var(--accent-primary)" : "var(--text-secondary)",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/moderation"
              style={{
                color: pathname === "/admin/moderation" ? "var(--accent-primary)" : "var(--text-secondary)",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              Moderation
            </Link>
          </>
        )}

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 12px",
              borderRadius: "999px",
              background: "var(--accent-light)",
            }}>
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "var(--accent-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}>
                {user.publicHandle.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-primary)" }}>
                {user.publicHandle}
              </span>
              {(user.role === "ADMIN" || user.role === "MODERATOR") && (
                <span style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  background: "var(--accent-primary)",
                  color: "white",
                  padding: "1px 6px",
                  borderRadius: "4px",
                }}>
                  {user.role}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: "none",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                padding: "6px 14px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.8rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link href="/auth/login" className="btn-primary" style={{ fontSize: "0.85rem", padding: "8px 20px" }}>
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
