import { Hono } from "hono";

import { organizationsRouter } from "./organizations";
import { requireAuth } from "@/routes/middleware";

export const adminRouter = new Hono();

adminRouter.use("/organizations/*", requireAuth("admin"));
adminRouter.route("/organizations", organizationsRouter);