import express from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { generateToken } from "../middleware/auth";

const router = express.Router();

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, publicHandle } = req.body;

    if (!publicHandle) {
      return res.status(400).json({ error: "publicHandle is required" });
    }

    // Check if handle or email already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          { publicHandle },
        ],
      },
    });

    if (existing) {
      return res.status(409).json({ error: "User with this email or handle already exists" });
    }

    const passwordHash = password ? await bcrypt.hash(password, 12) : null;

    const user = await prisma.user.create({
      data: {
        email: email || null,
        passwordHash,
        publicHandle,
      },
    });

    const token = generateToken(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        publicHandle: user.publicHandle,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        publicHandle: user.publicHandle,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
