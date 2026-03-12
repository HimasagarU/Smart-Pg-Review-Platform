import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string | null;
        role: string;
        publicHandle: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

/**
 * Optional auth — sets req.user if valid token, but doesn't block.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return next();
    }
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        publicHandle: user.publicHandle,
      };
    }
  } catch {
    // Invalid token — just continue without user
  }
  next();
}

/**
 * Required auth — blocks request if no valid token.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      publicHandle: user.publicHandle,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Role check — requires user to have specific role.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}
