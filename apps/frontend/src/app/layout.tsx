import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "PG Review — Verified PG & Hostel Reviews",
  description: "Find trusted, verified reviews for PGs and hostels near your college. Real photos, real experiences, verified by AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main style={{ minHeight: "calc(100vh - 64px)", paddingTop: "64px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
