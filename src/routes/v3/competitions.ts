import type { AppEnv } from "@/config/app";
import { Hono } from "hono";

export const competitionsRouter = new Hono<AppEnv>();

competitionsRouter.get("/groups/current", async (c) => {

});

competitionsRouter.post("/groups/solve", async (c) => {

});

competitionsRouter.get("/groups/accept", async (c) => {

});