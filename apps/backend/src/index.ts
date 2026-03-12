import dotenv from "dotenv";
import path from "path";

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import express from "express";
import cors from "cors";

import uploadsRouter from "./routes/uploads";
import listingsRouter from "./routes/listings";
import reviewsRouter from "./routes/reviews";
import adminRouter from "./routes/admin";
import authRouter from "./routes/auth";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: true, // Allow all origins for the public API / Vercel deployment
  credentials: true,
}));
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/uploads", uploadsRouter);
app.use("/listings", listingsRouter);
app.use("/reviews", reviewsRouter);
app.use("/admin", adminRouter);
app.use("/auth", authRouter);

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});

export default app;
