import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { prisma } from "../utils/prisma.js";
import sendResponse from "../utils/response.js";
import {
  generateToken,
  getHashPassword,
  validateSignIn,
  validateSignup,
} from "../utils/helper.js";
import { sendEmail } from "../utils/sendEmail.js";

const UserController = {
  SignUp: async (req: any, res: any) => {
    const { firstName, lastName, email, password, username } = req.body;

    try {
      const { valid, message } = validateSignup(req.body);
      if (!valid) {
        return sendResponse(res, 400, message || "Invalid input");
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return sendResponse(res, 409, "User already exists");
      }

      const hashedPassword = await getHashPassword(password);

      const newUser = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          role: "USER",
          username,
        },
      });

      const superAdmins = await prisma.user.findMany({
        where: { role: "SUPER_ADMIN" },
        select: { email: true, firstName: true },
      });

      if (superAdmins.length > 0) {
        await Promise.all(
          superAdmins.map(
            (admin: { email: string; firstName: string | null }) =>
              sendEmail({
                to: admin.email,
                subject: "New User Signup on Cupid",
                html: `
              <h2>New User Registered</h2>
              <p>Hi ${admin.firstName},</p>
              <p>A new user has just signed up on Cupid:</p>
              <table>
                <tr>
                  <td><strong>Name:</strong></td>
                  <td>${firstName} ${lastName}</td>
                </tr>
                <tr>
                  <td><strong>Email:</strong></td>
                  <td>${email}</td>
                </tr>
                <tr>
                  <td><strong>Username:</strong></td>
                  <td>@${username}</td>
                </tr>
                <tr>
                  <td><strong>Joined:</strong></td>
                  <td>${new Date().toUTCString()}</td>
                </tr>
              </table>
              <br/>
              <p>Best regards,<br/>Cupid Team</p>
            `,
              }),
          ),
        );
      }

      await Promise.all([
        prisma.notification.create({
          data: {
            userId: newUser.id,
            title: "Welcome!",
            message: "Welcome to Cupid. Your account is ready to use.",
            type: "WELCOME",
          },
        }),
        prisma.userSession.create({
          data: {
            userId: newUser.id,
            userAgent: req.get("user-agent") || "Unknown device",
            ipAddress: req.ip || "unknown",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        }),
      ]);

      const { password: _, ...userWithoutPassword } = newUser;

      try {
        await sendEmail({
          to: email,
          subject: "Welcome to Cupid",
          html: `
            <h2>Welcome to Cupid!</h2>
            <p>Hi ${firstName},</p>
            <p>Thank you for signing up on Cupid. Your account has been successfully created.</p>
            <p>We are excited to have you on board. Start exploring and connecting with others!</p>
            <br/>
            <p>Best regards,<br/>Cupid Team</p>
          `,
        });
      } catch (emailError) {
        console.warn("Welcome email could not be sent:", emailError);
      }

      return sendResponse(res, 201, "Signup successful", userWithoutPassword);
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal server error");
    }
  },

  SignIn: async (req: any, res: any) => {
    const { email, password } = req.body;

    try {
      const { valid, message } = validateSignIn(req.body);
      if (!valid) {
        return sendResponse(res, 400, message || "Invalid input");
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return sendResponse(res, 401, "Invalid credentials");
      }
      if (user.role !== "USER") {
        return sendResponse(
          res,
          403,
          "Account not found. Please use the admin portal.",
        );
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return sendResponse(res, 401, "Invalid credentials");
      }

      const token = generateToken(user.id, user.email, user.role);

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      await prisma.userSession.create({
        data: {
          userId: user.id,
          userAgent: req.get("user-agent") || "Unknown device",
          ipAddress: req.ip || "unknown",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Welcome Back!",
          message: "You have successfully signed in to your account.",
          type: "SIGNIN",
        },
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return sendResponse(res, 200, `Sign in successful, ${user.firstName}!`, {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          username: user.username,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
      });
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal server error");
    }
  },

  Profile: async (req: any, res: any) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return sendResponse(res, 401, "Authentication required");
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          username: true,
          role: true,
          avatarUrl: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
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
        return sendResponse(res, 404, "User not found");
      }

      return sendResponse(res, 200, "Profile retrieved successfully", user);
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal server error");
    }
  },

  UpdateProfile: async (req: any, res: any) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return sendResponse(res, 401, "Authentication required");
      }

      const { firstName, lastName, username, email } = req.body;
      const updates: Record<string, string> = {};

      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (username !== undefined) updates.username = username;
      if (email !== undefined) updates.email = email;

      if (Object.keys(updates).length === 0) {
        return sendResponse(res, 400, "No profile fields provided");
      }

      if (username) {
        const existingUsername = await prisma.user.findFirst({
          where: {
            username,
            NOT: { id: userId },
          },
        });

        if (existingUsername) {
          return sendResponse(res, 409, "Username is already taken");
        }
      }

      if (email) {
        const existingEmail = await prisma.user.findFirst({
          where: {
            email,
            NOT: { id: userId },
          },
        });

        if (existingEmail) {
          return sendResponse(res, 409, "Email is already in use");
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updates,
      });

      const { password: _, ...safeUser } = updatedUser;
      return sendResponse(res, 200, "Profile updated successfully", safeUser);
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal server error");
    }
  },

  ChangePassword: async (req: any, res: any) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return sendResponse(res, 401, "Authentication required");
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return sendResponse(
          res,
          400,
          "Current password and new password are required",
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
      });

      if (!user) {
        return sendResponse(res, 404, "User not found");
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return sendResponse(res, 401, "Current password is incorrect");
      }

      const hashedPassword = await getHashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return sendResponse(res, 200, "Password changed successfully");
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal server error");
    }
  },

  UpdateAvatar: async (req: any, res: any) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return sendResponse(res, 401, "Authentication required");
      }

      const { avatarUrl } = req.body;
      if (!avatarUrl) {
        return sendResponse(res, 400, "avatarUrl is required");
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
        select: { avatarUrl: true },
      });

      return sendResponse(
        res,
        200,
        "Profile picture updated successfully",
        updatedUser,
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal server error");
    }
  },

  RemoveAvatar: async (req: any, res: any) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return sendResponse(res, 401, "Authentication required");
      }

      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: null },
      });

      return sendResponse(res, 200, "Profile picture removed successfully");
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal server error");
    }
  },

  SignOut: async (req: any, res: any) => {
    try {
      await prisma.userSession.updateMany({
        where: {
          userId: req.userId,
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        data: {
          revokedAt: new Date(),
          isActive: false,
        },
      });

      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });

      return sendResponse(res, 200, "Signed out successfully");
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal server error");
    }
  },

  ResetPassword: async (req: any, res: any) => {
    const { token, newPassword } = req.body;
    try {
      const user = await prisma.user.findUnique({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date(),
          },
        },
      });
      if (!user) {
        return sendResponse(res, 400, "Invalid or expired token");
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      return sendResponse(res, 200, "Password reset successful");
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal server error");
    }
  },

  ForgottenPassword: async (req: any, res: any) => {
    const { email } = req.body;
    try {
      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      });
      if (!user) {
        return sendResponse(res, 404, "User not found");
      }

      const resetToken = randomUUID();
      const resetTokenExpiry = new Date(Date.now() + 3600000);

      await prisma.user.update({
        where: {
          email,
        },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      await sendEmail({
        to: email,
        subject: "Password Reset Instructions",
        html: `
          <p>Dear ${user.firstName},</p>
          <p>You have requested to reset your password. Please click the link below to reset your password:</p>
          <a href="https://cupid-frontend.vercel.app/reset-password?token=${resetToken}" target="_blank">Reset Password</a>
          <p>If you did not request this, please ignore this email.</p>
        `,
      });

      return sendResponse(
        res,
        200,
        "Password reset instructions sent to email",
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal server error");
    }
  },

  DeleteAccount: async (req: any, res: any) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return sendResponse(res, 401, "Authentication required");
      }

      await prisma.user.delete({
        where: {
          id: userId,
        },
      });
      return sendResponse(res, 200, "Account deleted successfully");
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal server error");
    }
  },

  GetPublicUserProfile: async (req: any, res: any) => {
    try {
      const { username } = req.params;
      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
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
        return sendResponse(res, 404, "User not found");
      }

      return sendResponse(res, 200, "User profile fetched successfully", user);
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal server error");
    }
  },

  GetUserCommunities: async (req: any, res: any) => {
    try {
      const { username } = req.params;
      const targetUser = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });

      if (!targetUser) {
        return sendResponse(res, 404, "User not found");
      }

      const communities = await prisma.communityMember.findMany({
        where: { userId: targetUser.id },
        select: {
          role: true,
          joinedAt: true,
          community: {
            select: {
              id: true,
              name: true,
              description: true,
              createdAt: true,
            },
          },
        },
      });

      return sendResponse(
        res,
        200,
        "User communities fetched successfully",
        communities,
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal server error");
    }
  },

  SearchUsers: async (req: any, res: any) => {
    try {
      const search = String(
        req.query.q || req.query.query || req.query.name || "",
      ).trim();
      if (!search) {
        return sendResponse(res, 400, "Search query is required");
      }

      const users = await prisma.user.findMany({
        where: {
          role: "USER",
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { username: { contains: search } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          avatarUrl: true,
          role: true,
        },
        take: 20,
      });

      return sendResponse(res, 200, "Users fetched successfully", users);
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal server error");
    }
  },

  GetNotifications: async (req: any, res: any) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return sendResponse(res, 401, "Authentication required");
      }

      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
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
        "Notifications fetched successfully",
        notifications,
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal server error");
    }
  },

  MarkNotificationsRead: async (req: any, res: any) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return sendResponse(res, 401, "Authentication required");
      }

      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });

      return sendResponse(res, 200, "Notifications marked as read");
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal server error");
    }
  },

  GetSessions: async (req: any, res: any) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return sendResponse(res, 401, "Authentication required");
      }

      const sessions = await prisma.userSession.findMany({
        where: {
          userId,
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          userAgent: true,
          ipAddress: true,
          createdAt: true,
          lastActiveAt: true,
          expiresAt: true,
          isActive: true,
        },
      });

      const formattedSessions = sessions.map(
        (session: (typeof sessions)[number], index: number) => ({
          ...session,
          current: index === 0,
        }),
      );

      return sendResponse(
        res,
        200,
        "Active sessions fetched successfully",
        formattedSessions,
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal server error");
    }
  },

  DeleteSession: async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const userId = req.userId;
      if (!userId) {
        return sendResponse(res, 401, "Authentication required");
      }

      const targetSession =
        id === "current-session" || id === "current"
          ? await prisma.userSession.findFirst({
              where: {
                userId,
                revokedAt: null,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
              orderBy: { createdAt: "desc" },
            })
          : await prisma.userSession.findFirst({
              where: { id, userId },
            });

      if (!targetSession) {
        return sendResponse(res, 404, "Session not found");
      }

      await prisma.userSession.update({
        where: { id: targetSession.id },
        data: {
          revokedAt: new Date(),
          isActive: false,
        },
      });

      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });

      return sendResponse(res, 200, "Session ended successfully");
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Internal server error");
    }
  },
};

export default UserController;
