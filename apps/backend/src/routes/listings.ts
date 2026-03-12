import express from "express";
import { prisma } from "../lib/prisma";
import { optionalAuth, requireAuth } from "../middleware/auth";

const router = express.Router();

// GET /listings — list all PG listings
router.get("/", async (req, res) => {
  try {
    const { city, gender, minBudget, maxBudget, search } = req.query;

    const where: any = {};
    if (city) where.city = { equals: city as string, mode: "insensitive" };
    if (gender) where.gender = { equals: gender as string, mode: "insensitive" };
    if (minBudget || maxBudget) {
      where.budgetMin = minBudget ? { gte: parseInt(minBudget as string) } : undefined;
      where.budgetMax = maxBudget ? { lte: parseInt(maxBudget as string) } : undefined;
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { address: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const listings = await prisma.pGListing.findMany({
      where,
      include: {
        reviews: {
          where: { status: "APPROVED" },
          select: { overallScore: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add avg rating to each listing
    const result = listings.map((l) => {
      const avgRating =
        l.reviews.length > 0
          ? l.reviews.reduce((sum, r) => sum + r.overallScore, 0) / l.reviews.length
          : null;
      return {
        ...l,
        reviewCount: l.reviews.length,
        avgRating: avgRating ? parseFloat(avgRating.toFixed(1)) : null,
        reviews: undefined, // Don't send full reviews array
      };
    });

    res.json(result);
  } catch (err) {
    console.error("List listings error:", err);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// GET /listings/:id — single listing with reviews
router.get("/:id", async (req, res) => {
  try {
    const listing = await prisma.pGListing.findUnique({
      where: { id: req.params.id },
      include: {
        reviews: {
          where: { status: "APPROVED" },
          include: {
            proofs: {
              select: { id: true, fileType: true, caption: true },
            },
            verification: {
              select: { finalStatus: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const avgRating =
      listing.reviews.length > 0
        ? listing.reviews.reduce((sum, r) => sum + r.overallScore, 0) / listing.reviews.length
        : null;

    res.json({
      ...listing,
      reviewCount: listing.reviews.length,
      avgRating: avgRating ? parseFloat(avgRating.toFixed(1)) : null,
    });
  } catch (err) {
    console.error("Get listing error:", err);
    res.status(500).json({ error: "Failed to fetch listing" });
  }
});

// POST /listings — create a new listing (owner or admin)
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, address, city, lat, lng, budgetMin, budgetMax, gender, description, mainImageUrl } = req.body;

    if (!name || !address || !city) {
      return res.status(400).json({ error: "name, address, and city are required" });
    }

    const listing = await prisma.pGListing.create({
      data: {
        ownerId: req.user!.id,
        name,
        address,
        city,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        budgetMin: budgetMin ? parseInt(budgetMin) : null,
        budgetMax: budgetMax ? parseInt(budgetMax) : null,
        gender: gender || null,
        description: description || null,
        mainImageUrl: mainImageUrl || null,
      },
    });

    res.status(201).json(listing);
  } catch (err) {
    console.error("Create listing error:", err);
    res.status(500).json({ error: "Failed to create listing" });
  }
});

export default router;
