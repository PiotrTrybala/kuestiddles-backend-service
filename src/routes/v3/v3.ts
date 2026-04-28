import type { AppEnv } from "@/config/app";
import { Hono } from "hono";
import { requireAuth } from "../middleware";
import { avatarsRouter } from "./avatars";

export const v3Router = new Hono<AppEnv>();

// v3Router.use("*", requireAuth("none"));
v3Router.route("/avatars", avatarsRouter);
