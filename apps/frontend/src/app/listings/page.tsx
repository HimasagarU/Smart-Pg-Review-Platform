"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface Listing {
  id: string;
  name: string;
  address: string;
  city: string;
  gender: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  mainImageUrl: string | null;
  description: string | null;
  reviewCount: number;
  avgRating: number | null;
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  useEffect(() => { loadListings(); }, []);

  async function loadListings() {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (cityFilter) params.set("city", cityFilter);
      const data = await apiFetch(`/listings?${params.toString()}`);
      setListings(data);
    } catch {
      setListings(getDemoListings());
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    loadListings();
  }

  return (
    <div className="page-enter" style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "8px" }}>
          Browse <span className="gradient-text">PG Listings</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Find verified PGs and hostels near your college
        </p>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }}>
        <input className="input-field" placeholder="Search by name or address..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: "1 1 300px" }} />
        <input className="input-field" placeholder="Filter by city..." value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} style={{ flex: "0 1 200px" }} />
        <button type="submit" className="btn-primary">🔍 Search</button>
      </form>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>Loading listings...</div>
      ) : listings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ fontSize: "1.2rem", color: "var(--text-muted)", marginBottom: "16px" }}>No listings found</p>
          <Link href="/listings/new" className="btn-primary">+ Add a PG Listing</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listings/${listing.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div className="card" style={{ overflow: "hidden", cursor: "pointer" }}>
        <div style={{
          height: "160px",
          background: listing.mainImageUrl
            ? `url(${listing.mainImageUrl}) center/cover`
            : "linear-gradient(135deg, #eef2ff, #e0e7ff)",
          display: "flex", alignItems: "center", justifyContent: "center",
          borderBottom: "1px solid var(--border-subtle)",
        }}>
          {!listing.mainImageUrl && <span style={{ fontSize: "2.5rem", opacity: 0.5 }}>🏠</span>}
        </div>

        <div style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>{listing.name}</h3>
            {listing.avgRating && (
              <span style={{ background: "#fef3c7", color: "#d97706", padding: "2px 8px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700 }}>
                ⭐ {listing.avgRating}
              </span>
            )}
          </div>

          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
            📍 {listing.address}, {listing.city}
          </p>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            {listing.gender && (
              <span className="badge" style={{ background: "var(--accent-light)", color: "var(--accent-primary)" }}>{listing.gender}</span>
            )}
            {listing.budgetMin && listing.budgetMax && (
              <span className="badge" style={{ background: "var(--success-light)", color: "var(--success)" }}>
                ₹{listing.budgetMin.toLocaleString()} - ₹{listing.budgetMax.toLocaleString()}
              </span>
            )}
          </div>

          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {listing.reviewCount} verified review{listing.reviewCount !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </Link>
  );
}

function getDemoListings(): Listing[] {
  return [
    { id: "demo-1", name: "Sunshine PG for Men", address: "12, MG Road, Near Metro Station", city: "Bangalore", gender: "Male", budgetMin: 6000, budgetMax: 12000, mainImageUrl: null, description: "Spacious rooms with attached bathrooms", reviewCount: 15, avgRating: 4.2 },
    { id: "demo-2", name: "Green Valley Ladies Hostel", address: "45, Koramangala 5th Block", city: "Bangalore", gender: "Female", budgetMin: 7000, budgetMax: 14000, mainImageUrl: null, description: "Safe and secure hostel for working women", reviewCount: 22, avgRating: 4.5 },
    { id: "demo-3", name: "Student's Paradise PG", address: "78, Ameerpet Main Road", city: "Hyderabad", gender: "Unisex", budgetMin: 5000, budgetMax: 9000, mainImageUrl: null, description: "Budget-friendly PG near coaching centers", reviewCount: 8, avgRating: 3.8 },
    { id: "demo-4", name: "Royal Residency PG", address: "23, Anna Nagar, Near IIT", city: "Chennai", gender: "Male", budgetMin: 8000, budgetMax: 15000, mainImageUrl: null, description: "Premium PG with gym and laundry", reviewCount: 31, avgRating: 4.7 },
    { id: "demo-5", name: "Comfort Zone Hostel", address: "56, Viman Nagar", city: "Pune", gender: "Female", budgetMin: 6500, budgetMax: 11000, mainImageUrl: null, description: "Home-like atmosphere with homemade food", reviewCount: 19, avgRating: 4.3 },
    { id: "demo-6", name: "Metro View PG", address: "89, Sector 62, Near Noida Metro", city: "Noida", gender: "Unisex", budgetMin: 5500, budgetMax: 10000, mainImageUrl: null, description: "Well-connected PG with metro access", reviewCount: 12, avgRating: 3.9 },
  ];
}
