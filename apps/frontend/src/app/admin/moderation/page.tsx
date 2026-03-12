"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getUserInfo } from "@/lib/api";

interface ReviewProof {
  id: string;
  fileUrl: string;
  fileType: string;
  ocrText: string | null;
  caption: string | null;
}

interface Verification {
  id: string;
  signals: any;
  finalStatus: string;
}

interface PendingReview {
  id: string;
  publicHandle: string;
  overallScore: number;
  text: string | null;
  status: string;
  verificationScore: number | null;
  createdAt: string;
  listing: { id: string; name: string; address: string; city: string };
  proofs: ReviewProof[];
  verification: Verification | null;
}

export default function ModerationPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const user = getUserInfo();
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
      router.push("/auth/login");
      return;
    }
    setAuthorized(true);
    loadPending();
  }, []);

  async function loadPending() {
    try {
      const data = await apiFetch("/admin/moderation/pending");
      setReviews(data);
    } catch (err: any) {
      console.error("Failed to load:", err);
      if (err.message?.includes("401") || err.message?.includes("403")) {
        router.push("/auth/login");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(reviewId: string, action: "approve" | "reject") {
    setActionLoading(reviewId);
    try {
      await apiFetch(`/admin/moderation/${reviewId}/${action}`, { method: "POST" });
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.error(`Failed to ${action}:`, err);
    } finally {
      setActionLoading(null);
    }
  }

  if (!authorized) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px", color: "var(--text-muted)" }}>
        Checking authorization...
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ marginBottom: "40px" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "8px" }}>
          🛡️ Moderation <span className="gradient-text">Queue</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Review and approve/reject pending submissions
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          Loading moderation queue...
        </div>
      ) : reviews.length === 0 ? (
        <div className="card" style={{ padding: "60px", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🎉</div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>All Clear!</h2>
          <p style={{ color: "var(--text-muted)" }}>No reviews pending moderation</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 500 }}>
            {reviews.length} review{reviews.length !== 1 ? "s" : ""} pending
          </div>

          {reviews.map((review) => (
            <div key={review.id} className="card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 700 }}>{review.publicHandle}</span>
                    <span className="badge badge-pending">⏳ Pending</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    For: <strong style={{ color: "var(--text-secondary)" }}>{review.listing.name}</strong> — {review.listing.city}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {new Date(review.createdAt).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ background: "#fef3c7", color: "#d97706", padding: "4px 10px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 700 }}>
                    ⭐ {review.overallScore}
                  </span>
                  {review.verificationScore !== null && (
                    <span style={{
                      background: review.verificationScore >= 70 ? "var(--success-light)" : review.verificationScore >= 40 ? "var(--warning-light)" : "var(--danger-light)",
                      color: review.verificationScore >= 70 ? "var(--success)" : review.verificationScore >= 40 ? "var(--warning)" : "var(--danger)",
                      padding: "4px 10px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 700,
                    }}>
                      Trust: {review.verificationScore}%
                    </span>
                  )}
                </div>
              </div>

              {review.text && (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "16px", padding: "12px", background: "var(--bg-primary)", borderRadius: "var(--radius-sm)" }}>
                  &ldquo;{review.text}&rdquo;
                </p>
              )}

              {review.proofs.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>📎 Proofs ({review.proofs.length})</div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {review.proofs.map((proof) => (
                      <div key={proof.id} style={{ padding: "8px 12px", background: "var(--bg-primary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", fontSize: "0.8rem" }}>
                        <div style={{ fontWeight: 600 }}>{proof.fileType}</div>
                        {proof.ocrText && <div style={{ color: "var(--text-muted)", marginTop: "2px" }}>OCR: {proof.ocrText.slice(0, 50)}...</div>}
                        {proof.caption && <div style={{ color: "var(--text-muted)", marginTop: "2px" }}>Caption: {proof.caption}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {review.verification && (
                <div style={{ marginBottom: "16px", padding: "12px", background: "var(--bg-primary)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>🤖 AI Signals</div>
                  <pre style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                    {JSON.stringify(review.verification.signals, null, 2)}
                  </pre>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button className="btn-danger" onClick={() => handleAction(review.id, "reject")} disabled={actionLoading === review.id}>✕ Reject</button>
                <button className="btn-success" onClick={() => handleAction(review.id, "approve")} disabled={actionLoading === review.id}>✓ Approve</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
