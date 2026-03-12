import express from "express";
import { getUploadUrl } from "../lib/r2";
import { optionalAuth } from "../middleware/auth";

const router = express.Router();

// POST /uploads/signed-url
router.post("/signed-url", optionalAuth, async (req, res) => {
  try {
    const { filename, contentType } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({ error: "filename and contentType are required" });
    }

    const key = `proofs/${Date.now()}-${filename}`;
    const uploadUrl = await getUploadUrl(key, contentType);

    res.json({ uploadUrl, key });
  } catch (err) {
    console.error("Upload URL error:", err);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

export default router;
