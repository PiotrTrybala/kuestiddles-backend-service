import { Hono } from "hono";

import { adminRouter } from "./admin/admin";
import { userRouter } from "./user/user";
import { publicRouter } from "./public/public";
import { authRouter } from "./auth/auth";
import { requireUser } from "./user/middleware";

export const api = new Hono().basePath("/v1");

api.use("*", requireUser);

api.route("/admin", adminRouter);
api.route("/user", userRouter);
api.route("/public", publicRouter);
api.route("/auth", authRouter);