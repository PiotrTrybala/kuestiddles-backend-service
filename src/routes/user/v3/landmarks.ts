import type { AppEnv } from "@/config/app";
import { Hono } from "hono";

export const landmarksRouter = new Hono<AppEnv>();

landmarksRouter.get("/search", async (c) => {

});

landmarksRouter.get("/:id", async (c) => {

});

landmarksRouter.post("/visit", async (c) => {

});