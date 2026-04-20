import { Hono } from "hono";

import { settingsRouter } from "./v2/settings/settings";
import { adminRouter } from "./admin/v3/admin";
import { userRouter } from "./user/v3/user";
import { v3Router } from "./v3/v3";

export const api = new Hono();

api.route("/admin", adminRouter);
api.route("/user", userRouter);
api.route("/v3", v3Router);

// api.route("/settings", settingsRouter);
// api.route("/admin", adminRouter);
// api.route("/user", userRouter);