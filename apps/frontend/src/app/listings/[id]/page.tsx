"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface Review {
  id: string;
  publicHandle: string;
  overallScore: number;
  ratingsJson: Record<string, number>;
  text: string | null;
  status: string;
  verificationScore: number | null;
  createdAt: string;
  verification: { finalStatus: string } | null;
  proofs: { id: string; fileType: string; caption: string | null; imageUrl?: string }[];
}

interface Listing {
  id: string;
  name: string;
  address: string;
  city: string;
  gender: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  description: string | null;
  mainImageUrl: string | null;
  reviewCount: number;
  avgRating: number | null;
  reviews: Review[];
}

export default function ListingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadListing(); }, [id]);

  async function loadListing() {
    try {
      const data = await apiFetch(`/listings/${id}`);
      setListing(data);
    } catch {
      setListing(getDemoListing(id));
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ textAlign: "center", padding: "100px 20px", color: "var(--text-muted)" }}>Loading...</div>;
  if (!listing) return (
    <div style={{ textAlign: "center", padding: "100px 20px" }}>
      <h2 style={{ color: "var(--text-muted)" }}>Listing not found</h2>
      <Link href="/listings" className="btn-primary" style={{ marginTop: "20px", display: "inline-block" }}>← Back</Link>
    </div>
  );

  const cats = ["Cleanliness", "Food", "WiFi", "Safety", "Value"];

  return (
    <div className="page-enter" style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
      <Link href="/listings" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.85rem", display: "inline-block", marginBottom: "20px" }}>
        ← Back to listings
      </Link>

      {/* Header */}
      <div className="card" style={{ padding: "32px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "8px" }}>{listing.name}</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>📍 {listing.address}, {listing.city}</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {listing.gender && <span className="badge" style={{ background: "var(--accent-light)", color: "var(--accent-primary)" }}>{listing.gender}</span>}
              {listing.budgetMin && listing.budgetMax && (
                <span className="badge" style={{ background: "var(--success-light)", color: "var(--success)" }}>
                  ₹{listing.budgetMin.toLocaleString()} - ₹{listing.budgetMax.toLocaleString()}/mo
                </span>
              )}
            </div>
          </div>
          {listing.avgRating && (
            <div style={{ textAlign: "center", background: "var(--accent-light)", padding: "16px 24px", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-primary)" }}>{listing.avgRating}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{listing.reviewCount} reviews</div>
            </div>
          )}
        </div>
        {listing.description && (
          <p style={{ color: "var(--text-secondary)", marginTop: "16px", lineHeight: 1.7 }}>{listing.description}</p>
        )}
      </div>

      {/* Reviews Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>Reviews ({listing.reviewCount})</h2>
        <Link href={`/listings/${id}/review`} className="btn-primary">✍️ Write a Review</Link>
      </div>

      {/* Reviews */}
      {listing.reviews.length === 0 ? (
        <div className="card" style={{ padding: "48px", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>No reviews yet. Be the first!</p>
          <Link href={`/listings/${id}/review`} className="btn-primary">✍️ Write the First Review</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {listing.reviews.map((review) => (
            <div key={review.id} className="card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.85rem", fontWeight: 700 }}>
                    {review.publicHandle.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{review.publicHandle}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(review.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {(review.verification?.finalStatus === "APPROVED" || (review.verificationScore && review.verificationScore >= 70)) && (
                    <span className="badge badge-verified" style={{ background: "var(--success-light)", color: "var(--success)" }}>✓ Trust Score: {review.verificationScore}%</span>
                  )}
                  <span style={{ background: "#fef3c7", color: "#d97706", padding: "4px 10px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 700 }}>⭐ {review.overallScore}</span>
                </div>
              </div>

              {/* Rating bars */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px", marginBottom: "12px" }}>
                {cats.map((cat) => {
                  const val = (review.ratingsJson as any)?.[cat.toLowerCase()] || 0;
                  return (
                    <div key={cat} style={{ fontSize: "0.8rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                        <span style={{ color: "var(--text-muted)" }}>{cat}</span>
                        <span style={{ fontWeight: 600 }}>{val}/5</span>
                      </div>
                      <div style={{ height: "4px", background: "#f3f4f6", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: `${(val / 5) * 100}%`, height: "100%", background: "var(--accent-gradient)", borderRadius: "2px" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {review.text && <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "16px" }}>{review.text}</p>}

              {review.proofs && review.proofs.length > 0 && (
                <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
                  {review.proofs.map((proof) => (
                    proof.imageUrl && (
                      <div key={proof.id} style={{ position: "relative", width: "120px", height: "120px", flexShrink: 0 }}>
                        <img 
                          src={proof.imageUrl} 
                          alt={proof.caption || "Review proof"} 
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--radius-md)" }}
                        />
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getDemoListing(id: string): Listing {
  return {
    id, name: "Sunshine PG for Men", address: "12, MG Road, Near Metro Station", city: "Bangalore", gender: "Co-living", budgetMin: 6000, budgetMax: 12000,
    description: "Spacious rooms with attached bathrooms, 24/7 water supply, high-speed WiFi, and homemade food.",
    mainImageUrl: null, reviewCount: 3, avgRating: 4.2,
    reviews: [
      { id: "r1", publicHandle: "student_user", overallScore: 4.4, ratingsJson: { cleanliness: 5, food: 4, wifi: 4, safety: 5, value: 4 }, text: "Great PG! Clean rooms and good food.", status: "APPROVED", verificationScore: 82, createdAt: "2026-03-01T10:00:00Z", verification: { finalStatus: "APPROVED" }, proofs: [] },
      { id: "r2", publicHandle: "anon-x8k2m1", overallScore: 3.8, ratingsJson: { cleanliness: 4, food: 3, wifi: 3, safety: 5, value: 4 }, text: "Decent place. Good location near metro.", status: "APPROVED", verificationScore: 65, createdAt: "2026-02-15T14:30:00Z", verification: { finalStatus: "APPROVED" }, proofs: [] },
    ],
  };
}
