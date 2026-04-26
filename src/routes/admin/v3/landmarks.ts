import type { AppEnv } from "@/config/app";
import { Hono } from "hono";

export const landmarksRouter = new Hono<AppEnv>();