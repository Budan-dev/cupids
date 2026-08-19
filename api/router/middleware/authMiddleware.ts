import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      role?: string;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Authentication required, SignIn" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    if (decoded.role !== "USER") {
      return res.status(403).json({ message: "Access denied, users only" });
    }

    req.userId = decoded.id;
    req.role = decoded.role;

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
