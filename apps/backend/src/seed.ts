// DATABASE_URL must be set as env var before running this script
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // 1. Create users
  const adminPassword = await bcrypt.hash("admin123", 12);
  const userPassword = await bcrypt.hash("user123", 12);

  const admin = await prisma.user.upsert({
    where: { publicHandle: "admin" },
    update: {},
    create: {
      email: "admin@pgreview.com",
      passwordHash: adminPassword,
      publicHandle: "admin",
      role: "ADMIN",
      emailVerified: true,
    },
  });
  console.log(`✅ Admin user: ${admin.email} (handle: ${admin.publicHandle})`);

  const mod = await prisma.user.upsert({
    where: { publicHandle: "moderator_sam" },
    update: {},
    create: {
      email: "mod@pgreview.com",
      passwordHash: userPassword,
      publicHandle: "moderator_sam",
      role: "MODERATOR",
      emailVerified: true,
    },
  });
  console.log(`✅ Moderator: ${mod.email} (handle: ${mod.publicHandle})`);

  const user1 = await prisma.user.upsert({
    where: { publicHandle: "rahul_student" },
    update: {},
    create: {
      email: "rahul@gmail.com",
      passwordHash: userPassword,
      publicHandle: "rahul_student",
      role: "USER",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { publicHandle: "priya_engineer" },
    update: {},
    create: {
      email: "priya@gmail.com",
      passwordHash: userPassword,
      publicHandle: "priya_engineer",
      role: "USER",
    },
  });

  const user3 = await prisma.user.upsert({
    where: { publicHandle: "ankit_dev" },
    update: {},
    create: {
      email: "ankit@gmail.com",
      passwordHash: userPassword,
      publicHandle: "ankit_dev",
      role: "USER",
    },
  });

  console.log(`✅ Created 3 regular users: rahul_student, priya_engineer, ankit_dev\n`);

  // 2. Create PG Listings
  const listings = await Promise.all([
    prisma.pGListing.create({
      data: {
        ownerId: admin.id,
        name: "Sunshine PG for Men",
        address: "12, MG Road, Near Metro Station",
        city: "Bangalore",
        lat: 12.9716,
        lng: 77.5946,
        budgetMin: 6000,
        budgetMax: 12000,
        gender: "Male",
        description: "Spacious rooms with attached bathrooms, 24/7 hot water, high-speed WiFi, and homemade North & South Indian food. 5 min walk from MG Road Metro. Ideal for IT professionals and students.",
      },
    }),
    prisma.pGListing.create({
      data: {
        ownerId: admin.id,
        name: "Green Valley Ladies Hostel",
        address: "45, Koramangala 5th Block, Near Sony Signal",
        city: "Bangalore",
        lat: 12.9352,
        lng: 77.6245,
        budgetMin: 7000,
        budgetMax: 14000,
        gender: "Female",
        description: "Safe and secure hostel for working women and students. CCTV surveillance, biometric entry, AC rooms available. Vegetarian meals served 3 times a day. Power backup and laundry service included.",
      },
    }),
    prisma.pGListing.create({
      data: {
        ownerId: admin.id,
        name: "Student's Paradise PG",
        address: "78, Ameerpet Main Road, Near Kukatpally",
        city: "Hyderabad",
        lat: 17.4375,
        lng: 78.4483,
        budgetMin: 5000,
        budgetMax: 9000,
        gender: "Unisex",
        description: "Budget-friendly PG near coaching centers and IT parks. Basic rooms with shared bathrooms. WiFi, parking, and meals available at extra cost. Good transport connectivity.",
      },
    }),
    prisma.pGListing.create({
      data: {
        ownerId: admin.id,
        name: "Royal Residency PG",
        address: "23, Anna Nagar, Near IIT Madras",
        city: "Chennai",
        lat: 13.0827,
        lng: 80.2707,
        budgetMin: 8000,
        budgetMax: 15000,
        gender: "Male",
        description: "Premium PG with gym, swimming pool access, laundry service, and AC rooms. Home-cooked meals by experienced chef. Study room with high-speed fiber WiFi. 10 min walk from IIT campus.",
      },
    }),
    prisma.pGListing.create({
      data: {
        ownerId: admin.id,
        name: "Comfort Zone Hostel",
        address: "56, Viman Nagar, Near Airport Road",
        city: "Pune",
        lat: 18.5679,
        lng: 73.9143,
        budgetMin: 6500,
        budgetMax: 11000,
        gender: "Female",
        description: "Home-like atmosphere with homemade Maharashtrian food. Clean rooms, weekly housekeeping, and 24/7 security. Near IT Hub and Pune Airport. Great for working professionals.",
      },
    }),
    prisma.pGListing.create({
      data: {
        name: "Metro View PG",
        address: "89, Sector 62, Near Noida Electronic City Metro",
        city: "Noida",
        lat: 28.6270,
        lng: 77.3726,
        budgetMin: 5500,
        budgetMax: 10000,
        gender: "Unisex",
        description: "Well-connected PG with direct metro access. Modern rooms with attached washrooms. RO water, power backup, and high-speed WiFi. Perfect for professionals working in Noida-Greater Noida IT corridor.",
      },
    }),
  ]);

  console.log(`✅ Created ${listings.length} PG listings\n`);

  // 3. Create Reviews (mix of APPROVED and PENDING)
  const reviewsData = [
    {
      listing: listings[0], user: user1, handle: "rahul_student",
      ratings: { cleanliness: 5, food: 4, wifi: 4, safety: 5, value: 4 },
      score: 4.4, text: "Great PG! The rooms are very clean and spacious. Food quality is consistently good — both North and South Indian options. WiFi could be slightly faster during peak evening hours, but overall fantastic for the price. The metro proximity is a huge plus.",
      status: "APPROVED", verScore: 82,
    },
    {
      listing: listings[0], user: user2, handle: "priya_engineer",
      ratings: { cleanliness: 4, food: 3, wifi: 3, safety: 5, value: 4 },
      score: 3.8, text: "Decent place to stay. Location is excellent near MG Road. Food quality varies — some days are great, others not so much. Staff is friendly and helpful. Safety is top-notch with good security.",
      status: "APPROVED", verScore: 65,
    },
    {
      listing: listings[1], user: user2, handle: "priya_engineer",
      ratings: { cleanliness: 5, food: 5, wifi: 4, safety: 5, value: 5 },
      score: 4.8, text: "Best ladies hostel in Koramangala! I feel extremely safe here with CCTV and biometric entry. The food is amazing — fresh and healthy vegetarian meals. Rooms are spacious and well-maintained. Highly recommend for women working in the area!",
      status: "APPROVED", verScore: 91,
    },
    {
      listing: listings[1], user: user3, handle: "ankit_dev",
      ratings: { cleanliness: 4, food: 4, wifi: 3, safety: 5, value: 4 },
      score: 4.0, text: "Very good hostel for working women. Security is the best feature. Food is good but could have more variety. WiFi is okay for browsing but video calls can lag sometimes.",
      status: "PENDING", verScore: 45,
    },
    {
      listing: listings[2], user: user1, handle: "rahul_student",
      ratings: { cleanliness: 3, food: 3, wifi: 2, safety: 4, value: 5 },
      score: 3.4, text: "You get what you pay for — it's budget-friendly and that's the main advantage. Cleanliness could be improved. WiFi is quite slow. But the location near coaching centers is unbeatable and the rent is very affordable.",
      status: "APPROVED", verScore: 55,
    },
    {
      listing: listings[3], user: user3, handle: "ankit_dev",
      ratings: { cleanliness: 5, food: 5, wifi: 5, safety: 4, value: 4 },
      score: 4.6, text: "Premium experience! Gym and pool access are amazing perks. The chef cooks incredible meals. WiFi is blazing fast (fiber). Only downside is the price is on the higher side, but the facilities justify it. Close to IIT campus which is great for students.",
      status: "APPROVED", verScore: 88,
    },
    {
      listing: listings[4], user: user2, handle: "priya_engineer",
      ratings: { cleanliness: 4, food: 5, wifi: 4, safety: 4, value: 4 },
      score: 4.2, text: "Love the home-like feeling here! The Maharashtrian food is authentic and delicious. Rooms are comfortable and clean. Weekly housekeeping keeps everything tidy. Great for someone who misses home-cooked food.",
      status: "APPROVED", verScore: 76,
    },
    {
      listing: listings[5], user: user1, handle: "rahul_student",
      ratings: { cleanliness: 3, food: 2, wifi: 4, safety: 3, value: 3 },
      score: 3.0, text: "Average PG. Metro connectivity is the best part. Room quality is mediocre and food options are limited. WiFi works well though. Would be better if they improved cleanliness and food quality.",
      status: "PENDING", verScore: 38,
    },
  ];

  for (const r of reviewsData) {
    const review = await prisma.review.create({
      data: {
        listingId: r.listing.id,
        userId: r.user.id,
        publicHandle: r.handle,
        ratingsJson: r.ratings,
        overallScore: r.score,
        text: r.text,
        status: r.status as any,
        verificationScore: r.verScore,
      },
    });

    // Create verification record for approved reviews
    if (r.status === "APPROVED") {
      await prisma.verification.create({
        data: {
          reviewId: review.id,
          signals: {
            hasProof: r.verScore > 70,
            ocrMatchScore: Math.min(r.verScore, 80),
            captionMatchScore: Math.floor(r.verScore * 0.6),
            phashDupPenalty: 0,
            tamperPenalty: 0,
            behaviorScore: 60,
            ownerTokenBoost: 0,
          },
          finalStatus: "APPROVED",
        },
      });
    }
  }

  console.log(`✅ Created ${reviewsData.length} reviews (${reviewsData.filter(r => r.status === "APPROVED").length} approved, ${reviewsData.filter(r => r.status === "PENDING").length} pending)\n`);

  // 4. Create a college entry
  await prisma.college.create({
    data: {
      name: "Indian Institute of Technology, Bangalore",
      domain: "iiitb.ac.in",
      city: "Bangalore",
    },
  });
  console.log("✅ Created 1 college entry\n");

  console.log("🎉 Seeding complete!");
  console.log("\n--- Test Credentials ---");
  console.log("Admin:     admin@pgreview.com / admin123");
  console.log("Moderator: mod@pgreview.com / user123");
  console.log("User 1:    rahul@gmail.com / user123");
  console.log("User 2:    priya@gmail.com / user123");
  console.log("User 3:    ankit@gmail.com / user123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
