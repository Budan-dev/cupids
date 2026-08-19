import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export function superAdminMiddleware(
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

    if (decoded.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Super admins only" });
    }

    req.userId = decoded.id;
    req.role = decoded.role;

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
