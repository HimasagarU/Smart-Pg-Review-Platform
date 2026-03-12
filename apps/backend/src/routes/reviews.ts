import express from "express";
import multer from "multer";
import { prisma } from "../lib/prisma";
import { optionalAuth } from "../middleware/auth";
import { processProofsInline, computeTrustScore, AISignals } from "../lib/verification";
import { uploadBufferToR2 } from "../lib/r2";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function computeOverallFromRatings(ratings: Record<string, number>): number {
  const values = Object.values(ratings);
  if (values.length === 0) return 0;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return parseFloat(avg.toFixed(1));
}

// POST /reviews/:listingId — submit a new review with proofs + AI verification
router.post("/:listingId", optionalAuth, upload.array("proofs", 10), async (req, res) => {
  try {
    const ratingsStr = req.body.ratings;
    let ratings: Record<string, number>;
    
    if (!ratingsStr) {
      return res.status(400).json({ error: "ratings object is required" });
    }

    try {
      ratings = typeof ratingsStr === "string" ? JSON.parse(ratingsStr) : ratingsStr;
    } catch {
      return res.status(400).json({ error: "Invalid ratings JSON" });
    }

    const text = req.body.text || null;
    const files = (req.files as Express.Multer.File[]) || [];

    const listing = await prisma.pGListing.findUnique({
      where: { id: req.params.listingId },
    });
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const publicHandle =
      req.user?.publicHandle || `anon-${Math.random().toString(36).slice(2, 8)}`;
    const overallScore = computeOverallFromRatings(ratings);
    const proofsArr: { key: string; contentType: string; size: number }[] = [];

    // Upload files directly from backend to R2 (bypasses CORS)
    for (const file of files) {
      try {
        const key = `proofs/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        await uploadBufferToR2(key, file.buffer, file.mimetype);
        proofsArr.push({ key, contentType: file.mimetype, size: file.size });
      } catch (err) {
        console.warn("Failed to upload proof from backend:", err);
      }
    }

    // Create the review first
    const review = await prisma.review.create({
      data: {
        listingId: req.params.listingId,
        userId: req.user?.id || null,
        publicHandle,
        ratingsJson: ratings,
        overallScore,
        text: text || null,
        status: "PENDING",
      },
    });

    // Create proof records
    for (const p of proofsArr) {
      await prisma.reviewProof.create({
        data: {
          reviewId: review.id,
          fileUrl: `r2://${p.key}`,
          fileType: p.contentType,
          size: p.size || 0,
        },
      });
    }

    // Send immediate response (AI runs async in background)
    // Start with a basic score, update it when AI finishes
    const basicScore = computeTrustScore({
      hasProof: proofsArr.length > 0,
      proofsCount: proofsArr.length,
      ocrText: "",
      ocrScore: 0,
      caption: "",
      captionScore: 0,
      textLength: text?.length || 0,
      ratingsCount: Object.keys(ratings).length,
      isLoggedIn: !!req.user,
      method: "basic",
    });

    // Update review with basic score immediately
    await prisma.review.update({
      where: { id: review.id },
      data: { verificationScore: basicScore },
    });

    // Respond immediately so user doesn't wait
    res.status(201).json({ ok: true, reviewId: review.id, verificationScore: basicScore });

    // Run AI verification in background (non-blocking)
    const proofKeys = proofsArr.map((p: any) => p.key);
    if (proofKeys.length > 0) {
      runAIVerification(review.id, proofKeys, text, Object.keys(ratings).length, !!req.user).catch(
        (err) => console.warn("Background AI verification failed:", err.message)
      );
    } else {
      // No proofs — create verification record with basic signals
      await prisma.verification.create({
        data: {
          reviewId: review.id,
          signals: {
            hasProof: false,
            ocrText: "",
            caption: "",
            textLength: text?.length || 0,
            method: "basic",
          },
          finalStatus: basicScore >= 70 ? "NEEDS_REVIEW" : "LOW_TRUST",
        },
      }).catch(() => {});
    }
  } catch (err) {
    console.error("Submit review error:", err);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

/**
 * Runs AI verification in the background after response is sent.
 * Updates the review's trust score with OCR + BLIP results.
 */
async function runAIVerification(
  reviewId: string,
  proofKeys: string[],
  text: string | null,
  ratingsCount: number,
  isLoggedIn: boolean,
) {
  console.log(`🤖 Starting AI verification for review ${reviewId}...`);

  try {
    const aiResults = await processProofsInline(proofKeys);

    const signals: AISignals = {
      hasProof: proofKeys.length > 0,
      proofsCount: proofKeys.length,
      ocrText: aiResults.ocrText,
      ocrScore: aiResults.ocrScore,
      caption: aiResults.caption,
      captionScore: aiResults.captionScore,
      textLength: text?.length || 0,
      ratingsCount,
      isLoggedIn,
      method: "ai",
    };

    const aiScore = computeTrustScore(signals);
    const finalStatus = aiScore >= 70 ? "APPROVED" : aiScore >= 40 ? "NEEDS_REVIEW" : "LOW_TRUST";

    // Update review score
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        verificationScore: aiScore,
        status: aiScore >= 70 ? "APPROVED" : "PENDING",
      },
    });

    // Update proof records with OCR/caption data
    const reviewProofs = await prisma.reviewProof.findMany({
      where: { reviewId },
    });

    for (let i = 0; i < reviewProofs.length && i < aiResults.perProof.length; i++) {
      await prisma.reviewProof.update({
        where: { id: reviewProofs[i].id },
        data: {
          ocrText: aiResults.perProof[i].ocr || null,
          caption: aiResults.perProof[i].caption || null,
        },
      });
    }

    // Create verification record
    await prisma.verification.create({
      data: {
        reviewId,
        signals: signals as any,
        finalStatus,
      },
    });

    console.log(`✅ AI verification done for ${reviewId}: score=${aiScore}, status=${finalStatus}`);
    console.log(`   OCR: "${aiResults.ocrText.substring(0, 80)}"`);
    console.log(`   Caption: "${aiResults.caption}"`);
  } catch (err) {
    console.error(`❌ AI verification failed for ${reviewId}:`, err);
  }
}

// GET /reviews/:listingId — get approved reviews for a listing
router.get("/:listingId", async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        listingId: req.params.listingId,
        status: "APPROVED",
      },
      include: {
        proofs: {
          select: { id: true, fileType: true, caption: true, ocrText: true },
        },
        verification: {
          select: { finalStatus: true, signals: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(reviews);
  } catch (err) {
    console.error("Get reviews error:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

export default router;
