"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, getUserInfo } from "@/lib/api";

interface Stats {
  users: { total: number; admins: number; moderators: number; owners: number; regular: number };
  listings: { total: number; byCity: { city: string; count: number }[] };
  reviews: { total: number; pending: number; approved: number; rejected: number; flagged: number; withProofs: number; withoutProofs: number; verified: number };
  moderation: { totalActions: number; recentActions: { id: string; action: string; targetType: string; createdAt: string }[] };
  recentReviews: { id: string; publicHandle: string; overallScore: number; status: string; verificationScore: number | null; createdAt: string; listing: { name: string; city: string } }[];
  colleges: number;
  events: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUserInfo();
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
      router.push("/auth/login");
      return;
    }
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await apiFetch("/admin/stats");
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ textAlign: "center", padding: "100px 20px", color: "var(--text-muted)" }}>Loading dashboard...</div>;
  if (!stats) return <div style={{ textAlign: "center", padding: "100px 20px", color: "var(--text-muted)" }}>Failed to load stats</div>;

  const statCards = [
    { label: "Total Users", value: stats.users.total, icon: "👥", color: "#6366f1" },
    { label: "Admins", value: stats.users.admins, icon: "🛡️", color: "#8b5cf6" },
    { label: "Moderators", value: stats.users.moderators, icon: "👮", color: "#a855f7" },
    { label: "PG Listings", value: stats.listings.total, icon: "🏠", color: "#3b82f6" },
    { label: "Total Reviews", value: stats.reviews.total, icon: "✍️", color: "#10b981" },
    { label: "Verified Reviews", value: stats.reviews.verified, icon: "✅", color: "#059669" },
  ];

  const reviewBreakdown = [
    { label: "Approved", value: stats.reviews.approved, color: "#16a34a", bg: "#dcfce7" },
    { label: "Pending", value: stats.reviews.pending, color: "#d97706", bg: "#fef3c7" },
    { label: "Rejected", value: stats.reviews.rejected, color: "#dc2626", bg: "#fef2f2" },
    { label: "Flagged", value: stats.reviews.flagged, color: "#7c3aed", bg: "#f3e8ff" },
    { label: "With Proofs", value: stats.reviews.withProofs, color: "#0891b2", bg: "#e0f2fe" },
    { label: "Without Proofs", value: stats.reviews.withoutProofs, color: "#64748b", bg: "#f1f5f9" },
  ];

  return (
    <div className="page-enter" style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "4px" }}>
            📊 Admin <span className="gradient-text">Dashboard</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Platform overview and analytics</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/admin/moderation" className="btn-primary" style={{ fontSize: "0.85rem" }}>🛡️ Moderation Queue ({stats.reviews.pending})</Link>
          <button onClick={loadStats} className="btn-secondary" style={{ fontSize: "0.85rem" }}>🔄 Refresh</button>
        </div>
      </div>

      {/* Top Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {statCards.map((s) => (
          <div key={s.label} className="card" style={{ padding: "24px", textAlign: "center" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "6px" }}>{s.icon}</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500, marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "32px" }}>
        {/* Review Breakdown */}
        <div className="card" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>📋 Review Breakdown</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {reviewBreakdown.map((item) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color }} />
                  <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{item.label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700 }}>{item.value}</span>
                  <div style={{
                    width: `${Math.max(20, (item.value / Math.max(stats.reviews.total, 1)) * 100)}px`,
                    height: "6px", borderRadius: "3px", background: item.bg,
                  }}>
                    <div style={{
                      width: `${(item.value / Math.max(stats.reviews.total, 1)) * 100}%`,
                      height: "100%", borderRadius: "3px", background: item.color, minWidth: "2px",
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Listings by City */}
        <div className="card" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>🏙️ Listings by City</h2>
          {stats.listings.byCity.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No data yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {stats.listings.byCity.map((city) => (
                <div key={city.city} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>📍 {city.city}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.95rem", fontWeight: 700 }}>{city.count}</span>
                    <div style={{ width: `${Math.max(20, (city.count / Math.max(stats.listings.total, 1)) * 120)}px`, height: "6px", borderRadius: "3px", background: "#6366f1" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: "20px", padding: "12px", background: "var(--bg-primary)", borderRadius: "var(--radius-sm)", fontSize: "0.8rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
              <span>Colleges tracked</span><span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{stats.colleges}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", marginTop: "4px" }}>
              <span>Events logged</span><span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{stats.events}</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Breakdown */}
      <div className="card" style={{ padding: "24px", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>👥 User Breakdown</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
          {[
            { label: "Admins", value: stats.users.admins, color: "#6366f1", bg: "#eef2ff" },
            { label: "Moderators", value: stats.users.moderators, color: "#8b5cf6", bg: "#f5f3ff" },
            { label: "Owners", value: stats.users.owners, color: "#f59e0b", bg: "#fef3c7" },
            { label: "Regular", value: stats.users.regular, color: "#10b981", bg: "#dcfce7" },
          ].map((u) => (
            <div key={u.label} style={{
              padding: "16px", borderRadius: "var(--radius-sm)", background: u.bg, textAlign: "center",
            }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: u.color }}>{u.value}</div>
              <div style={{ fontSize: "0.8rem", color: u.color, fontWeight: 500 }}>{u.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Moderation Activity */}
      <div className="card" style={{ padding: "24px", marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>🛡️ Moderation Activity</h2>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{stats.moderation.totalActions} total actions</span>
        </div>
        {stats.moderation.recentActions.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No moderation actions yet</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {stats.moderation.recentActions.map((a) => (
              <div key={a.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", background: "var(--bg-primary)", borderRadius: "var(--radius-sm)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700,
                    background: a.action === "APPROVE" ? "#dcfce7" : a.action === "REJECT" ? "#fef2f2" : "#fef3c7",
                    color: a.action === "APPROVE" ? "#16a34a" : a.action === "REJECT" ? "#dc2626" : "#d97706",
                  }}>
                    {a.action}
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{a.targetType}</span>
                </div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{new Date(a.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Reviews */}
      <div className="card" style={{ padding: "24px" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>📝 Recent Reviews</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-subtle)" }}>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-muted)", fontWeight: 600 }}>User</th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-muted)", fontWeight: 600 }}>PG Listing</th>
                <th style={{ textAlign: "center", padding: "10px 12px", color: "var(--text-muted)", fontWeight: 600 }}>Rating</th>
                <th style={{ textAlign: "center", padding: "10px 12px", color: "var(--text-muted)", fontWeight: 600 }}>Trust</th>
                <th style={{ textAlign: "center", padding: "10px 12px", color: "var(--text-muted)", fontWeight: 600 }}>Status</th>
                <th style={{ textAlign: "right", padding: "10px 12px", color: "var(--text-muted)", fontWeight: 600 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentReviews.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 500 }}>{r.publicHandle}</td>
                  <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>{r.listing.name} <span style={{ color: "var(--text-muted)" }}>({r.listing.city})</span></td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>⭐ {r.overallScore}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    {r.verificationScore !== null ? (
                      <span style={{
                        padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700,
                        background: r.verificationScore >= 70 ? "#dcfce7" : r.verificationScore >= 40 ? "#fef3c7" : "#fef2f2",
                        color: r.verificationScore >= 70 ? "#16a34a" : r.verificationScore >= 40 ? "#d97706" : "#dc2626",
                      }}>{r.verificationScore}%</span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    <span className={`badge badge-${r.status === "APPROVED" ? "verified" : r.status === "PENDING" ? "pending" : "rejected"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-muted)", fontSize: "0.8rem" }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
