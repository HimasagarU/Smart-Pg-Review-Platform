/**
 * Inline AI Verification — runs in the backend process.
 * No Redis/BullMQ/worker needed. Deployment-friendly.
 *
 * How trust scoring works:
 * ┌──────────────────────────────────────────────────────────┐
 * │                 TRUST SCORE (0-100)                       │
 * ├────────────────┬────────┬────────────────────────────────┤
 * │ Signal         │ Weight │ What it checks                 │
 * ├────────────────┼────────┼────────────────────────────────┤
 * │ Has proof imgs │  25    │ At least 1 image uploaded       │
 * │ OCR text found │  15    │ Image has readable text         │
 * │   (receipts, boards, signs = higher score)               │
 * │ AI caption     │  15    │ BLIP says it looks like a room/ │
 * │                │        │ building/food (not random img)  │
 * │ Text quality   │  15    │ Review text length & detail     │
 * │ Rating filled  │  10    │ All 5 categories rated          │
 * │ Multiple imgs  │  10    │ 2+ proof images                 │
 * │ Logged-in user │  10    │ Not anonymous submission        │
 * └────────────────┴────────┴────────────────────────────────┘
 */

import { downloadFromR2 } from "./r2";

// PG-related keywords for caption matching
const PG_KEYWORDS = [
  "room", "bed", "bedroom", "bathroom", "kitchen", "building",
  "food", "plate", "meal", "rice", "table", "dining",
  "hostel", "apartment", "house", "door", "window", "wall",
  "sign", "board", "receipt", "bill", "paper", "document",
  "corridor", "hallway", "lobby", "gate", "entrance",
  "furniture", "desk", "chair", "shelf", "fan", "light",
];

/**
 * Run OCR on an image buffer using Tesseract.js
 */
export async function runOCR(buffer: Buffer): Promise<string> {
  try {
    const Tesseract = require("tesseract.js");
    const { data: { text } } = await Tesseract.recognize(buffer, "eng", {
      logger: () => {}, // suppress logs
    });
    return text.trim();
  } catch (err) {
    console.warn("OCR skipped:", (err as Error).message);
    return "";
  }
}

/**
 * Run BLIP image captioning via Hugging Face Inference API
 * Returns a caption like "a picture of a room with a bed"
 */
export async function runBLIP(buffer: Buffer): Promise<string> {
  try {
    if (!process.env.HF_API_KEY) {
      console.warn("HF_API_KEY not set, skipping BLIP");
      return "";
    }

    const fetch = require("node-fetch");
    const resp = await fetch(
      "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/octet-stream",
        },
        body: buffer,
        timeout: 15000,
      }
    );

    if (!resp.ok) {
      console.warn(`BLIP API returned ${resp.status}`);
      return "";
    }

    const json = await resp.json();
    // Response format: [{ "generated_text": "a room with ..." }]
    if (Array.isArray(json) && json[0]?.generated_text) {
      return json[0].generated_text;
    }
    return "";
  } catch (err) {
    console.warn("BLIP skipped:", (err as Error).message);
    return "";
  }
}

/**
 * Check if a caption mentions PG-related things
 */
function captionMatchScore(caption: string): number {
  if (!caption) return 0;
  const lower = caption.toLowerCase();
  const matches = PG_KEYWORDS.filter((kw) => lower.includes(kw));
  // Score: 0 matches = 0, 1 match = 50, 2+ matches = 80, 3+ = 100
  if (matches.length >= 3) return 100;
  if (matches.length >= 2) return 80;
  if (matches.length >= 1) return 50;
  return 10; // Caption exists but no PG keywords
}

/**
 * Check if OCR text contains useful info (receipt/bill/address/name)
 */
function ocrMatchScore(ocrText: string): number {
  if (!ocrText || ocrText.length < 5) return 0;

  const lower = ocrText.toLowerCase();
  const billKeywords = ["receipt", "bill", "amount", "total", "paid", "rs", "₹", "rent", "month"];
  const addressKeywords = ["road", "street", "sector", "block", "floor", "no.", "pg", "hostel"];

  const billMatches = billKeywords.filter((kw) => lower.includes(kw)).length;
  const addrMatches = addressKeywords.filter((kw) => lower.includes(kw)).length;

  if (billMatches >= 2) return 100; // Looks like a receipt
  if (addrMatches >= 2) return 80;  // Looks like an address/sign
  if (ocrText.length > 50) return 60; // Substantial text found
  if (ocrText.length > 10) return 30; // Some text found
  return 10;
}

export interface AISignals {
  hasProof: boolean;
  proofsCount: number;
  ocrText: string;
  ocrScore: number;
  caption: string;
  captionScore: number;
  textLength: number;
  ratingsCount: number;
  isLoggedIn: boolean;
  method: string;
}

/**
 * Compute the final trust score from all signals
 */
export function computeTrustScore(signals: AISignals): number {
  let score = 0;

  // Has proof images (25 pts)
  if (signals.hasProof) score += 25;

  // OCR text quality (15 pts)
  score += (signals.ocrScore / 100) * 15;

  // AI caption relevance (15 pts)
  score += (signals.captionScore / 100) * 15;

  // Text quality (15 pts)
  if (signals.textLength > 100) score += 15;
  else if (signals.textLength > 50) score += 10;
  else if (signals.textLength > 20) score += 5;

  // Rating completeness (10 pts)
  score += Math.min(signals.ratingsCount / 5, 1) * 10;

  // Multiple proofs (10 pts)
  if (signals.proofsCount >= 3) score += 10;
  else if (signals.proofsCount >= 2) score += 7;

  // Logged-in user (10 pts)
  if (signals.isLoggedIn) score += 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Process all proof images for a review using AI.
 * Downloads from R2, runs OCR + BLIP, returns aggregated signals.
 */
export async function processProofsInline(
  proofKeys: string[]
): Promise<{ ocrText: string; ocrScore: number; caption: string; captionScore: number; perProof: Array<{ key: string; ocr: string; caption: string }> }> {
  if (proofKeys.length === 0) {
    return { ocrText: "", ocrScore: 0, caption: "", captionScore: 0, perProof: [] };
  }

  const perProof: Array<{ key: string; ocr: string; caption: string }> = [];
  let bestOcr = "";
  let bestCaption = "";

  for (const key of proofKeys) {
    try {
      console.log(`🔍 Processing proof: ${key}`);
      const buffer = await downloadFromR2(key);

      // Run OCR and BLIP in parallel
      const [ocr, caption] = await Promise.all([
        runOCR(buffer),
        runBLIP(buffer),
      ]);

      console.log(`   OCR: "${ocr.substring(0, 60)}..." | Caption: "${caption}"`);
      perProof.push({ key, ocr, caption });

      // Keep the best results
      if (ocr.length > bestOcr.length) bestOcr = ocr;
      if (caption.length > bestCaption.length) bestCaption = caption;
    } catch (err) {
      console.warn(`Failed to process proof ${key}:`, (err as Error).message);
      perProof.push({ key, ocr: "", caption: "" });
    }
  }

  return {
    ocrText: bestOcr,
    ocrScore: ocrMatchScore(bestOcr),
    caption: bestCaption,
    captionScore: captionMatchScore(bestCaption),
    perProof,
  };
}
