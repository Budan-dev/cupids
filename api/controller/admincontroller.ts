import { prisma } from "../utils/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sendResponse from "../utils/response.js";
import { getHashPassword } from "../utils/helper.js";

const AdminController = {
  // SUPER ADMIN ONLY = create a new admin account
  createAdmin: async (req: any, res: any) => {
    const { firstName, lastName, email, password, username } = req.body;
    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return sendResponse(res, 409, "User already exists", null);
      }

      const hashedPassword = await getHashPassword(password);

      const admin = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          username,
          password: hashedPassword,
          role: "ADMIN",
        },
      });

      const { password: _, ...adminWithoutPassword } = admin;
      return sendResponse(
        res,
        201,
        "Admin created successfully",
        adminWithoutPassword,
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal server error", null);
    }
  },

  // Sign in for ADMIN and SUPER_ADMIN
  SignInAdmin: async (req: any, res: any) => {
    const { email, password } = req.body;
    try {
      const admin = await prisma.user.findUnique({ where: { email } });

      if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPER_ADMIN")) {
        return sendResponse(res, 403, "Not an admin account", null);
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return sendResponse(res, 401, "Invalid credentials", null);
      }

      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: admin.role },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" },
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return sendResponse(res, 200, `Sign in successful, ${admin.firstName}!`, {
        admin: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        },
      });
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal server error", null);
    }
  },

  // Get all users
  getAllUsers: async (req: any, res: any) => {
    try {
      const users = await prisma.user.findMany({
        where: { role: "USER" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          username: true,
          avatarUrl: true,
          isActive: true,
          isBanned: true,
          createdAt: true,
          lastLogin: true,
        },
      });
      return sendResponse(res, 200, "Users fetched successfully", users);
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error fetching users", null);
    }
  },

  // Get a single user profile
  getUserProfile: async (req: any, res: any) => {
    const { id } = req.params;
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          username: true,
          avatarUrl: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          isBanned: true,
          banReason: true,
          bannedAt: true,
          unbanReason: true,
          unbannedAt: true,
          communities: {
            select: {
              community: {
                select: {
                  id: true,
                  name: true,
                },
              },
              role: true,
            },
          },
        },
      });

      if (!user) {
        return sendResponse(res, 404, "User not found", null);
      }

      return sendResponse(
        res,
        200,
        "User profile retrieved successfully",
        user,
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error fetching user profile", null);
    }
  },

  // Ban a user
  banUser: async (req: any, res: any) => {
    const { id } = req.params;
    const { reason } = req.body;
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          isBanned: true,
          banReason: reason,
          bannedAt: new Date(),
        },
      });
      return sendResponse(res, 200, "User banned successfully", user);
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error banning user", null);
    }
  },

  getUserNotifications: async (req: any, res: any) => {
    const { id } = req.params;
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!user) {
        return sendResponse(res, 404, "User not found", null);
      }

      const notifications = await prisma.notification.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          read: true,
          createdAt: true,
        },
      });

      return sendResponse(
        res,
        200,
        "User notifications fetched successfully",
        notifications,
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error fetching user notifications", null);
    }
  },

  markUserNotificationsRead: async (req: any, res: any) => {
    const { id } = req.params;
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!user) {
        return sendResponse(res, 404, "User not found", null);
      }

      await prisma.notification.updateMany({
        where: { userId: id, read: false },
        data: { read: true },
      });

      return sendResponse(res, 200, "User notifications marked as read");
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error updating user notifications", null);
    }
  },

  getUserSessions: async (req: any, res: any) => {
    const { id } = req.params;
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!user) {
        return sendResponse(res, 404, "User not found", null);
      }

      const sessions = await prisma.userSession.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          userAgent: true,
          ipAddress: true,
          createdAt: true,
          lastActiveAt: true,
          expiresAt: true,
          revokedAt: true,
          isActive: true,
        },
      });

      return sendResponse(
        res,
        200,
        "User sessions fetched successfully",
        sessions,
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error fetching user sessions", null);
    }
  },

  revokeUserSession: async (req: any, res: any) => {
    const { id, sessionId } = req.params;
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!user) {
        return sendResponse(res, 404, "User not found", null);
      }

      const session = await prisma.userSession.findFirst({
        where: { id: sessionId, userId: id },
      });

      if (!session) {
        return sendResponse(res, 404, "Session not found", null);
      }

      await prisma.userSession.update({
        where: { id: sessionId },
        data: {
          revokedAt: new Date(),
          isActive: false,
        },
      });

      return sendResponse(res, 200, "User session revoked successfully");
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error revoking user session", null);
    }
  },

  revokeAllUserSessions: async (req: any, res: any) => {
    const { id } = req.params;
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!user) {
        return sendResponse(res, 404, "User not found", null);
      }

      await prisma.userSession.updateMany({
        where: { userId: id, revokedAt: null, isActive: true },
        data: {
          revokedAt: new Date(),
          isActive: false,
        },
      });

      return sendResponse(res, 200, "All user sessions revoked successfully");
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error revoking user sessions", null);
    }
  },

  // Unban a user
  unbanUser: async (req: any, res: any) => {
    const { id } = req.params;
    const { reason } = req.body;
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          isBanned: false,
          banReason: null,
          bannedAt: null,
          unbanReason: reason,
          unbannedAt: new Date(),
        },
      });
      return sendResponse(res, 200, "User unbanned successfully", user);
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error unbanning user", null);
    }
  },

  // Get all communities
  getCommunities: async (req: any, res: any) => {
    try {
      const communities = await prisma.community.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          _count: true,
        },
      });
      return sendResponse(
        res,
        200,
        "Communities fetched successfully",
        communities,
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error fetching communities", null);
    }
  },

  // Search a community by name
  getSearchCommunities: async (req: any, res: any) => {
    const { name } = req.body;
    try {
      const community = await prisma.community.findUnique({
        where: { name },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          members: true,
          _count: true,
        },
      });

      if (!community) {
        return sendResponse(res, 404, "Community not found", null);
      }

      return sendResponse(res, 200, "Community found", community);
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error fetching community", null);
    }
  },

  // Ban a community
  banCommunity: async (req: any, res: any) => {
    const { id } = req.params;
    const { reason } = req.body;
    try {
      const community = await prisma.community.update({
        where: { id },
        data: {
          isBanned: true,
          banReason: reason,
          bannedAt: new Date(),
        },
      });
      return sendResponse(res, 200, "Community banned successfully", community);
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error banning community", null);
    }
  },

  // Unban a community
  unbanCommunity: async (req: any, res: any) => {
    const { id } = req.params;
    const { reason } = req.body;
    try {
      const community = await prisma.community.update({
        where: { id },
        data: {
          isBanned: false,
          banReason: null,
          bannedAt: null,
          unbanReason: reason,
          unbannedAt: new Date(),
        },
      });
      return sendResponse(
        res,
        200,
        "Community unbanned successfully",
        community,
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error unbanning community", null);
    }
  },

  // Delete a community
  deleteCommunity: async (req: any, res: any) => {
    const { id } = req.params;
    try {
      await prisma.community.delete({ where: { id } });
      return sendResponse(res, 200, "Community deleted successfully", null);
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error deleting community", null);
    }
  },

  // Get all reports
  getReports: async (req: any, res: any) => {
    try {
      const reports = await prisma.report.findMany({
        orderBy: { createdAt: "desc" },
      });
      return sendResponse(res, 200, "Reports fetched successfully", reports);
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error fetching reports", null);
    }
  },

  // Resolve a report
  resolveReport: async (req: any, res: any) => {
    const { id } = req.params;
    try {
      const report = await prisma.report.update({
        where: { id },
        data: { status: "RESOLVED" },
      });
      return sendResponse(res, 200, "Report resolved successfully", report);
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error resolving report", null);
    }
  },

  // Ignore a report
  ignoreReport: async (req: any, res: any) => {
    const { id } = req.params;
    try {
      const report = await prisma.report.update({
        where: { id },
        data: { status: "IGNORED" },
      });
      return sendResponse(res, 200, "Report ignored successfully", report);
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error ignoring report", null);
    }
  },

  // Get dashboard stats
  getDashboardStats: async (req: any, res: any) => {
    try {
      const [
        totalUsers,
        totalCommunities,
        totalMessages,
        totalReports,
        totalActiveUsers,
      ] = await Promise.all([
        prisma.user.count({ where: { role: "USER" } }),
        prisma.community.count(),
        prisma.communityMessage.count(),
        prisma.report.count(),
        prisma.user.count({ where: { isActive: true } }),
      ]);

      return sendResponse(res, 200, "Dashboard stats fetched successfully", {
        totalUsers,
        totalCommunities,
        totalMessages,
        totalReports,
        totalActiveUsers,
      });
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error fetching dashboard stats", null);
    }
  },

  // Search admin profile by username — SUPER ADMIN ONLY
  searchAdminProfile: async (req: any, res: any) => {
    const { username } = req.body;
    try {
      const admin = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          username: true,
          role: true,
        },
      });

      if (!admin) {
        return sendResponse(res, 404, "Admin not found", null);
      }

      return sendResponse(
        res,
        200,
        "Admin profile retrieved successfully",
        admin,
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error fetching admin profile", null);
    }
  },

  // Update admin own profile
  updateAdminProfile: async (req: any, res: any) => {
    const adminId = req.userId;
    const { firstName, lastName, email, username } = req.body;
    try {
      const updatedAdmin = await prisma.user.update({
        where: { id: adminId },
        data: { firstName, lastName, email, username },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          username: true,
          role: true,
        },
      });
      return sendResponse(
        res,
        200,
        "Admin profile updated successfully",
        updatedAdmin,
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error updating admin profile", null);
    }
  },

  // Delete admin own account
  deleteAdminAccount: async (req: any, res: any) => {
    const adminId = req.userId;
    try {
      await prisma.user.delete({ where: { id: adminId } });

      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });

      return sendResponse(res, 200, "Admin account deleted successfully", null);
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error deleting admin account", null);
    }
  },

  // Super admin dashboard — SUPER ADMIN ONLY
  superAdminDashboard: async (req: any, res: any) => {
    try {
      const [totalAdmins, totalSuperAdmins, totalUsers] = await Promise.all([
        prisma.user.count({ where: { role: "ADMIN" } }),
        prisma.user.count({ where: { role: "SUPER_ADMIN" } }),
        prisma.user.count({ where: { role: "USER" } }),
      ]);

      return sendResponse(res, 200, "Super admin dashboard stats", {
        totalAdmins,
        totalSuperAdmins,
        totalUsers,
      });
    } catch (error) {
      console.error(error);
      return sendResponse(
        res,
        500,
        "Error fetching super admin dashboard stats",
        null,
      );
    }
  },

  // Get admin activity logs by username — SUPER ADMIN ONLY
  superGetAdminActivityLogs: async (req: any, res: any) => {
    const { username } = req.body;
    try {
      const admin = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          username: true,
          lastLogin: true,
          adminLogs: true,
        },
      });

      if (!admin) {
        return sendResponse(res, 404, "Admin not found", null);
      }

      return sendResponse(
        res,
        200,
        "Admin activity logs retrieved successfully",
        admin,
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error fetching admin activity logs", null);
    }
  },

  // Get all admin activity logs
  getAdminActivityLogs: async (req: any, res: any) => {
    try {
      const logs = await prisma.adminActivityLog.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true,
              role: true,
            },
          },
        },
      });
      return sendResponse(
        res,
        200,
        "Admin activity logs retrieved successfully",
        logs,
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error fetching admin activity logs", null);
    }
  },

  // Get user activity logs by username
  getUserActivityLogs: async (req: any, res: any) => {
    const { username } = req.body;
    try {
      const logs = await prisma.userActivityLog.findMany({
        where: { user: { username } },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true,
              role: true,
            },
          },
        },
      });
      return sendResponse(
        res,
        200,
        "User activity logs retrieved successfully",
        logs,
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Error fetching user activity logs", null);
    }
  },

  SignOut: async (req: any, res: any) => {
    try {
      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        expire: new Date(0),
      });

      // return res.status(200).json({
      //   message: "Signed out successfully",
      // });
      return sendResponse(res, 200, "Signed out successfully");
    } catch (error) {
      // return res.status(500).json({
      //   message: "Internal server error",
      // });
      return sendResponse(res, 500, "Internal server error");
    }
  },
};

export default AdminController;
