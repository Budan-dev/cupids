import express from "express";
import cors from "cors";
import "dotenv/config";
import userRouter from "./api/router/userRouter.js";
import adminRouter from "./api/router/adminRouter.js";
import communityRouter from "./api/router/communityRouter.js";
import messageRouter from "./api/router/messageRouter.js";
import privateMessageRouter from "./api/router/privateMessageRouter.js";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./swagger/swagger.js";

import authRoutes from "./api/router/authRouter.js";

const app = express();

const PORT = process.env.PORT || 8080;

app.use(
  cors({
    origin: [
      "https://cupid-frontend.vercel.app", // stable production URL
      "https://cupid-frontend-cheo9nr3u-suleman-bababudans-projects.vercel.app", // preview
      "http://localhost:8080", // local dev
    ],
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", (req, res) => {
  res.send(" Cupid Heart is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRouter);
app.use("/api/community", communityRouter);
app.use("/api/message", messageRouter);
app.use("/api/privatemessage", privateMessageRouter);

app.use("/api/admin", adminRouter);

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
  },
);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
