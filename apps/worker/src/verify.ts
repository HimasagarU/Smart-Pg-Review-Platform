import Tesseract from "tesseract.js";
import fetch from "node-fetch";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import os from "os";

// Dynamic import for imghash (ESM module)
let imghash: any;

async function loadImghash() {
  if (!imghash) {
    try {
      imghash = await import("imghash");
    } catch {
      console.warn("imghash not available, pHash will be skipped");
    }
  }
}

function getS3Client() {
  return new S3Client({
    endpoint: process.env.R2_ENDPOINT,
    region: "auto",
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function downloadFromR2(key: string): Promise<Buffer> {
  const client = getS3Client();
  const cmd = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
  });
  const res = await client.send(cmd);
  const stream = res.Body as any;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export async function runOCR(buffer: Buffer): Promise<string> {
  try {
    const { data: { text } } = await Tesseract.recognize(buffer, "eng");
    return text;
  } catch (err) {
    console.error("OCR failed:", err);
    return "";
  }
}

export async function computePHash(buffer: Buffer): Promise<string> {
  try {
    await loadImghash();
    if (!imghash) return "";

    const tmpDir = os.tmpdir();
    const tmpFile = path.join(tmpDir, `phash-${Date.now()}.jpg`);
    await fs.promises.writeFile(tmpFile, buffer);
    const hash = await imghash.hash(tmpFile, 16);
    await fs.promises.unlink(tmpFile).catch(() => {});
    return hash;
  } catch (err) {
    console.error("pHash failed:", err);
    return "";
  }
}

export async function runCLIP(buffer: Buffer): Promise<any> {
  try {
    if (!process.env.HF_API_KEY) {
      console.warn("HF_API_KEY not set, skipping CLIP/BLIP");
      return null;
    }

    const resp = await fetch(
      "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/octet-stream",
        },
        body: buffer,
      }
    );

    const json = await resp.json();
    return json;
  } catch (err) {
    console.error("CLIP/BLIP failed:", err);
    return null;
  }
}

export interface ProofRecord {
  id: string;
  fileUrl: string;
  fileType: string;
}

export interface ProofResult {
  ocrText: string;
  phash: string;
  caption: any;
}

export async function processProof(proofRecord: ProofRecord): Promise<ProofResult> {
  // Extract R2 key from fileUrl (format: r2://key)
  const key = proofRecord.fileUrl.replace("r2://", "");
  
  const buffer = await downloadFromR2(key);
  const ocrText = await runOCR(buffer);
  const phash = await computePHash(buffer);
  const clipRes = await runCLIP(buffer);

  return { ocrText, phash, caption: clipRes };
}
