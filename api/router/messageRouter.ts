import express from "express";
import Messagecontroller from "../controller/messageController.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
const router = express.Router();

router.post(
  "/:communityId/send",
  authMiddleware,
  Messagecontroller.SendCommunityMessage,
);
router.get(
  "/:communityId/messages",
  authMiddleware,
  Messagecontroller.GetCommunityMessages,
);
router.post(
  "/:messageId/view",
  authMiddleware,
  Messagecontroller.ViewCommunityMessage,
);
router.delete(
  "/:messageId/delete",
  authMiddleware,
  Messagecontroller.DeleteCommunityMessage,
);

export default router;
