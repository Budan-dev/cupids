import express from "express";
import UserController from "../controller/userController.js";
import { authMiddleware } from "./middleware/authMiddleware.js";

const router = express.Router();

router.post("/signin", UserController.SignIn);
router.post("/signup", UserController.SignUp);
router.get("/me", authMiddleware, UserController.Profile);
router.get("/profile", authMiddleware, UserController.Profile);
router.put("/profile", authMiddleware, UserController.UpdateProfile);
router.put("/change-password", authMiddleware, UserController.ChangePassword);
router.put("/profile/avatar", authMiddleware, UserController.UpdateAvatar);
router.delete("/profile/avatar", authMiddleware, UserController.RemoveAvatar);
router.get("/user/:username", UserController.GetPublicUserProfile);
router.get("/user/:username/communities", UserController.GetUserCommunities);
router.get("/search/users", UserController.SearchUsers);
router.get("/notifications", authMiddleware, UserController.GetNotifications);
router.put(
  "/notifications/read",
  authMiddleware,
  UserController.MarkNotificationsRead,
);
router.get("/sessions", authMiddleware, UserController.GetSessions);
router.delete("/sessions/:id", authMiddleware, UserController.DeleteSession);
router.post("/signout", authMiddleware, UserController.SignOut);
router.delete("/delete", authMiddleware, UserController.DeleteAccount);
router.post("/resetpassword", UserController.ResetPassword);
router.post("/forgottenpassword", UserController.ForgottenPassword);

export default router;
