import { Hono } from "hono";
import { requireAuth } from "../middleware";
import { organizationsRouter } from "./organizations";

export const userRouter = new Hono();

userRouter.use("/organizations/*", requireAuth("user"));
userRouter.route("/organizations", organizationsRouter);