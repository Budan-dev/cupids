import express from "express";
import AdminController from "../controller/admincontroller.js";
import { adminMiddleware } from "./middleware/adminMiddleware.js";
import { superAdminMiddleware } from "./middleware/superAdminMiddleware.js";

const router = express.Router();

// Public
router.post("/signin-admin", AdminController.SignInAdmin);

// Superadmin only
router.post(
  "/create-adminaccount",
  superAdminMiddleware,
  AdminController.createAdmin,
);
router.get(
  "/search-admin-profile",
  superAdminMiddleware,
  AdminController.searchAdminProfile,
);
router.get(
  "/super-admin-dashboard",
  superAdminMiddleware,
  AdminController.superAdminDashboard,
);
router.get(
  "/superadmin-get-admins-activity-logs",
  superAdminMiddleware,
  AdminController.superGetAdminActivityLogs,
);

// Admin and superadmin
router.get("/all-users", adminMiddleware, AdminController.getAllUsers);
router.post("/ban/:id", adminMiddleware, AdminController.banUser);
router.post("/unban/:id", adminMiddleware, AdminController.unbanUser);
router.get("/get-communities", adminMiddleware, AdminController.getCommunities);
router.post(
  "/search-communities",
  adminMiddleware,
  AdminController.getSearchCommunities,
);
router.post(
  "/ban-community/:id",
  adminMiddleware,
  AdminController.banCommunity,
);
router.post(
  "/unban-community/:id",
  adminMiddleware,
  AdminController.unbanCommunity,
);
router.delete(
  "/delete-community/:id",
  adminMiddleware,
  AdminController.deleteCommunity,
);
router.get("/get-reports", adminMiddleware, AdminController.getReports);
router.post(
  "/resolve-report/:id",
  adminMiddleware,
  AdminController.resolveReport,
);
router.post(
  "/ignore-report/:id",
  adminMiddleware,
  AdminController.ignoreReport,
);
router.get(
  "/get-user-profile/:id",
  adminMiddleware,
  AdminController.getUserProfile,
);
router.get(
  "/user/:id/notifications",
  adminMiddleware,
  AdminController.getUserNotifications,
);
router.put(
  "/user/:id/notifications/read",
  adminMiddleware,
  AdminController.markUserNotificationsRead,
);
router.get(
  "/user/:id/sessions",
  adminMiddleware,
  AdminController.getUserSessions,
);
router.post(
  "/user/:id/sessions/:sessionId/revoke",
  adminMiddleware,
  AdminController.revokeUserSession,
);
router.post(
  "/user/:id/sessions/revoke-all",
  adminMiddleware,
  AdminController.revokeAllUserSessions,
);
router.get(
  "/get-dashboard-stats",
  adminMiddleware,
  AdminController.getDashboardStats,
);
router.post(
  "/update-profile",
  adminMiddleware,
  AdminController.updateAdminProfile,
);
router.delete(
  "/delete-profile",
  adminMiddleware,
  AdminController.deleteAdminAccount,
);
router.get(
  "/admin-activity-logs",
  adminMiddleware,
  AdminController.getAdminActivityLogs,
);
router.get(
  "/user-activity-logs",
  adminMiddleware,
  AdminController.getUserActivityLogs,
);

router.post("/signout", adminMiddleware, AdminController.SignOut);

export default router;
