import { Hono } from "hono";
import type { AppEnv } from "../../config/app";

export const statisticsRouter = new Hono<AppEnv>();

// TODO: Check if organization check is necessary

statisticsRouter.get("/", async (c) => {

});
