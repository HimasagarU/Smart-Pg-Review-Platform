/**
 * Enhanced seed: Adds more PG listings and high-trust reviews
 * Run: conda activate pgreview && npx tsx scripts/add-pgs.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

const NEW_PGS = [
  {
    name: "Lakshmi Ladies PG",
    address: "14, HSR Layout, Sector 2, Near Silk Board",
    city: "Bangalore",
    gender: "Female",
    budgetMin: 7000,
    budgetMax: 13000,
    description: "Premium ladies PG with AC rooms, attached bathrooms, home-cooked South Indian meals, 24/7 security with CCTV, and high-speed WiFi. Walking distance to tech parks.",
    mainImageUrl: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600",
  },
  {
    name: "TechNest Men's Hostel",
    address: "42, Madhapur, Cyber Towers Road, Near HITEC City",
    city: "Hyderabad",
    gender: "Male",
    budgetMin: 6500,
    budgetMax: 11000,
    description: "Modern hostel for working professionals. Gym, gaming zone, laundry service, and coworking space included. 5 min walk to HITEC City metro.",
    mainImageUrl: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600",
  },
  {
    name: "Chennai Scholar's Home",
    address: "88, Adyar, Near IIT Madras Gate, Sardar Patel Road",
    city: "Chennai",
    gender: "Unisex",
    budgetMin: 5000,
    budgetMax: 9000,
    description: "Budget-friendly PG for students near IIT Madras. Clean rooms, study hall, and homemade meals. Quiet neighborhood perfect for focus.",
    mainImageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600",
  },
  {
    name: "Mumbai Marina PG",
    address: "34, Andheri West, Link Road, Near DN Nagar Metro",
    city: "Mumbai",
    gender: "Unisex",
    budgetMin: 8000,
    budgetMax: 16000,
    description: "Upscale co-living space in the heart of Mumbai. Fully furnished rooms, rooftop lounge, housekeeping, and meals. Perfect for young professionals.",
    mainImageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600",
  },
  {
    name: "Kota Achiever's PG",
    address: "56, Talwandi, Near Allen Career Institute",
    city: "Kota",
    gender: "Male",
    budgetMin: 4000,
    budgetMax: 7000,
    description: "Affordable PG for JEE/NEET aspirants. Peaceful rooms, nutritious meals, study lounge with AC, and proximity to all major coaching centers.",
    mainImageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600",
  },
  {
    name: "Manipal Campus Stay",
    address: "23, Eshwar Nagar, Near MIT Campus Gate",
    city: "Manipal",
    gender: "Unisex",
    budgetMin: 5500,
    budgetMax: 9500,
    description: "Student-favorite PG just 2 min from MIT Manipal. Spacious rooms, fast WiFi, and a vibrant community. Includes breakfast and dinner.",
    mainImageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600",
  },
  {
    name: "Delhi NCR Elite PG",
    address: "12, Sector 62, Near Noida City Center Metro",
    city: "Noida",
    gender: "Female",
    budgetMin: 7000,
    budgetMax: 12000,
    description: "Safe and premium ladies PG in Sector 62. Biometric entry, CCTV, home-style food, and daily housekeeping. 3 min walk to metro.",
    mainImageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600",
  },
  {
    name: "Pune Comfort Zone",
    address: "67, Kothrud, Near MIT College, Paud Road",
    city: "Pune",
    gender: "Female",
    budgetMin: 6000,
    budgetMax: 10500,
    description: "Cozy ladies PG near MIT Pune. Homemade Maharashtrian food, clean rooms with wardrobes, and a friendly warden. Regular pest control.",
    mainImageUrl: "https://images.unsplash.com/photo-1598928506311-c55ez637a57a?w=600",
  },
];

const REVIEW_TEXTS = [
  "Excellent PG! The rooms are spacious and well-maintained. Food quality is consistently good with variety. WiFi works great for video calls. The security guard is present 24/7 which makes me feel safe. Totally worth the rent.",
  "Been staying here for 6 months now. The cleanliness is top-notch — rooms are swept daily and bathrooms are cleaned twice. Food could be slightly better but the location makes up for it. Great value overall.",
  "Very good experience so far. The owner is responsive to complaints and fixes issues quickly. AC works well, hot water is always available. The only downside is parking space is limited.",
  "Perfect for students! Quiet environment, reliable WiFi, and the food is like home-cooked meals. My room has good natural light and ventilation. Highly recommend for anyone studying nearby.",
  "Moved in last month and loving it. The common area has a TV and fridge. Laundry service is available at reasonable cost. The neighborhood is safe and well-connected by public transport.",
  "Decent PG for the price. Rooms are clean, beds are comfortable, and the water purifier is a nice touch. WiFi can be slow during peak hours but generally works fine for browsing and streaming.",
  "Great location and friendly co-residents. The food menu rotates well so you don't get bored. Security is solid with CCTV cameras. Would have given 5 stars if the rooms were slightly bigger.",
  "This PG exceeded my expectations! Everything from the check-in process to the daily routine is well-organized. The warden is helpful and the rules are reasonable. Strongly recommend.",
];

async function addMoreData() {
  console.log("🌱 Adding more PG listings and reviews...\n");

  // Get existing users
  const users = await prisma.user.findMany({
    where: { role: "USER" },
    take: 5,
  });

  if (users.length === 0) {
    console.log("⚠️  No regular users found. Creating some...");
    const hash = await bcrypt.hash("user123", 12);
    for (const u of [
      { publicHandle: "student_user1", email: "student1@gmail.com" },
      { publicHandle: "working_pro", email: "pro@gmail.com" },
      { publicHandle: "pg_reviewer", email: "reviewer@gmail.com" },
    ]) {
      const user = await prisma.user.create({
        data: { ...u, passwordHash: hash },
      });
      users.push(user);
    }
  }

  // Get existing admin for review ownership
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });

  // Add new PG listings
  const createdListings = [];
  for (const pg of NEW_PGS) {
    const existing = await prisma.pGListing.findFirst({
      where: { name: pg.name },
    });

    if (existing) {
      // Update existing listing with image
      await prisma.pGListing.update({
        where: { id: existing.id },
        data: { mainImageUrl: pg.mainImageUrl },
      });
      createdListings.push(existing);
      console.log(`📝 Updated image: ${pg.name}`);
    } else {
      const listing = await prisma.pGListing.create({
        data: {
          ownerId: admin?.id || users[0].id,
          name: pg.name,
          address: pg.address,
          city: pg.city,
          gender: pg.gender,
          budgetMin: pg.budgetMin,
          budgetMax: pg.budgetMax,
          description: pg.description,
          mainImageUrl: pg.mainImageUrl,
        },
      });
      createdListings.push(listing);
      console.log(`✅ Created: ${pg.name} (${pg.city})`);
    }
  }

  // Also update existing listings with images
  const existingListings = await prisma.pGListing.findMany({
    where: { mainImageUrl: null },
  });

  const fallbackImages = [
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600",
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600",
  ];

  for (let i = 0; i < existingListings.length; i++) {
    await prisma.pGListing.update({
      where: { id: existingListings[i].id },
      data: { mainImageUrl: fallbackImages[i % fallbackImages.length] },
    });
    console.log(`🖼️  Added image to: ${existingListings[i].name}`);
  }

  // Add verified reviews to listings
  const allListings = await prisma.pGListing.findMany();
  let reviewCount = 0;

  for (const listing of allListings) {
    // Add 2-3 reviews per listing
    const numReviews = 2 + Math.floor(Math.random() * 2);

    for (let r = 0; r < numReviews; r++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const text = REVIEW_TEXTS[(reviewCount + r) % REVIEW_TEXTS.length];
      const baseRating = 3 + Math.floor(Math.random() * 2.5); // 3-5

      const ratings: Record<string, number> = {
        cleanliness: Math.min(5, baseRating + Math.floor(Math.random() * 2)),
        food: Math.min(5, baseRating + Math.floor(Math.random() * 2) - 1),
        wifi: Math.min(5, baseRating + Math.floor(Math.random() * 2) - 1),
        safety: Math.min(5, baseRating + Math.floor(Math.random() * 2)),
        value: Math.min(5, baseRating + Math.floor(Math.random() * 2)),
      };
      // Ensure all ratings are at least 1
      for (const k of Object.keys(ratings)) {
        ratings[k] = Math.max(1, Math.min(5, ratings[k]));
      }

      const overallScore = parseFloat(
        (Object.values(ratings).reduce((a, b) => a + b, 0) / 5).toFixed(1)
      );

      // Trust score: logged in + 5 ratings + long text = 10+10+15 = 35 base
      // With proof: +25 = 60, With 2 proofs: +7 = 67
      // With OCR/caption from seeded data: +15+15 = 97 max
      // For seeded reviews, give a realistic trust score
      const trustScore = 65 + Math.floor(Math.random() * 20); // 65-85

      const review = await prisma.review.create({
        data: {
          listingId: listing.id,
          userId: user.id,
          publicHandle: user.publicHandle,
          ratingsJson: ratings,
          overallScore,
          text,
          status: trustScore >= 70 ? "APPROVED" : "PENDING",
          verificationScore: trustScore,
        },
      });

      // Create verification record
      await prisma.verification.create({
        data: {
          reviewId: review.id,
          signals: {
            hasProof: false,
            textLength: text.length,
            ratingsCount: 5,
            isLoggedIn: true,
            method: "seeded",
            trustScore,
          },
          finalStatus: trustScore >= 70 ? "APPROVED" : "NEEDS_REVIEW",
        },
      });

      reviewCount++;
    }
  }

  console.log(`\n✅ Added ${reviewCount} new reviews across ${allListings.length} listings`);

  // Summary
  const totalListings = await prisma.pGListing.count();
  const totalReviews = await prisma.review.count();
  const approvedReviews = await prisma.review.count({ where: { status: "APPROVED" } });
  const pendingReviews = await prisma.review.count({ where: { status: "PENDING" } });

  console.log(`\n📊 Database Summary:`);
  console.log(`   PG Listings: ${totalListings}`);
  console.log(`   Total Reviews: ${totalReviews}`);
  console.log(`   Approved: ${approvedReviews}`);
  console.log(`   Pending: ${pendingReviews}`);
  console.log(`\n🎉 Done!`);

  await prisma.$disconnect();
}

addMoreData().catch(console.error);
