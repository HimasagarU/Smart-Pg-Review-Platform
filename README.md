# PG Review - Smart Verified PG Platform

> **💡 Important Note for Reviewers & Testers:**
> The backend for this project is hosted on **Render's Free Tier**. 
> Render automatically spins down (puts to sleep) free backend services after **15 minutes of inactivity**. 
> 
> **If you are visiting for the first time, it may take 30 to 50 seconds for the backend to wake up and start serving requests.** Please be patient during the first load! Once awake, the platform will be fast and responsive.

---

A modern, full-stack platform for finding, reviewing, and moderating Paying Guest (PG) accommodations, designed with an **AI-powered Trust Score system**.

## ✨ Features

- **AI-Powered Review Verification**:
  - Reviews with images go through an inline AI validation process.
  - **OCR (Optical Character Recognition)** parses images for receipts, bills, and address boards.
  - **BLIP (Bootstrapping Language-Image Pre-training)** generates captions to ensure the uploaded photos are relevant (e.g., actually showing a room, bed, or building).
  - A **Trust Score (0-100)** is generated inline during submission:

  | Signal | Max Points | How It's Scored |
  |---|---|---|
  | Has proof image(s) | 25 | Flat +25 if any image uploaded |
  | OCR text quality | 15 | Receipt/bill keywords = 100%, address keywords = 80%, any text = 30-60% |
  | AI caption relevance | 15 | BLIP caption matched against PG keywords (room, bed, food, building…) |
  | Review text length | 15 | >100 chars = full, >50 = 10pts, >20 = 5pts |
  | Rating completeness | 10 | All 5 categories filled = 10pts |
  | Multiple proof images | 10 | 2+ images = 7pts, 3+ images = 10pts |
  | Logged-in user | 10 | Not anonymous |

  - Reviews scoring **≥ 70** are **auto-approved** ✅ and shown publicly.
  - Reviews scoring **40–69** go to the **moderation queue** for human review.
  - Reviews scoring **< 40** are marked **low trust** 🔴.
- **Role-Based Access Control**: Secure Auth with distinct User, Moderator, and Admin roles.
- **Admin Dashboard & Analytics**: A complete dashboard for viewing stats on listings, users, and a moderation queue to manually approve low-trust reviews.
- **Modern UI**: Fully responsive light-theme styled with TailwindCSS, featuring a smooth, instant feedback user experience.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (hosted on Neon) with Prisma ORM
- **Storage**: Cloudflare R2 (S3-compatible API via AWS SDK)
- **AI Models**: Tesseract.js (Local OCR) & HuggingFace Inference API (BLIP)
- **Deployment**: Vercel (Frontend) & Render (Backend)

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL Database (local or cloud e.g., Neon serverless)
- Cloudflare R2 Bucket (with relevant API keys)
- HuggingFace API Key

### 2. Environment Variables
Create a `.env` file in the root directory following `.env.example`:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your_jwt_secret
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=pgreview
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
HF_API_KEY=hf_...
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4000
```

### 3. Install Dependencies
This project uses an NPM monolithic workspace or standard separate scripts:
```bash
npm run install:all
```

### 4. Database Setup
```bash
npm run prisma:generate
npm run prisma:migrate
# Optional: Seed the database with sample PGs and Reviews
npx tsx scripts/add-pgs.ts
```

### 5. Start the Servers
You will need two terminal windows:
```bash
# Terminal 1: Backend
npm run backend:dev

# Terminal 2: Frontend
npm run frontend:dev
```
The Frontend will run on `localhost:3000` and the Backend API on `localhost:4000`.

### 🐳 Run with Docker (Alternative)
If you prefer running the backend in a container (especially useful for VPS deployments like AWS/DigitalOcean):
```bash
# Build and run the backend via Docker Compose
docker-compose up -d --build
```
This will start the backend on port 4000 using the `Dockerfile`.

## 📦 Deployment Guide

### Backend (Render Free Tier)
The root directory includes a `render.yaml` Blueprint file which automates deployment.
1. Push this repository to GitHub.
2. Go to Render.com -> New -> Blueprint.
3. Select your repository.
4. Manually add all `.env` secrets into the Render dashboard Environment Variables.
5. Apply the blueprint, the backend will build, migrate the DB, and start.

### Frontend (Vercel Free Tier)
1. Go to Vercel -> Add New Project -> Import GitHub repository.
2. Crucial: Change the **Root Directory** setting to `apps/frontend`.
3. Add an Environment Variable for `NEXT_PUBLIC_API_URL` pointing to your new Render backend URL.
4. Deploy!
