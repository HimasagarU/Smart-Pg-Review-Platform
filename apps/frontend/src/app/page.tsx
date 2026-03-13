import Link from "next/link";

export default function HomePage() {
  return (
    <div className="page-enter">
      {/* Hero */}
      <section style={{
        textAlign: "center",
        padding: "80px 20px 60px",
        maxWidth: "800px",
        margin: "0 auto",
      }}>
        <div style={{
          display: "inline-block",
          padding: "6px 16px",
          borderRadius: "999px",
          background: "var(--accent-light)",
          color: "var(--accent-primary)",
          fontSize: "0.8rem",
          fontWeight: 600,
          marginBottom: "20px",
        }}>
          ✓ AI-Verified Reviews
        </div>

        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, lineHeight: 1.2, marginBottom: "16px" }}>
          Find Your Perfect{" "}
          <span className="gradient-text">PG & Hostel</span>
        </h1>

        <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", maxWidth: "560px", margin: "0 auto 32px", lineHeight: 1.7 }}>
          Real reviews, verified by AI. Upload proof of your stay and help others find trustworthy accommodation.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/listings" className="btn-primary" style={{ padding: "12px 32px", fontSize: "1rem" }}>
            Browse PGs →
          </Link>
          <Link href="/auth/register" className="btn-secondary" style={{ padding: "12px 32px", fontSize: "1rem" }}>
            Write a Review
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "40px 20px 60px", maxWidth: "1000px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: 700, marginBottom: "40px" }}>
          How It <span className="gradient-text">Works</span>
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
          {[
            { icon: "✍️", title: "Write a Review", desc: "Rate your PG on cleanliness, food, WiFi, safety, and value. Share your real experience." },
            { icon: "📸", title: "Upload Proof", desc: "Add photos of your room, food, or bills. Our AI verifies them for authenticity." },
            { icon: "🤖", title: "AI Verification", desc: "OCR, image analysis, and CLIP scoring ensure every review is genuine and trustworthy." },
            { icon: "✅", title: "Trust Score", desc: "Each review gets a verification score. Higher proof = higher trust for future tenants." },
          ].map((item) => (
            <div key={item.title} className="card" style={{ padding: "28px", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "12px" }}>{item.icon}</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "8px" }}>{item.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
