import type { AppEnv } from "@/config/app";
import { Hono } from "hono";

export const v3Router = new Hono<AppEnv>();