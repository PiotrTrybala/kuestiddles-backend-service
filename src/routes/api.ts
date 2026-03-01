import { Hono } from "hono";

import { adminRouter } from "./admin/admin";
import { userRouter } from "./user/user";
import { requireAuth } from "./middleware";
import { avatarsRouter } from "./avatars";
import { mobileRouter } from "./mobile";

export const api = new Hono().basePath("/v1");


api.use("/admin", requireAuth("admin"));
api.route("/admin", adminRouter);

api.use("/user", requireAuth("user"));
api.route("/user", userRouter);

api.use("/avatars", requireAuth("none")); // access both user and admin to this router
api.route("/avatars", avatarsRouter);

api.route("/mobile", mobileRouter);