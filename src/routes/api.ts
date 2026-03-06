import { Hono } from "hono";

import { adminRouter } from "./admin/admin";
import { userRouter } from "./user/user";
import { requireAuth } from "./middleware";
import { avatarsRouter } from "./avatars";
import { mobileRouter } from "./mobile";

export const api = new Hono().basePath("/v1");

api.route("/admin", adminRouter);
api.route("/user", userRouter);
api.route("/avatars", avatarsRouter);

api.route("/mobile", mobileRouter);