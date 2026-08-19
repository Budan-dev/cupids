import express from "express";
import PrivateMessageController from "../controller/privateMessageController.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
const router = express.Router();

router.post(
  "/send/:receiverUsername",
  authMiddleware,
  PrivateMessageController.SendPrivateMessage,
);
router.get("/", authMiddleware, PrivateMessageController.GetPrivateMessages);

router.post(
  "/delete/:messageId",
  authMiddleware,
  PrivateMessageController.DeletePrivateMessage,
);
router.post(
  "/mark-as-read/:messageId",
  authMiddleware,
  PrivateMessageController.ViewPrivateMessage,
);
router.delete(
  "/delete/:messageId",
  authMiddleware,
  PrivateMessageController.DeletePrivateMessage,
);
export default router;
