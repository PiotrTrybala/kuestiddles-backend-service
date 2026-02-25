import { Hono } from "hono";

import { adminRouter } from "./admin/admin";
import { userRouter } from "./user/user";
import { publicRouter } from "./public/public";
import { avatarRouter } from "./auth/avatar";
import { requireUser } from "./user/middleware";
import { mobileRouter } from "./auth/mobile";

export const api = new Hono().basePath("/v1");

api.use("/admin", requireUser);
api.use("/user", requireUser);

api.route("/admin", adminRouter);
api.route("/user", userRouter);
api.route("/public", publicRouter);

api.route("/avatars", avatarRouter);
api.route("/mobile", mobileRouter);