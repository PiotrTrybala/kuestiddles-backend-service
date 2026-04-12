import { Hono } from "hono";
import type { AppEnv } from "../../../config/app";

export const settingsRouter = new Hono<AppEnv>();

// TODO: Check if organization check is necessary

settingsRouter.get("/", async (c) => {

});

settingsRouter.patch("/", async (c) => {

});

settingsRouter.post("/enableMfa", async (c) => {

});

settingsRouter.post("/verifyMfa", async (c) => {

});