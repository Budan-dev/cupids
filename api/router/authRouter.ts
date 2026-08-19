// src/routes/authRoutes.ts
import { Router } from "express";

import { verifyToken } from "./middleware/verifyToken.js";
import { getMe } from "../controller/authController.js";

const router = Router();

router.get("/me", verifyToken, getMe);

export default router;
