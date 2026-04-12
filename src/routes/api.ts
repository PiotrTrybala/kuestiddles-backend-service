import { Hono } from "hono";

import { adminRouter } from "./v2/admin/admin";
import { userRouter } from "./v2/user/user";
import { settingsRouter } from "./v2/settings/settings";

export const api = new Hono().basePath("/v2");

api.route("/settings", settingsRouter);
api.route("/admin", adminRouter);
api.route("/user", userRouter);