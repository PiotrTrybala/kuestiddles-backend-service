import type { AppEnv } from "@/config/app";
import { Hono } from "hono";
import { avatarsRouter } from "./avatars";
import { competitionsRouter } from "./competitions";
import { authRouter } from "./auth";
import { requireAuth } from "../middleware";
import { imagesRouter } from "./images";

export const v3Router = new Hono<AppEnv>();

// v3Router.use("*", requireAuth("none"));
v3Router.route("/auth", authRouter);
v3Router.route("/avatars", avatarsRouter);
v3Router.route("/competitions", competitionsRouter);
v3Router.route("/images", imagesRouter);
