import { Hono } from "hono";

import { requireAdmin } from "./middleware";
import { organizationsRouter } from "./organizations";

export const adminRouter = new Hono();

adminRouter.use("*", requireAdmin);

adminRouter.route("/organizations", organizationsRouter);