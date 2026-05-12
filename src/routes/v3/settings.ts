import type { AppEnv } from "@/config/app";
import { Hono } from "hono";

export const settingsRouter = new Hono<AppEnv>();

settingsRouter.patch("/", async (c) => {

});