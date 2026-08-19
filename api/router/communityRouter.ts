import express from "express";
import Communitycontroller from "../controller/communityController.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
const router = express.Router();

router.post(
  "/createcommunity",
  authMiddleware,
  Communitycontroller.CreateCommunity,
);
router.get("/", authMiddleware, Communitycontroller.GetCommunities);
router.get(
  "/:communityId",
  authMiddleware,
  Communitycontroller.GetSingleCommunity,
);
router.get(
  "/:communityId/members",
  authMiddleware,
  Communitycontroller.GetCommunityMembers,
);
router.post(
  "/:communityId/join",
  authMiddleware,
  Communitycontroller.JoinCommunity,
);
router.delete(
  "/:communityId/leave",
  authMiddleware,
  Communitycontroller.DeleteCommunity,
);

export default router;
