import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../router/middleware/verifyToken.js";

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  res.status(200).json({
    data: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    },
  });
};
