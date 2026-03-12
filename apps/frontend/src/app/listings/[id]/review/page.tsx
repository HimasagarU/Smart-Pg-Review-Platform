"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, isLoggedIn } from "@/lib/api";
import Link from "next/link";

const RATING_CATEGORIES = [
  { key: "cleanliness", label: "🧹 Cleanliness", desc: "Room, bathroom, common areas" },
  { key: "food", label: "🍛 Food Quality", desc: "Taste, variety, hygiene" },
  { key: "wifi", label: "📶 WiFi / Internet", desc: "Speed and reliability" },
  { key: "safety", label: "🔒 Safety & Security", desc: "Locks, CCTV, area safety" },
  { key: "value", label: "💰 Value for Money", desc: "Overall worth for the price" },
];

interface ProofFile {
  file: File;
  preview: string;
}

export default function ReviewFormPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [text, setText] = useState("");
  const [proofs, setProofs] = useState<ProofFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function setRating(category: string, value: number) {
    setRatings((prev) => ({ ...prev, [category]: value }));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const newProofs: ProofFile[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setProofs((prev) => [...prev, ...newProofs]);
  }

  function removeProof(index: number) {
    setProofs((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const filledRatings = Object.keys(ratings).filter((k) => ratings[k] > 0);
    if (filledRatings.length < RATING_CATEGORIES.length) {
      setError("Please rate all categories");
      return;
    }

    if (!isLoggedIn()) {
      setError("Please login first to submit a review");
      return;
    }

    setSubmitting(true);

    try {
      // Send files and data directly to our backend via FormData.
      // The Node.js backend will upload to R2, bypassing browser CORS issues completely.
      const formData = new FormData();
      formData.append("ratings", JSON.stringify(ratings));
      if (text) formData.append("text", text);
      
      for (const proof of proofs) {
        formData.append("proofs", proof.file);
      }

      const result = await apiFetch(`/reviews/${listingId}`, {
        method: "POST",
        body: formData,
      });

      setSuccess(true);
      // Store trust score for display
      (window as any).__trustScore = result.verificationScore;
      setTimeout(() => router.push(`/listings/${listingId}`), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    const trustScore = (typeof window !== "undefined" && (window as any).__trustScore) || null;
    return (
      <div className="page-enter" style={{ maxWidth: "600px", margin: "0 auto", padding: "100px 20px", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "20px" }}>🎉</div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "12px" }}>Review Submitted!</h1>
        {trustScore !== null && (
          <div style={{
            display: "inline-block", padding: "12px 24px", borderRadius: "var(--radius-md)", marginBottom: "16px",
            background: trustScore >= 70 ? "var(--success-light)" : trustScore >= 40 ? "var(--warning-light)" : "var(--danger-light)",
            color: trustScore >= 70 ? "var(--success)" : trustScore >= 40 ? "var(--warning)" : "var(--danger)",
          }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{trustScore}%</div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Trust Score</div>
          </div>
        )}
        <p style={{ color: "var(--text-secondary)" }}>Your review is pending moderation. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 20px" }}>
      <Link href={`/listings/${listingId}`} style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.85rem", display: "inline-block", marginBottom: "20px" }}>
        ← Back to listing
      </Link>

      <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "8px" }}>
        Write a <span className="gradient-text">Review</span>
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "32px" }}>
        Share your honest experience. Upload photos for higher verification scores!
      </p>

      <form onSubmit={handleSubmit}>
        {/* Ratings */}
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>Ratings</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {RATING_CATEGORIES.map((cat) => (
              <div key={cat.key} className="card" style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{cat.label}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{cat.desc}</div>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setRating(cat.key, star)}
                        style={{
                          background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem",
                          filter: ratings[cat.key] >= star ? "none" : "grayscale(1) opacity(0.3)",
                          transition: "all 0.15s",
                        }}>⭐</button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Text */}
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "12px" }}>Your Experience</h2>
          <textarea className="input-field" placeholder="Share details about your stay..." value={text} onChange={(e) => setText(e.target.value)} rows={5} style={{ resize: "vertical" }} />
        </div>

        {/* Proof Upload */}
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>Upload Proof 📸</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "12px" }}>
            Photos of your room, food, bills, etc. (Optional — boosts verification score)
          </p>

          <div onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed var(--border-subtle)", borderRadius: "var(--radius-md)",
              padding: "32px", textAlign: "center", cursor: "pointer", background: "#fafafa",
            }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📎</div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Click to upload images</p>
          </div>

          <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" onChange={handleFileSelect} style={{ display: "none" }} />

          {proofs.length > 0 && (
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "16px" }}>
              {proofs.map((proof, i) => (
                <div key={i} style={{ position: "relative", width: "80px", height: "80px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                  <img src={proof.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button type="button" onClick={() => removeProof(i)}
                    style={{ position: "absolute", top: "2px", right: "2px", width: "20px", height: "20px", borderRadius: "50%", background: "var(--danger)", color: "white", border: "none", cursor: "pointer", fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: "12px 16px", background: "var(--danger-light)", borderRadius: "var(--radius-sm)", color: "var(--danger)", fontSize: "0.9rem", marginBottom: "20px" }}>{error}</div>
        )}

        <button type="submit" className="btn-primary" disabled={submitting}
          style={{ width: "100%", padding: "14px", fontSize: "1rem", justifyContent: "center", opacity: submitting ? 0.7 : 1 }}>
          {submitting ? "⏳ Submitting..." : "✍️ Submit Review"}
        </button>
      </form>
    </div>
  );
}
