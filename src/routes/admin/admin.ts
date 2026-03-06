import { Hono } from "hono";

import { organizationsRouter } from "./organizations";
import { requireAuth } from "../middleware";

export const adminRouter = new Hono();

adminRouter.use("/organizations/*", requireAuth("admin"));
adminRouter.route("/organizations", organizationsRouter);