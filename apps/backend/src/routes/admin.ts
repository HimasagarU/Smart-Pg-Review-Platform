import express from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = express.Router();

// All admin routes require auth + ADMIN or MODERATOR role
router.use(requireAuth);
router.use(requireRole("ADMIN", "MODERATOR"));

// GET /admin/stats — comprehensive dashboard analytics
router.get("/stats", async (_req, res) => {
  try {
    // User counts by role
    const [totalUsers, admins, moderators, owners] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "MODERATOR" } }),
      prisma.user.count({ where: { role: "OWNER" } }),
    ]);

    // Listing counts
    const totalListings = await prisma.pGListing.count();
    const listingsByCity = await prisma.pGListing.groupBy({
      by: ["city"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    // Review counts by status
    const [totalReviews, pendingReviews, approvedReviews, rejectedReviews, flaggedReviews] = await Promise.all([
      prisma.review.count(),
      prisma.review.count({ where: { status: "PENDING" } }),
      prisma.review.count({ where: { status: "APPROVED" } }),
      prisma.review.count({ where: { status: "REJECTED" } }),
      prisma.review.count({ where: { status: "FLAGGED" } }),
    ]);

    // Reviews with proofs vs without
    const reviewsWithProofs = await prisma.review.count({
      where: { proofs: { some: {} } },
    });

    // Verification scores stats
    const verifiedReviews = await prisma.review.count({
      where: { verificationScore: { gte: 70 } },
    });

    // Moderation activity
    const totalModerationActions = await prisma.moderationLog.count();
    const recentModerationActions = await prisma.moderationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        reason: true,
        createdAt: true,
        actorId: true,
      },
    });

    // Recent reviews
    const recentReviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        publicHandle: true,
        overallScore: true,
        status: true,
        verificationScore: true,
        createdAt: true,
        listing: { select: { name: true, city: true } },
      },
    });


    res.json({
      users: {
        total: totalUsers,
        admins,
        moderators,
        owners,
        regular: totalUsers - admins - moderators - owners,
      },
      listings: {
        total: totalListings,
        byCity: listingsByCity.map((c) => ({ city: c.city, count: c._count.id })),
      },
      reviews: {
        total: totalReviews,
        pending: pendingReviews,
        approved: approvedReviews,
        rejected: rejectedReviews,
        flagged: flaggedReviews,
        withProofs: reviewsWithProofs,
        withoutProofs: totalReviews - reviewsWithProofs,
        verified: verifiedReviews,
      },
      moderation: {
        totalActions: totalModerationActions,
        recentActions: recentModerationActions,
      },
      recentReviews,
    });
  } catch (err) {
    console.error("Get stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// GET /admin/moderation/pending — get reviews pending moderation
router.get("/moderation/pending", async (_req, res) => {
  try {
    const pending = await prisma.review.findMany({
      where: { status: "PENDING" },
      include: {
        proofs: true,
        verification: true,
        listing: {
          select: { id: true, name: true, address: true, city: true },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    const r2Base = `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}`;
    const result = pending.map((review: any) => ({
      ...review,
      proofs: review.proofs.map((proof: any) => ({
        ...proof,
        imageUrl: proof.fileUrl?.startsWith("r2://")
          ? `${r2Base}/${proof.fileUrl.replace("r2://", "")}`
          : proof.fileUrl,
      })),
    }));

    res.json(result);
  } catch (err) {
    console.error("Get pending reviews error:", err);
    res.status(500).json({ error: "Failed to fetch pending reviews" });
  }
});

// GET /admin/moderation/all — get all reviews with any status
router.get("/moderation/all", async (_req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        proofs: true,
        verification: true,
        listing: {
          select: { id: true, name: true, address: true, city: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const r2Base = `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}`;
    const result = reviews.map((review: any) => ({
      ...review,
      proofs: review.proofs.map((proof: any) => ({
        ...proof,
        imageUrl: proof.fileUrl?.startsWith("r2://")
          ? `${r2Base}/${proof.fileUrl.replace("r2://", "")}`
          : proof.fileUrl,
      })),
    }));

    res.json(result);
  } catch (err) {
    console.error("Get all reviews error:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST /admin/moderation/:id/approve
router.post("/moderation/:id/approve", async (req, res) => {
  try {
    await prisma.review.update({
      where: { id: req.params.id },
      data: { status: "APPROVED" },
    });

    await prisma.moderationLog.create({
      data: {
        actorId: req.user!.id,
        action: "APPROVE",
        targetType: "REVIEW",
        targetId: req.params.id,
        reason: req.body.reason || null,
      },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).json({ error: "Failed to approve review" });
  }
});

// POST /admin/moderation/:id/reject
router.post("/moderation/:id/reject", async (req, res) => {
  try {
    await prisma.review.update({
      where: { id: req.params.id },
      data: { status: "REJECTED" },
    });

    await prisma.moderationLog.create({
      data: {
        actorId: req.user!.id,
        action: "REJECT",
        targetType: "REVIEW",
        targetId: req.params.id,
        reason: req.body.reason || null,
      },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Reject error:", err);
    res.status(500).json({ error: "Failed to reject review" });
  }
});

// POST /admin/moderation/:id/flag
router.post("/moderation/:id/flag", async (req, res) => {
  try {
    await prisma.review.update({
      where: { id: req.params.id },
      data: { status: "FLAGGED" },
    });

    await prisma.moderationLog.create({
      data: {
        actorId: req.user!.id,
        action: "FLAG",
        targetType: "REVIEW",
        targetId: req.params.id,
        reason: req.body.reason || null,
      },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Flag error:", err);
    res.status(500).json({ error: "Failed to flag review" });
  }
});

export default router;
