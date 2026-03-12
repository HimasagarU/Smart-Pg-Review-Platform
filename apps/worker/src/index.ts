import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { processProof } from "./verify";

const prisma = new PrismaClient();

const connection = {
  host: new URL(process.env.REDIS_URL || "redis://localhost:6379").hostname,
  port: parseInt(new URL(process.env.REDIS_URL || "redis://localhost:6379").port || "6379"),
};

// Verification scoring (same as backend)
function computeVerificationScore(signals: {
  hasProof: boolean;
  ocrMatchScore: number;
  captionMatchScore: number;
  phashDupPenalty: number;
  tamperPenalty: number;
  behaviorScore: number;
  ownerTokenBoost: number;
}): number {
  const w = {
    proof: 30, ocr: 20, caption: 10, phash: 10,
    tamper: 10, behavior: 10, ownerToken: 10,
  };

  let score = 0;
  score += signals.hasProof ? w.proof : 0;
  score += (signals.ocrMatchScore / 100) * w.ocr;
  score += (signals.captionMatchScore / 100) * w.caption;
  score += (1 - Math.max(0, signals.phashDupPenalty || 0)) * w.phash;
  score -= (signals.tamperPenalty || 0) * w.tamper;
  score += (signals.behaviorScore / 100) * w.behavior;
  score += (signals.ownerTokenBoost || 0) * w.ownerToken;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function decideStatus(score: number): string {
  if (score >= 70) return "APPROVED";
  if (score >= 40) return "PENDING"; // Needs human moderation
  return "REJECTED";
}

const worker = new Worker(
  "verification",
  async (job) => {
    const { reviewId } = job.data;
    console.log(`📋 Processing review: ${reviewId}`);

    // Load review with proofs
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { proofs: true },
    });

    if (!review) {
      console.error(`Review ${reviewId} not found`);
      return;
    }

    const proofResults = [];
    for (const proof of review.proofs) {
      try {
        const result = await processProof({
          id: proof.id,
          fileUrl: proof.fileUrl,
          fileType: proof.fileType,
        });

        // Update proof record with results
        await prisma.reviewProof.update({
          where: { id: proof.id },
          data: {
            ocrText: result.ocrText,
            phash: result.phash,
            caption: JSON.stringify(result.caption),
          },
        });

        proofResults.push(result);
      } catch (err) {
        console.error(`Failed to process proof ${proof.id}:`, err);
      }
    }

    // Aggregate signals
    const hasProof = review.proofs.length > 0;
    const ocrMatchScore = proofResults.some((r) => r.ocrText.length > 10) ? 60 : 0;
    const captionMatchScore = proofResults.some((r) => r.caption) ? 50 : 0;

    const signals = {
      hasProof,
      ocrMatchScore,
      captionMatchScore,
      phashDupPenalty: 0,
      tamperPenalty: 0,
      behaviorScore: 50,
      ownerTokenBoost: 0,
    };

    const score = computeVerificationScore(signals);
    const finalStatus = decideStatus(score);

    // Create verification record
    await prisma.verification.create({
      data: {
        reviewId: review.id,
        signals: signals as any,
        finalStatus,
      },
    });

    // Update review status and score
    await prisma.review.update({
      where: { id: review.id },
      data: {
        verificationScore: score,
        status: finalStatus as any,
      },
    });

    console.log(`✅ Review ${reviewId}: score=${score}, status=${finalStatus}`);
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

console.log("🔄 Verification worker started, waiting for jobs...");
