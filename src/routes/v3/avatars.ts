import type { AppEnv } from "@/config/app";
import { Hono } from "hono";

export const avatarsRouter = new Hono<AppEnv>();