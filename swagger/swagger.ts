const responseSchema = {
  type: "object",
  properties: {
    message: { type: "string", example: "Request successful" },
    data: {},
  },
};

const body = (schema: string) => ({
  required: true,
  content: {
    "application/json": {
      schema: { $ref: `#/components/schemas/${schema}` },
    },
  },
});

const parameter = (name: string, description: string, required = true) => ({
  name,
  in: "path",
  required,
  description,
  schema: { type: "string" },
});

const operation = (
  summary: string,
  options: {
    auth?: "all" | "user" | "admin" | "superAdmin";
    body?: string;
    parameters?: Record<string, string>;
    query?: Record<string, string>;
  } = {},
) => ({
  summary,
  tags: [
    options.auth === "superAdmin"
      ? "Super Admin"
      : options.auth === "admin"
        ? "Admin"
        : options.auth === "user"
          ? "User"
          : "Universal",
  ],
  ...(options.auth
    ? {
        security: [
          {
            [options.auth === "superAdmin"
              ? "superAdminCookieAuth"
              : options.auth === "admin"
                ? "adminCookieAuth"
                : options.auth === "user"
                  ? "userCookieAuth"
                  : "authenticatedCookieAuth"]: [],
          },
        ],
      }
    : {}),
  ...(options.parameters
    ? {
        parameters: Object.entries(options.parameters).map(
          ([name, description]) => parameter(name, description),
        ),
      }
    : {}),
  ...(options.query
    ? {
        parameters: Object.entries(options.query).map(
          ([name, description]) => ({
            name,
            in: "query",
            required: false,
            description,
            schema: { type: "string" },
          }),
        ),
      }
    : {}),
  ...(options.body ? { requestBody: body(options.body) } : {}),
  responses: {
    "200": {
      description: "Request successful",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ApiResponse" },
        },
      },
    },
    "400": { description: "Invalid request" },
    "401": { description: "Authentication required or token invalid" },
    "403": { description: "Insufficient permissions" },
    "404": { description: "Resource not found" },
    "500": { description: "Internal server error" },
  },
});

export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Cupid API",
    version: "1.0.0",
    description:
      "Authentication, community, messaging, and administration API for Cupid.",
  },
  // servers: [{ url: "http://localhost:8080", description: "Local development" }],
  tags: [
    {
      name: "Universal",
      description:
        "Public endpoints and endpoints available to all authenticated roles",
    },
    { name: "User", description: "Endpoints available to regular users" },
    {
      name: "Admin",
      description: "Endpoints available to admins and super admins",
    },
    {
      name: "Super Admin",
      description: "Endpoints available only to super admins",
    },
  ],
  components: {
    securitySchemes: {
      authenticatedCookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
        description:
          "HTTP-only JWT cookie. Authentication is required; any role may use this endpoint.",
      },
      userCookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
        description: "HTTP-only JWT cookie for a regular USER account.",
      },
      adminCookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
        description:
          "HTTP-only JWT cookie for an ADMIN or SUPER_ADMIN account.",
      },
      superAdminCookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
        description: "HTTP-only JWT cookie for a SUPER_ADMIN account.",
      },
    },
    schemas: {
      ApiResponse: responseSchema,
      SignIn: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "Password123!",
          },
        },
      },
      SignUp: {
        type: "object",
        required: ["firstName", "lastName", "email", "password", "username"],
        properties: {
          firstName: { type: "string", example: "Ada" },
          lastName: { type: "string", example: "Lovelace" },
          email: {
            type: "string",
            format: "email",
            example: "ada@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "Password123!",
          },
          username: { type: "string", example: "ada" },
        },
      },
      UpdateProfile: {
        type: "object",
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          username: { type: "string" },
          email: { type: "string", format: "email" },
        },
      },
      ChangePassword: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: { type: "string", format: "password" },
          newPassword: { type: "string", format: "password" },
        },
      },
      Avatar: {
        type: "object",
        required: ["avatarUrl"],
        properties: { avatarUrl: { type: "string", format: "uri" } },
      },
      Community: {
        type: "object",
        required: ["name", "description"],
        properties: {
          name: { type: "string", example: "Book Club" },
          description: { type: "string", example: "A community for readers" },
        },
      },
      Content: {
        type: "object",
        required: ["content"],
        properties: { content: { type: "string", example: "Hello there!" } },
      },
      PasswordReset: {
        type: "object",
        required: ["email"],
        properties: { email: { type: "string", format: "email" } },
      },
      AdminAccount: {
        allOf: [{ $ref: "#/components/schemas/SignUp" }],
      },
      BanReason: {
        type: "object",
        required: ["reason"],
        properties: { reason: { type: "string" } },
      },
      Search: {
        type: "object",
        properties: { search: { type: "string" } },
      },
      AdminProfile: {
        type: "object",
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          username: { type: "string" },
          email: { type: "string", format: "email" },
        },
      },
      ForgotPassword: {
        type: "object",
        required: ["email"],
        properties: { email: { type: "string", format: "email" } },
      },
      ResetPassword: {
        type: "object",
        required: ["token", "password"],
        properties: {
          token: { type: "string" },
          password: { type: "string", format: "password" },
        },
      },
    },
  },
  paths: {
    "/api/auth/me": {
      get: operation("Authenticated profile", { auth: "all" }),
    },
    "/api/user/signin": { post: operation("User sign in", { body: "SignIn" }) },
    "/api/user/signup": { post: operation("User sign up", { body: "SignUp" }) },
    "/api/user/me": { get: operation("User profile", { auth: "user" }) },
    "/api/user/profile": {
      get: operation("User profile", { auth: "user" }),
      put: operation("Update user profile", {
        auth: "user",
        body: "UpdateProfile",
      }),
    },
    "/api/user/change-password": {
      put: operation("Change user password", {
        auth: "user",
        body: "ChangePassword",
      }),
    },
    "/api/user/profile/avatar": {
      put: operation("Update user avatar", { auth: "user", body: "Avatar" }),
      delete: operation("Remove user avatar", { auth: "user" }),
    },
    "/api/user/user/{username}": {
      get: operation("Public user profile", {
        parameters: { username: "Username" },
      }),
    },
    "/api/user/user/{username}/communities": {
      get: operation("User communities", {
        parameters: { username: "Username" },
      }),
    },
    "/api/user/search/users": {
      get: operation("Search users", { query: { search: "Search term" } }),
    },
    "/api/user/notifications": {
      get: operation("User notifications", { auth: "user" }),
    },
    "/api/user/notifications/read": {
      put: operation("Mark notifications read", { auth: "user" }),
    },
    "/api/user/sessions": { get: operation("User sessions", { auth: "user" }) },
    "/api/user/sessions/{id}": {
      delete: operation("Delete user session", {
        auth: "user",
        parameters: { id: "Session ID" },
      }),
    },
    "/api/user/signout": { post: operation("User sign out", { auth: "user" }) },
    "/api/user/delete": {
      delete: operation("Delete user account", { auth: "user" }),
    },
    "/api/user/resetpassword": {
      post: operation("Reset password", { body: "ResetPassword" }),
    },
    "/api/user/forgottenpassword": {
      post: operation("Forgotten password", { body: "ForgotPassword" }),
    },
    "/api/community/createcommunity": {
      post: operation("Create community", { auth: "user", body: "Community" }),
    },
    "/api/community/": { get: operation("List communities", { auth: "user" }) },
    "/api/community/{communityId}": {
      get: operation("Get community", {
        auth: "user",
        parameters: { communityId: "Community ID" },
      }),
    },
    "/api/community/{communityId}/members": {
      get: operation("Community members", {
        auth: "user",
        parameters: { communityId: "Community ID" },
      }),
    },
    "/api/community/{communityId}/join": {
      post: operation("Join community", {
        auth: "user",
        parameters: { communityId: "Community ID" },
      }),
    },
    "/api/community/{communityId}/leave": {
      delete: operation("Leave community", {
        auth: "user",
        parameters: { communityId: "Community ID" },
      }),
    },
    "/api/message/{communityId}/send": {
      post: operation("Send community message", {
        auth: "user",
        body: "Content",
        parameters: { communityId: "Community ID" },
      }),
    },
    "/api/message/{communityId}/messages": {
      get: operation("Get community messages", {
        auth: "user",
        parameters: { communityId: "Community ID" },
      }),
    },
    "/api/message/{messageId}/view": {
      post: operation("View community message", {
        auth: "user",
        parameters: { messageId: "Message ID" },
      }),
    },
    "/api/message/{messageId}/delete": {
      delete: operation("Delete community message", {
        auth: "user",
        parameters: { messageId: "Message ID" },
      }),
    },
    "/api/privatemessage/send/{receiverUsername}": {
      post: operation("Send private message", {
        auth: "user",
        body: "Content",
        parameters: { receiverUsername: "Receiver username" },
      }),
    },
    "/api/privatemessage/": {
      get: operation("Get private messages", { auth: "user" }),
    },
    "/api/privatemessage/delete/{messageId}": {
      post: operation("Delete private message", {
        auth: "user",
        parameters: { messageId: "Message ID" },
      }),
      delete: operation("Delete private message", {
        auth: "user",
        parameters: { messageId: "Message ID" },
      }),
    },
    "/api/privatemessage/mark-as-read/{messageId}": {
      post: operation("Mark private message read", {
        auth: "user",
        parameters: { messageId: "Message ID" },
      }),
    },
    "/api/admin/signin-admin": {
      post: operation("Admin sign in", { body: "SignIn" }),
    },
    "/api/admin/create-adminaccount": {
      post: operation("Create admin account", {
        auth: "superAdmin",
        body: "AdminAccount",
      }),
    },
    "/api/admin/search-admin-profile": {
      get: operation("Search admin profile", {
        auth: "superAdmin",
        query: { search: "Search term" },
      }),
    },
    "/api/admin/super-admin-dashboard": {
      get: operation("Super admin dashboard", { auth: "superAdmin" }),
    },
    "/api/admin/superadmin-get-admins-activity-logs": {
      get: operation("Admin activity logs for super admin", {
        auth: "superAdmin",
      }),
    },
    "/api/admin/all-users": {
      get: operation("List all users", { auth: "admin" }),
    },
    "/api/admin/ban/{id}": {
      post: operation("Ban user", {
        auth: "admin",
        body: "BanReason",
        parameters: { id: "User ID" },
      }),
    },
    "/api/admin/unban/{id}": {
      post: operation("Unban user", {
        auth: "admin",
        parameters: { id: "User ID" },
      }),
    },
    "/api/admin/get-communities": {
      get: operation("List communities for admin", { auth: "admin" }),
    },
    "/api/admin/search-communities": {
      post: operation("Search communities", { auth: "admin", body: "Search" }),
    },
    "/api/admin/ban-community/{id}": {
      post: operation("Ban community", {
        auth: "admin",
        body: "BanReason",
        parameters: { id: "Community ID" },
      }),
    },
    "/api/admin/unban-community/{id}": {
      post: operation("Unban community", {
        auth: "admin",
        parameters: { id: "Community ID" },
      }),
    },
    "/api/admin/delete-community/{id}": {
      delete: operation("Delete community", {
        auth: "admin",
        parameters: { id: "Community ID" },
      }),
    },
    "/api/admin/get-reports": {
      get: operation("List reports", { auth: "admin" }),
    },
    "/api/admin/resolve-report/{id}": {
      post: operation("Resolve report", {
        auth: "admin",
        parameters: { id: "Report ID" },
      }),
    },
    "/api/admin/ignore-report/{id}": {
      post: operation("Ignore report", {
        auth: "admin",
        parameters: { id: "Report ID" },
      }),
    },
    "/api/admin/get-user-profile/{id}": {
      get: operation("Get user profile for admin", {
        auth: "admin",
        parameters: { id: "User ID" },
      }),
    },
    "/api/admin/user/{id}/notifications": {
      get: operation("Get user notifications for admin", {
        auth: "admin",
        parameters: { id: "User ID" },
      }),
    },
    "/api/admin/user/{id}/notifications/read": {
      put: operation("Mark user notifications read", {
        auth: "admin",
        parameters: { id: "User ID" },
      }),
    },
    "/api/admin/user/{id}/sessions": {
      get: operation("Get user sessions for admin", {
        auth: "admin",
        parameters: { id: "User ID" },
      }),
    },
    "/api/admin/user/{id}/sessions/{sessionId}/revoke": {
      post: operation("Revoke user session", {
        auth: "admin",
        parameters: { id: "User ID", sessionId: "Session ID" },
      }),
    },
    "/api/admin/user/{id}/sessions/revoke-all": {
      post: operation("Revoke all user sessions", {
        auth: "admin",
        parameters: { id: "User ID" },
      }),
    },
    "/api/admin/get-dashboard-stats": {
      get: operation("Admin dashboard statistics", { auth: "admin" }),
    },
    "/api/admin/update-profile": {
      post: operation("Update admin profile", {
        auth: "admin",
        body: "AdminProfile",
      }),
    },
    "/api/admin/delete-profile": {
      delete: operation("Delete admin account", { auth: "admin" }),
    },
    "/api/admin/admin-activity-logs": {
      get: operation("Admin activity logs", { auth: "admin" }),
    },
    "/api/admin/user-activity-logs": {
      get: operation("User activity logs", { auth: "admin" }),
    },
    "/api/admin/signout": {
      post: operation("Admin sign out", { auth: "admin" }),
    },
  },
};
