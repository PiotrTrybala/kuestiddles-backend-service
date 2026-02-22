import { Hono } from "hono";

import { adminRouter } from "./admin/admin";
import { userRouter } from "./user/user";
import { publicRouter } from "./public/public";

export const api = new Hono().basePath("/v1");

api.route("/admin", adminRouter);
api.route("/user", userRouter);
api.route("/public", publicRouter);