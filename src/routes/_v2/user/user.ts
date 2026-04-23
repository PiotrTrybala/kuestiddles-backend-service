import { Hono } from "hono";
import { organizationsRouter } from "./organizations";
import { requireAuth } from "../../middleware";
import { statisticsRouter } from "./statistics";
import { userAuthRouter } from "./auth";

export const userRouter = new Hono();

userRouter.use("/organizations/*", requireAuth("user"));
userRouter.route("/organizations", organizationsRouter);

userRouter.route("/auth", userAuthRouter);
userRouter.route("/statistics", statisticsRouter);

